import "server-only";
import { NextResponse } from "next/server";
import { generateExperience, MESSAGES } from "@/lib/ai/pipeline";
import { checkAccessCode } from "@/lib/ai/access";
import { createAIClient } from "@/lib/ai/client";
import { createUsageRepository } from "@/lib/storage";
import { getMode, getDailyCap, getDeepSeekModel, LIMITS } from "@/config/app-config";

/**
 * POST /api/generate — teacher creates an experience.
 * Requires LIVE_AI_ACCESS_CODE in both Live and Fixture mode.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be JSON" }, { status: 400 });
  }
  const { concept, accessCode } = (body ?? {}) as {
    concept?: unknown;
    accessCode?: unknown;
  };

  if (typeof concept !== "string" || concept.trim().length === 0) {
    return NextResponse.json({ error: "Enter a concept to generate." }, { status: 400 });
  }
  if (concept.length > LIMITS.CONCEPT_TEXT) {
    return NextResponse.json(
      { error: `Concept text is limited to ${LIMITS.CONCEPT_TEXT} characters.` },
      { status: 400 },
    );
  }
  if (!checkAccessCode(typeof accessCode === "string" ? accessCode : undefined)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  const mode = getMode();
  const result = await generateExperience(concept, {
    mode,
    client: mode === "live" ? createAIClient() : null,
    usage: createUsageRepository(),
    dailyCap: getDailyCap(),
    model: getDeepSeekModel(),
  });

  if (result.status === "error" && result.message === MESSAGES.capReached) {
    return NextResponse.json(result, { status: 429 });
  }
  return NextResponse.json(result);
}

export async function GET(): Promise<NextResponse> {
  // Simple mode report for the create page (no secrets).
  return NextResponse.json({ mode: getMode() });
}
