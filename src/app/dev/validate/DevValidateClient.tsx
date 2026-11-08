"use client";

import { useMemo, useState } from "react";
import { validateSpec } from "@/lib/spec/validate";
import { getServerStatus } from "@/config/app-config";

/**
 * Development-only tool: paste a scene spec JSON and see validation errors,
 * plus sample outputs from the formula library.
 */

const SAMPLE_BROKEN = `{
  "mode": "composed",
  "parts": [
    { "id": "earth", "type": "sphere", "position": [0, 0, 0], "radius": 1, "color": "#2b6cb0" }
  ],
  "variables": [
    { "id": "orbitAngle", "label": "Orbit angle", "min": 360, "max": 0, "step": 1, "default": 45,
      "unit": "°", "bindings": [{ "target": "nope.position.x", "op": "set" }] }
  ],
  "readouts": [
    { "id": "lit", "label": "Lit fraction", "formula": "surfaceGravity", "inputs": { "r": 1 } }
  ],
  "content": { "title": "Test", "explanation": "e", "tryThis": ["x"], "keyIdea": "k" }
}`;

export function DevValidateClient() {
  const status = getServerStatus();
  // getServerStatus exposes booleans only, but this page is dev-only: guard it.
  const enabled = process.env.NODE_ENV !== "production";
  const [text, setText] = useState("");

  const result = useMemo(() => {
    if (!text.trim()) return null;
    try {
      const json: unknown = JSON.parse(text);
      return validateSpec(json);
    } catch (e) {
      return { ok: false, errors: [`JSON parse error: ${(e as Error).message}`] } as const;
    }
  }, [text]);

  if (!enabled) {
    return <p>This tool is only available in development.</p>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Scene spec validator (development)</h1>
      <p>
        Paste a scene spec as JSON. Validation errors are shown with their paths. Current mode:{" "}
        <strong>{status.mode}</strong>.
      </p>
      <textarea
        aria-label="Spec JSON"
        style={{ width: "100%", minHeight: 300, fontFamily: "monospace" }}
        placeholder="Paste spec JSON here, or press Load broken sample"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button type="button" onClick={() => setText(SAMPLE_BROKEN)} style={{ marginTop: "0.5rem" }}>
        Load broken sample
      </button>

      {result && (
        <section aria-live="polite" style={{ marginTop: "1rem" }}>
          {result.ok ? (
            <p style={{ color: "#4ade80" }}>✓ Valid spec.</p>
          ) : (
            <div>
              <p style={{ color: "#f87171" }}>✗ {result.errors.length} error(s):</p>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i} style={{ fontFamily: "monospace", color: "#f87171" }}>
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
