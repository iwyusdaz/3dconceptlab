import "server-only";
import { NextResponse } from "next/server";
import { validateSpec } from "@/lib/spec/validate";
import { ContentSchema } from "@/lib/spec/schema";
import { checkAccessCode } from "@/lib/ai/access";
import { createExperienceRepository } from "@/lib/storage";
import { makeShareId, type ExperienceDocument } from "@/lib/storage/types";
import { LIMITS } from "@/config/app-config";

/**
 * POST /api/experiences — save a validated spec and get a share link.
 * Requires the same access code as generation. Specs are re-validated on
 * the server; documents are written once and never overwritten.
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
  const { concept, spec, accessCode } = (body ?? {}) as {
    concept?: unknown;
    spec?: unknown;
    accessCode?: unknown;
  };

  if (typeof concept !== "string" || concept.trim().length === 0 || concept.length > LIMITS.CONCEPT_TEXT) {
    return NextResponse.json({ error: "Invalid concept text." }, { status: 400 });
  }
  if (!checkAccessCode(typeof accessCode === "string" ? accessCode : undefined)) {
    return NextResponse.json({ error: "Invalid access code." }, { status: 401 });
  }

  const parsed = validateSpec(spec);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: "Spec failed validation.", errors: parsed.errors.slice(0, 10) },
      { status: 400 },
    );
  }

  // Editable text is re-validated server-side too (limits + shape).
  const content = ContentSchema.safeParse(parsed.spec.content);
  if (!content.success) {
    return NextResponse.json({ error: "Edited text is invalid." }, { status: 400 });
  }

  const repo = createExperienceRepository();
  const doc: ExperienceDocument = {
    shareId: makeShareId(),
    concept,
    spec: { ...parsed.spec, content: content.data },
    createdAt: new Date().toISOString(),
  };
  const outcome = await repo.save(doc);
  if (outcome === "conflict") {
    // Share-ID collision (astronomically unlikely) — nothing to retry logic.
    return NextResponse.json({ error: "Could not allocate a share ID. Try again." }, { status: 500 });
  }
  return NextResponse.json({ shareId: doc.shareId, path: `/e/${doc.shareId}` });
}
