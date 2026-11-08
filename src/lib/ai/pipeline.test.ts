import { describe, expect, it } from "vitest";
import {
  generateExperience,
  fixtureResult,
  parseJSONReply,
  mergeTemplateFill,
  MESSAGES,
  type GenerateDeps,
} from "./pipeline";
import { InMemoryUsageRepository } from "@/lib/storage/memory";
import type { AIClient, AIReply } from "./client";
import { FIXTURES } from "@/fixtures";

const seasonsSpec = FIXTURES.seasons.spec;
const moonSpec = FIXTURES["moon-phases"].spec;

/** Fake AI client returning scripted replies, recording calls. */
function fakeClient(replies: (AIReply | Error)[]): {
  client: AIClient;
  calls: string[];
} {
  const calls: string[] = [];
  let i = 0;
  const client: AIClient = {
    async completeJSON(system, user, maxTokens) {
      void maxTokens;
      calls.push(JSON.stringify({ system: system.slice(0, 40), user }));
      const next = replies[i++];
      if (next instanceof Error) throw next;
      return next;
    },
  };
  return { client, calls };
}

function makeDeps(
  replies: (AIReply | Error)[],
  overrides: Partial<GenerateDeps> = {},
): GenerateDeps & { calls: string[] } {
  const { client, calls } = fakeClient(replies);
  return {
    mode: "live",
    client,
    usage: new InMemoryUsageRepository(),
    dailyCap: 150,
    model: "deepseek-chat",
    ...overrides,
    calls,
  } as GenerateDeps & { calls: string[] };
}

const MATCH_COMPOSE = (content: string): AIReply => ({
  content,
  usage: { inputTokens: 10, outputTokens: 5 },
});

describe("pipeline: fixture mode", () => {
  it("returns the seasons fixture for season text", async () => {
    const r = await generateExperience("why do we have seasons", {
      mode: "fixture",
      client: null,
      usage: new InMemoryUsageRepository(),
      dailyCap: 150,
    });
    expect(r.status).toBe("success");
    if (r.status === "success") {
      expect(r.spec).toEqual(seasonsSpec);
      expect(r.source).toBe("hand-written");
    }
  });

  it("returns the moon-phases fixture for moon phase text", async () => {
    const r = fixtureResult("why does the Moon have phases");
    expect(r.status).toBe("success");
    if (r.status === "success") expect(r.spec).toEqual(moonSpec);
  });

  it("shows the fixture message for unknown text", async () => {
    const r = await generateExperience("why do volcanoes erupt", {
      mode: "fixture",
      client: null,
      usage: new InMemoryUsageRepository(),
      dailyCap: 150,
    });
    expect(r.status).toBe("unsupported");
    if (r.status === "unsupported") expect(r.reason).toBe(MESSAGES.fixtureOnly);
  });

  it("does not update the daily counter in fixture mode", async () => {
    const usage = new InMemoryUsageRepository();
    await generateExperience("why do we have seasons", {
      mode: "fixture",
      client: null,
      usage,
      dailyCap: 150,
    });
    expect(await usage.getCallsFor(new Date().toISOString().slice(0, 10))).toBe(0);
  });
});

describe("pipeline: live mode with a fake client", () => {
  it("unsupported concept: one match call, no further calls", async () => {
    const deps = makeDeps([
      MATCH_COMPOSE(JSON.stringify({ supported: false, templateId: null, reason: "about volcanoes" })),
    ]);
    const r = await generateExperience("why do volcanoes erupt", deps);
    expect(r.status).toBe("unsupported");
    if (r.status === "unsupported") {
      expect(r.reason).toContain("This concept isn't supported yet");
      expect(r.reason).toContain("about volcanoes");
    }
    expect(deps.calls).toHaveLength(1);
    expect(await deps.usage.getCallsFor(new Date().toISOString().slice(0, 10))).toBe(1);
  });

  it("template match: content and starting values are merged into the template", async () => {
    const deps = makeDeps([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: "seasons", reason: "seasons" })),
      MATCH_COMPOSE(
        JSON.stringify({
          variables: [
            { id: "dayOfYear", default: 100 },
            { id: "tilt", default: 30 },
          ],
          content: {
            title: "Seasons on a tilted Earth",
            explanation: "The tilt changes the sun angle through the year.",
            tryThis: ["Set tilt to zero and compare."],
            keyIdea: "Tilt causes seasons.",
          },
        }),
      ),
    ]);
    const r = await generateExperience("why are summers hot", deps);
    expect(r.status).toBe("success");
    if (r.status === "success") {
      expect(r.spec.mode).toBe("template");
      const vars = r.spec.variables;
      expect(vars.find((v) => v.id === "dayOfYear")!.default).toBe(100);
      expect(vars.find((v) => v.id === "tilt")!.default).toBe(30);
      expect(vars.find((v) => v.id === "latitude")!.default).toBe(51.5); // registry default kept
      expect(r.spec.content.title).toBe("Seasons on a tilted Earth");
      expect(r.spec.readouts.map((x) => x.formula)).toContain("daylightHours");
      expect(r.source).toContain("deepseek");
    }
    expect(deps.calls).toHaveLength(2);
    expect(await deps.usage.getCallsFor(new Date().toISOString().slice(0, 10))).toBe(2);
  });

  it("successful compose: a valid composed spec passes validation", async () => {
    const composed = {
      mode: "composed",
      parts: [
        { id: "sun", type: "lightSource", position: [10, 0, 0], intensity: 2, color: "#fff" },
        { id: "earth", type: "sphere", position: [0, 0, 0], radius: 1, color: "#2b6cb0" },
      ],
      variables: [
        {
          id: "orbitAngle",
          label: "Angle",
          min: 0,
          max: 360,
          step: 1,
          default: 0,
          unit: "°",
          bindings: [{ target: "earth.rotationYDeg", op: "set" }],
        },
      ],
      readouts: [],
      content: { title: "t", explanation: "e", tryThis: ["x"], keyIdea: "k" },
    };
    const deps = makeDeps([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: null, reason: "compose" })),
      MATCH_COMPOSE(JSON.stringify(composed)),
    ]);
    const r = await generateExperience("spin demo", deps);
    expect(r.status).toBe("success");
    if (r.status === "success") expect(r.spec.mode).toBe("composed");
    expect(deps.calls).toHaveLength(2);
  });

  it("a retry that succeeds: first compose reply invalid, second valid", async () => {
    const validComposed = {
      mode: "composed",
      parts: [{ id: "e", type: "sphere", position: [0, 0, 0], radius: 1, color: "#00f" }],
      variables: [],
      readouts: [],
      content: { title: "t", explanation: "e", tryThis: ["x"], keyIdea: "k" },
    };
    const invalid = { ...validComposed, parts: [{ id: "e", type: "blackHole" }] };
    const deps = makeDeps([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: null, reason: "r" })),
      MATCH_COMPOSE(JSON.stringify(invalid)),
      MATCH_COMPOSE(JSON.stringify(validComposed)),
    ]);
    const r = await generateExperience("test retry", deps);
    expect(r.status).toBe("success");
    expect(deps.calls).toHaveLength(3);
    // The retry prompt includes the validation errors.
    expect(deps.calls[2]).toContain("Fix all of these");
    expect(await deps.usage.getCallsFor(new Date().toISOString().slice(0, 10))).toBe(3);
  });

  it("failure after 2 retries produces the build-failed message", async () => {
    const deps = makeDeps([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: null, reason: "r" })),
      MATCH_COMPOSE(JSON.stringify({ mode: "composed", broken: true })),
      MATCH_COMPOSE(JSON.stringify({ broken: 1 })),
      MATCH_COMPOSE(JSON.stringify({ broken: 2 })),
    ]);
    const r = await generateExperience("impossible spec", deps);
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toBe(MESSAGES.buildFailed);
    expect(deps.calls).toHaveLength(4); // match + 3 compose attempts (1 + 2 retries)
  });

  it("empty and cut-off replies are validation failures", async () => {
    expect(parseJSONReply("").ok).toBe(false);
    expect(parseJSONReply("   ").ok).toBe(false);
    expect(parseJSONReply('{"a": 1').ok).toBe(false);
    expect(parseJSONReply('{"a": 1}').ok).toBe(true);
  });

  it("a thrown client error is reported as build failed", async () => {
    const deps = makeDeps([
      new Error("boom"),
    ]);
    const r = await generateExperience("concept", deps);
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toBe(MESSAGES.buildFailed);
    expect(r.callsUsed).toBe(0);
  });

  it("the daily cap is enforced before each call", async () => {
    const usage = new InMemoryUsageRepository();
    const date = new Date().toISOString().slice(0, 10);
    // Pre-fill the counter to the cap.
    await usage.recordCall(date, { inputTokens: 0, outputTokens: 0 });
    const { client, calls } = fakeClient([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: null, reason: "r" })),
    ]);
    const r = await generateExperience("concept", {
      mode: "live",
      client,
      usage,
      dailyCap: 1,
    });
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toBe(MESSAGES.capReached);
    expect(calls).toHaveLength(0);
  });

  it("a mid-pipeline cap hit stops further calls", async () => {
    const usage = new InMemoryUsageRepository();
    const date = new Date().toISOString().slice(0, 10);
    await usage.recordCall(date, { inputTokens: 0, outputTokens: 0 }); // 1 of cap 2
    const { client, calls } = fakeClient([
      MATCH_COMPOSE(JSON.stringify({ supported: true, templateId: null, reason: "r" })),
      MATCH_COMPOSE(JSON.stringify({ broken: 1 })),
    ]);
    const r = await generateExperience("concept", {
      mode: "live",
      client,
      usage,
      dailyCap: 2,
    });
    expect(r.status).toBe("error");
    if (r.status === "error") expect(r.message).toBe(MESSAGES.capReached);
    // match used the last slot; compose was refused.
    expect(calls).toHaveLength(1);
  });
});

describe("mergeTemplateFill", () => {
  it("falls back to registry defaults when the AI omits a variable", () => {
    const merged = mergeTemplateFill("seasons", {
      variables: [{ id: "tilt", default: 12 }],
      content: { title: "T", explanation: "E", tryThis: ["x"], keyIdea: "K" },
    });
    expect(merged).toHaveProperty("mode", "template");
  });

  it("passes through invalid content unchanged for readable errors", () => {
    const merged = mergeTemplateFill("seasons", { content: { title: "" } });
    expect(merged).toEqual({ content: { title: "" } });
  });
});
