import "server-only";
import { validateSpec } from "@/lib/spec/validate";
import type { SceneSpec } from "@/lib/spec/schema";
import { ContentSchema } from "@/lib/spec/schema";
import { getTemplate } from "@/lib/templates/registry";
import {
  matchSystemPrompt,
  matchUserPrompt,
  composeSystemPrompt,
  composeUserPrompt,
  templateSystemPrompt,
  templateUserPrompt,
  retryNote,
  getTemplateForMatch,
} from "./prompts";
import { getFixture } from "@/fixtures";
import { LIMITS } from "@/config/app-config";
import type { AIClient } from "./client";
import type { UsageRepository } from "@/lib/storage/types";
import { utcToday } from "@/lib/storage/types";

/**
 * Generation pipeline (Task 6): match → template fill or compose → validate
 * → retry with errors (max 2) → messages on failure. In Live mode every
 * DeepSeek call is checked against AI_DAILY_CAP before and recorded after.
 * In Fixture mode the pipeline returns recorded output and never touches
 * the counter.
 */

export type GenerateResult =
  | { status: "unsupported"; reason: string; callsUsed: number }
  | { status: "success"; spec: SceneSpec; source: string; callsUsed: number }
  | { status: "error"; message: string; callsUsed: number };

export interface GenerateDeps {
  mode: "live" | "fixture";
  /** Null in fixture mode (or when credentials are missing). */
  client: AIClient | null;
  usage: UsageRepository;
  dailyCap: number;
  model?: string;
}

export const MESSAGES = {
  unsupportedIntro: "This concept isn't supported yet",
  buildFailed: "Couldn't build this concept. Try rephrasing it.",
  fixtureOnly: "Fixture mode: only the sample concepts are available",
  capReached: "The daily AI limit has been reached. Please try again tomorrow.",
} as const;

/** Parse a model reply into JSON, treating empty/cut-off replies as failures. */
export function parseJSONReply(
  content: string,
): { ok: true; json: unknown } | { ok: false; error: string } {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false, error: "Empty reply from the model" };
  try {
    return { ok: true, json: JSON.parse(trimmed) };
  } catch {
    return { ok: false, error: "Reply was not valid JSON (possibly cut off)" };
  }
}

export async function generateExperience(
  concept: string,
  deps: GenerateDeps,
): Promise<GenerateResult> {
  if (deps.mode === "fixture" || !deps.client) {
    return fixtureResult(concept);
  }

  const date = utcToday();
  let callsUsed = 0;

  // One DeepSeek call: cap-checked before, recorded after.
  const callOnce = async (
    system: string,
    user: string,
    maxTokens: number,
  ): Promise<{ ok: true; content: string } | { ok: false; error: string }> => {
    const current = await deps.usage.getCallsFor(date);
    if (current >= deps.dailyCap) {
      return { ok: false, error: "__cap__" };
    }
    let reply;
    try {
      reply = await deps.client!.completeJSON(system, user, maxTokens);
    } catch {
      return { ok: false, error: "DeepSeek call failed" };
    }
    callsUsed += 1;
    await deps.usage.recordCall(date, {
      inputTokens: reply.usage?.inputTokens ?? 0,
      outputTokens: reply.usage?.outputTokens ?? 0,
    });
    return { ok: true, content: reply.content };
  };

  const failure = (message: string): GenerateResult => ({
    status: "error",
    message,
    callsUsed,
  });

  // Step 1: match.
  const matchReply = await callOnce(matchSystemPrompt(), matchUserPrompt(concept), 500);
  if (!matchReply.ok) {
    return matchReply.error === "__cap__"
      ? failure(MESSAGES.capReached)
      : failure(MESSAGES.buildFailed);
  }
  const matchParsed = parseJSONReply(matchReply.content);
  if (!matchParsed.ok) {
    // Empty/invalid match reply counts as a validation failure.
    return failure(MESSAGES.buildFailed);
  }
  const match = matchParsed.json as { supported?: boolean; templateId?: unknown; reason?: unknown };
  if (match.supported === false) {
    return {
      status: "unsupported",
      reason: `${MESSAGES.unsupportedIntro}: ${String(match.reason ?? "outside what the parts library can show")}`,
      callsUsed,
    };
  }

  const template = getTemplateForMatch(match.templateId);

  // Step 2: template fill or compose, each with validation retries.
  if (template) {
    let lastErrors: string[] = [];
    for (let attempt = 0; attempt <= LIMITS.GENERATION_RETRIES; attempt++) {
      const user =
        templateUserPrompt(concept, template) + (attempt > 0 ? retryNote(lastErrors) : "");
      const reply = await callOnce(templateSystemPrompt(), user, 1500);
      if (!reply.ok) {
        return reply.error === "__cap__" ? failure(MESSAGES.capReached) : failure(MESSAGES.buildFailed);
      }
      const parsed = parseJSONReply(reply.content);
      if (!parsed.ok) {
        lastErrors = [parsed.error];
        console.warn(`[generate] template fill attempt ${attempt + 1} rejected: ${parsed.error}`);
        continue;
      }
      const merged = mergeTemplateFill(template.id, parsed.json);
      const result = validateSpec(merged);
      if (result.ok) {
        return {
          status: "success",
          spec: result.spec,
          source: deps.model ? `deepseek ${deps.model} ${utcToday()}` : "deepseek",
          callsUsed,
        };
      }
      lastErrors = result.errors;
      console.warn(
        `[generate] template fill attempt ${attempt + 1} failed validation: ${result.errors.join(" | ")}`,
      );
    }
    return failure(MESSAGES.buildFailed);
  }

  // Compose path.
  let lastErrors: string[] = [];
  for (let attempt = 0; attempt <= LIMITS.GENERATION_RETRIES; attempt++) {
    const user = composeUserPrompt(concept) + (attempt > 0 ? retryNote(lastErrors) : "");
    const reply = await callOnce(composeSystemPrompt(), user, 6000);
    if (!reply.ok) {
      return reply.error === "__cap__" ? failure(MESSAGES.capReached) : failure(MESSAGES.buildFailed);
    }
    const parsed = parseJSONReply(reply.content);
    if (!parsed.ok) {
      lastErrors = [parsed.error];
      console.warn(`[generate] compose attempt ${attempt + 1} rejected: ${parsed.error}`);
      continue;
    }
    const result = validateSpec(parsed.json);
    if (result.ok) {
      return {
        status: "success",
        spec: result.spec,
        source: deps.model ? `deepseek ${deps.model} ${utcToday()}` : "deepseek",
        callsUsed,
      };
    }
    lastErrors = result.errors;
    console.warn(
      `[generate] compose attempt ${attempt + 1} failed validation: ${result.errors.join(" | ")}`,
    );
  }
  return failure(MESSAGES.buildFailed);
}

/** Fixture routing per the Modes section of the plan. */
export function fixtureResult(concept: string): GenerateResult {
  const lower = concept.toLowerCase();
  if (lower.includes("season")) {
    const f = getFixture("seasons")!;
    return { status: "success", spec: f.spec, source: f.source, callsUsed: 0 };
  }
  if (lower.includes("moon") && lower.includes("phase")) {
    const f = getFixture("moon-phases")!;
    return { status: "success", spec: f.spec, source: f.source, callsUsed: 0 };
  }
  return { status: "unsupported", reason: MESSAGES.fixtureOnly, callsUsed: 0 };
}

/**
 * Merge a template-fill reply into the registry skeleton (variables ranges
 * and readouts come from the registry, so the merged spec is schema-safe)
 * and return it for validation. Invalid replies pass through unchanged so
 * validateSpec produces readable errors.
 */
export function mergeTemplateFill(templateId: string, json: unknown): unknown {
  const template = getTemplate(templateId);
  if (!template || typeof json !== "object" || json === null) return json;
  const fill = json as {
    variables?: { id?: unknown; default?: unknown }[];
    content?: unknown;
  };

  const defaults = new Map<string, number>();
  for (const v of fill.variables ?? []) {
    if (
      typeof v === "object" &&
      v !== null &&
      typeof v.id === "string" &&
      typeof v.default === "number" &&
      Number.isFinite(v.default)
    ) {
      defaults.set(v.id, v.default);
    }
  }

  const content = ContentSchema.safeParse(fill.content);
  if (!content.success) return json; // let validateSpec produce readable errors

  return {
    mode: "template",
    templateId,
    variables: template.variables.map((v) => ({
      ...v,
      default: defaults.has(v.id) ? defaults.get(v.id)! : v.default,
      bindings: [],
    })),
    readouts: template.readouts,
    content: content.data,
  };
}
