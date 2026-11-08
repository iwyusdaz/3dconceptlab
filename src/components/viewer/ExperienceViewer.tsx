"use client";

import { useMemo, useState, createElement } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { SceneSpec, Variable } from "@/lib/spec/schema";
import { evaluateBindings, type VariableValues } from "@/lib/viewer/evaluate";
import { evaluateReadouts } from "@/lib/viewer/readouts";
import { PartView } from "./PartViews";
import { getTemplateScene } from "@/lib/templates/scenes";

/**
 * Experience viewer: renders a scene spec — composed parts or a hand-built
 * template — with sliders, live readouts and the learning content. Both
 * modes go through the same variables/readouts/content interface.
 */

export interface ExperienceViewerProps {
  spec: SceneSpec;
  /** Optional saved starting values (defaults come from the spec). */
  initialValues?: VariableValues;
  ariaLabel?: string;
}

function formatValue(value: number | null, infinite: boolean): string {
  if (value === null) return "—";
  if (infinite) return "∞";
  return value.toFixed(value >= 100 ? 0 : Math.abs(value) < 10 ? 2 : 1);
}

export function ExperienceViewer({ spec, initialValues, ariaLabel }: ExperienceViewerProps) {
  const defaults = useMemo(() => {
    const v: VariableValues = {};
    for (const variable of spec.variables) v[variable.id] = variable.default;
    return { ...v, ...initialValues };
  }, [spec, initialValues]);

  const [values, setValues] = useState<VariableValues>(defaults);

  const overrides = useMemo(() => evaluateBindings(spec, values), [spec, values]);
  const readoutResults = useMemo(() => evaluateReadouts(spec, values), [spec, values]);

  return (
    <div className="viewer">
      <div
        className="viewer-scene"
        data-testid="viewer-scene"
        data-overrides={JSON.stringify(Object.fromEntries(overrides))}
      >
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 6, 16], fov: 45 }}
          aria-label={ariaLabel ?? "Interactive 3D scene"}
          style={{ width: "100%", height: "100%" }}
        >
          <ambientLight intensity={0.25} />
          {spec.mode === "composed" ? (
            spec.parts.map((part) => (
              <PartView key={part.id} part={part} overrides={overrides} />
            ))
          ) : (
            <TemplateSceneById templateId={spec.templateId} values={values} />
          )}
          <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={60} />
        </Canvas>

        <div className="accuracy-badges" aria-hidden="false">
          {spec.content.notToScale && (
            <span className="badge" data-testid="badge-not-to-scale">
              Not to scale
            </span>
          )}
          {spec.content.timeLapse && (
            <span className="badge" data-testid="badge-time-lapse">
              Time-lapse
            </span>
          )}
        </div>
      </div>

      <section className="control-bar" aria-label="Controls">
        {spec.variables.map((variable) => (
          <SliderControl
            key={variable.id}
            variable={variable}
            value={values[variable.id] ?? variable.default}
            onChange={(v) => setValues((prev) => ({ ...prev, [variable.id]: v }))}
          />
        ))}
        {spec.variables.length === 0 && <p>This scene has no controls.</p>}
      </section>

      <section className="readouts" aria-label="Live readouts">
        <h2>Readouts</h2>
        <ul>
          {readoutResults.map((r) => (
            <li key={r.id} data-testid={`readout-${r.id}`}>
              <span className="readout-label">{r.label}: </span>
              <span className="readout-value">
                {formatValue(r.value, r.infinite)} {r.unit}
              </span>
            </li>
          ))}
          {readoutResults.length === 0 && <li>No readouts in this scene.</li>}
        </ul>
      </section>

      <section className="content" aria-label="About this concept">
        <h2>{spec.content.title}</h2>
        <p>{spec.content.explanation}</p>
        <h3>Try this</h3>
        <ol>
          {spec.content.tryThis.map((prompt, i) => (
            <li key={i}>{prompt}</li>
          ))}
        </ol>
        <p className="key-idea">
          <strong>Key idea: </strong>
          {spec.content.keyIdea}
        </p>
      </section>
    </div>
  );
}

function TemplateSceneById({
  templateId,
  values,
}: {
  templateId: string;
  values: VariableValues;
}) {
  const scene = getTemplateScene(templateId);
  if (!scene) {
    return (
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#666" />
      </mesh>
    );
  }
  // The scene component comes from a stable registry, not created in render.
  return createElement(scene, { values });
}

interface SliderControlProps {
  variable: Variable;
  value: number;
  onChange: (value: number) => void;
}

function SliderControl({ variable, value, onChange }: SliderControlProps) {
  const valueText = `${value} ${variable.unit}`;
  return (
    <div className="slider-control">
      <label htmlFor={`slider-${variable.id}`}>
        {variable.label}
        {variable.description ? <span className="slider-desc">{variable.description}</span> : null}
      </label>
      <div className="slider-row">
        <input
          id={`slider-${variable.id}`}
          type="range"
          min={variable.min}
          max={variable.max}
          step={variable.step}
          value={value}
          aria-valuetext={valueText}
          onChange={(e) => onChange(Number(e.target.value))}
          data-testid={`slider-${variable.id}`}
        />
        <output htmlFor={`slider-${variable.id}`} className="slider-output">
          {valueText}
        </output>
      </div>
    </div>
  );
}
