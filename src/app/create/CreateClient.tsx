"use client";

import { useState } from "react";
import type { SceneSpec } from "@/lib/spec/schema";
import { ContentSchema } from "@/lib/spec/schema";
import { LIMITS } from "@/config/app-config";
import { ExperienceViewer } from "@/components/viewer/ExperienceViewer";

/**
 * Teacher create flow: concept + access code → generate → preview with
 * editable text → save → share link. All generated/edited text is rendered
 * as plain text, never HTML.
 */

type Phase = "input" | "generating" | "preview" | "saved";

export function CreateClient() {
  const [phase, setPhase] = useState<Phase>("input");
  const [concept, setConcept] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [unsupported, setUnsupported] = useState<string | null>(null);
  const [spec, setSpec] = useState<SceneSpec | null>(null);
  const [specValid, setSpecValid] = useState(true);
  const [sharePath, setSharePath] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function generate() {
    setPhase("generating");
    setError(null);
    setUnsupported(null);
    setSpec(null);
    setSharePath(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, accessCode }),
      });
      const body = await res.json();
      if (res.status === 401 || res.status === 400 || res.status === 429) {
        setError(body.error ?? body.message ?? "Something went wrong.");
        setPhase("input");
        return;
      }
      if (body.status === "unsupported") {
        setUnsupported(body.reason);
        setPhase("input");
        return;
      }
      if (body.status === "success") {
        setSpec(body.spec);
        setSpecValid(true);
        setPhase("preview");
        return;
      }
      setError(body.message ?? "Something went wrong.");
      setPhase("input");
    } catch {
      setError("Network error. Try again.");
      setPhase("input");
    }
  }

  async function save() {
    if (!spec) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/experiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concept, spec, accessCode }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Could not save.");
        return;
      }
      setSharePath(body.path);
      setPhase("saved");
    } catch {
      setError("Network error while saving. Try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateContentField(field: "title" | "explanation" | "keyIdea", value: string) {
    if (!spec) return;
    const next = { ...spec.content, [field]: value };
    const parsed = ContentSchema.safeParse(next);
    setSpecValid(parsed.success);
    if (parsed.success) setSpec({ ...spec, content: next });
  }

  function updatePrompt(index: number, value: string) {
    if (!spec) return;
    const tryThis = [...spec.content.tryThis];
    tryThis[index] = value;
    const next = { ...spec.content, tryThis };
    const parsed = ContentSchema.safeParse(next);
    setSpecValid(parsed.success);
    if (parsed.success) setSpec({ ...spec, content: next });
  }

  const shareUrl =
    sharePath && typeof window !== "undefined" ? `${window.location.origin}${sharePath}` : "";

  return (
    <main className="create">
      <h1>Create an experience</h1>
      <p className="create-note">
        Concept text is sent to DeepSeek (hosted in China) to generate the experience.
      </p>

      {phase === "input" && (
        <section className="create-form">
          <label htmlFor="concept">
            Concept <span className="char-count">{concept.length}/{LIMITS.CONCEPT_TEXT}</span>
          </label>
          <textarea
            id="concept"
            value={concept}
            maxLength={LIMITS.CONCEPT_TEXT}
            placeholder="e.g. why do we have seasons"
            onChange={(e) => setConcept(e.target.value)}
            rows={3}
          />
          <label htmlFor="accessCode">Access code</label>
          <input
            id="accessCode"
            type="password"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            placeholder="Shared by the owner"
          />
          <button type="button" onClick={generate} disabled={concept.trim().length === 0}>
            Generate
          </button>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          {unsupported && (
            <p role="alert" className="unsupported-text">
              {unsupported}
            </p>
          )}
        </section>
      )}

      {phase === "generating" && (
        <section aria-busy="true" className="create-form">
          <p>Generating — this can take up to a minute…</p>
          <button type="button" disabled>
            Generating…
          </button>
        </section>
      )}

      {phase === "preview" && spec && (
        <section className="create-preview">
          <h2>Preview and edit the text</h2>
          {!specValid && (
            <p role="alert" className="error-text">
              Text is limited to 500 characters per field (1–6 prompts).
            </p>
          )}
          <div className="viewer-wrapper">
            <ExperienceViewer spec={spec} ariaLabel="Preview of your experience" />
          </div>

          <div className="content-editor">
            <label htmlFor="edit-title">Title</label>
            <input
              id="edit-title"
              value={spec.content.title}
              maxLength={LIMITS.EDITABLE_TEXT}
              onChange={(e) => updateContentField("title", e.target.value)}
            />
            <label htmlFor="edit-explanation">Explanation</label>
            <textarea
              id="edit-explanation"
              value={spec.content.explanation}
              maxLength={LIMITS.EDITABLE_TEXT}
              rows={3}
              onChange={(e) => updateContentField("explanation", e.target.value)}
            />
            <h3>Try this prompts</h3>
            {spec.content.tryThis.map((prompt, i) => (
              <div key={i} className="prompt-edit">
                <label htmlFor={`edit-prompt-${i}`}>{`Prompt ${i + 1}`}</label>
                <textarea
                  id={`edit-prompt-${i}`}
                  value={prompt}
                  maxLength={LIMITS.EDITABLE_TEXT}
                  rows={2}
                  onChange={(e) => updatePrompt(i, e.target.value)}
                />
              </div>
            ))}
            <label htmlFor="edit-keyIdea">Key idea</label>
            <textarea
              id="edit-keyIdea"
              value={spec.content.keyIdea}
              maxLength={LIMITS.EDITABLE_TEXT}
              rows={2}
              onChange={(e) => updateContentField("keyIdea", e.target.value)}
            />
          </div>

          <button type="button" onClick={save} disabled={!specValid || saving}>
            {saving ? "Saving…" : "Save and get share link"}
          </button>
          {error && <p role="alert" className="error-text">{error}</p>}
        </section>
      )}

      {phase === "saved" && sharePath && (
        <section className="create-saved">
          <h2>Saved!</h2>
          <p>Share this link with your students — it works without any account:</p>
          <div className="share-row">
            <input readOnly value={shareUrl} aria-label="Share link" data-testid="share-link" />
            <button
              type="button"
              data-testid="copy-share-link"
              onClick={async () => {
                const url = `${window.location.origin}${sharePath}`;
                let copiedOk = false;
                try {
                  await navigator.clipboard.writeText(url);
                  copiedOk = true;
                } catch {
                  // Headless/insecure contexts: fall back to select+execCommand.
                  const input = document.querySelector<HTMLInputElement>(
                    '[data-testid="share-link"]',
                  );
                  if (input) {
                    input.select();
                    copiedOk = document.execCommand("copy");
                  }
                }
                if (copiedOk) setCopied(true);
              }}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="share-note">
            <a href={sharePath}>Open the share page</a>
          </p>
        </section>
      )}
    </main>
  );
}
