import { z } from "zod";
import { LIMITS } from "@/config/app-config";

/**
 * Zod schemas for the declarative scene spec.
 *
 * DeepSeek outputs JSON that must pass this schema plus the semantic checks
 * in `validate.ts`. DeepSeek never writes code — it composes declarative
 * specs from whitelisted part types, binding operations and named formulas.
 */

/** Whitelisted part types. */
export const PART_TYPES = ["sphere", "lightSource", "orbitPath", "arrow", "label", "groundPatch", "shadowCone"] as const;
export type PartType = (typeof PART_TYPES)[number];

/** Whitelisted binding operations (the only way a slider affects a part). */
export const BINDING_OPS = ["set", "multiply", "add", "negate", "sinDeg", "cosDeg"] as const;
export type BindingOp = (typeof BINDING_OPS)[number];

/** Whitelisted bindable property per part type (used by semantic checks). */
export const BINDABLE_PROPERTIES: Record<PartType, string[]> = {
  sphere: ["position.x", "position.y", "position.z", "radius", "rotationYDeg", "axialTiltDeg", "opacity"],
  lightSource: ["position.x", "position.y", "position.z", "intensity"],
  orbitPath: ["radius"],
  arrow: ["origin.x", "origin.y", "origin.z", "angleDeg", "length", "opacity"],
  label: ["position.x", "position.y", "position.z", "opacity"],
  groundPatch: ["position.x", "position.y", "position.z", "radius"],
  shadowCone: ["origin.x", "origin.y", "origin.z", "angleDeg", "length", "apexAngleDeg", "opacity"],
};

const slug = z
  .string()
  .regex(
    /^[a-zA-Z][a-zA-Z0-9]{0,39}$/,
    "must be 1-40 chars, starting with a letter, then letters/digits",
  );

const finite = z.number().finite();
const vector3 = z.tuple([finite, finite, finite]);

const idLike = z
  .string()
  .regex(/^\$[a-zA-Z][a-zA-Z0-9]{0,39}$/, "must be a $-reference like $dayOfYear");

const shortText = z.string().min(1).max(LIMITS.EDITABLE_TEXT);

export const BindingSchema = z.object({
  target: z
    .string()
    .regex(
      /^[a-zA-Z][a-zA-Z0-9]{0,39}\.(position\.[xyz]|radius|rotationYDeg|axialTiltDeg|opacity|intensity|origin\.[xyz]|angleDeg|length|apexAngleDeg)$/,
      "must look like <partId>.<property>, e.g. moon.position.x",
    ),
  op: z.enum(BINDING_OPS),
  /** Operand for multiply/add (multiplier or offset) and trig ops (radius). */
  param: finite.optional(),
});

export const VariableSchema = z.object({
  id: slug,
  label: shortText,
  min: finite,
  max: finite,
  step: finite.positive(),
  default: finite,
  unit: z.string().min(1).max(20),
  description: z.string().max(LIMITS.EDITABLE_TEXT).optional(),
  bindings: z.array(BindingSchema).max(20),
});

export const ReadoutSchema = z.object({
  id: slug,
  label: shortText,
  formula: z.string().min(1).max(60),
  /** Values are numbers, or "$varId" / "$readoutId" references. */
  inputs: z.record(z.string().min(1).max(40), z.union([finite, idLike])),
});

export const ContentSchema = z.object({
  title: shortText,
  explanation: shortText,
  tryThis: z.array(shortText).min(1).max(6),
  keyIdea: shortText,
  /** Renders a "Not to scale" badge when true (accuracy over spectacle). */
  notToScale: z.boolean().optional(),
  /** Renders a "Time-lapse" badge when the scene shows sped-up motion. */
  timeLapse: z.boolean().optional(),
});

const PartBase = {
  id: slug,
  label: z.string().max(LIMITS.EDITABLE_TEXT).optional(),
};

export const SpherePartSchema = z.object({
  ...PartBase,
  type: z.literal("sphere"),
  position: vector3,
  radius: finite.positive(),
  /** Optional; renderer default per part type when omitted. */
  color: z.string().max(40).optional(),
  /** Texture key; currently "earth-blue-marble" (Task 5). */
  texture: z.enum(["none", "earth-blue-marble"]).optional(),
  axialTiltDeg: finite.optional(),
  rotationYDeg: finite.optional(),
  /** 0..1; below 1 makes the part see-through (used for the phase overlay). */
  opacity: z.number().finite().min(0).max(1).optional(),
  /** Renders as an unlit dark disc — used to show the Moon's shadowed side. */
  showPhase: z.boolean().optional(),
});

export const LightSourcePartSchema = z.object({
  ...PartBase,
  type: z.literal("lightSource"),
  position: vector3,
  intensity: z.number().finite().positive().max(100),
  color: z.string().max(40).optional(),
  radius: finite.positive().optional(),
});

export const OrbitPathPartSchema = z.object({
  ...PartBase,
  type: z.literal("orbitPath"),
  /** Optional; defaults to the origin (Earth) when omitted. */
  center: vector3.optional(),
  radius: finite.positive(),
  color: z.string().max(40).optional(),
});

export const ArrowPartSchema = z.object({
  ...PartBase,
  type: z.literal("arrow"),
  origin: vector3,
  /** Direction angle in degrees in the XZ plane, 0 = +X. */
  angleDeg: finite,
  length: finite.positive(),
  color: z.string().max(40).optional(),
});

export const LabelPartSchema = z.object({
  ...PartBase,
  type: z.literal("label"),
  position: vector3,
  text: z.string().min(1).max(120),
  color: z.string().max(40).optional(),
  opacity: z.number().finite().min(0).max(1).optional(),
});

export const GroundPatchPartSchema = z.object({
  ...PartBase,
  type: z.literal("groundPatch"),
  position: vector3,
  radius: finite.positive(),
  color: z.string().max(40).optional(),
});

export const ShadowConePartSchema = z.object({
  ...PartBase,
  type: z.literal("shadowCone"),
  /** Cone base sits at the casting body; the apex points away from it. */
  origin: vector3,
  /** Direction in degrees in the XZ plane, 0 = +X (away from the Sun at origin). */
  angleDeg: finite,
  length: finite.positive(),
  /** Full cone angle in degrees: base radius = tan(apexAngle/2) · length. */
  apexAngleDeg: z.number().finite().positive().max(180),
  color: z.string().max(40).optional(),
  opacity: z.number().finite().min(0).max(1).optional(),
});

export const PartSchema = z.discriminatedUnion("type", [
  SpherePartSchema,
  LightSourcePartSchema,
  OrbitPathPartSchema,
  ArrowPartSchema,
  LabelPartSchema,
  GroundPatchPartSchema,
  ShadowConePartSchema,
]);

/**
 * Composed scene: built from parts by DeepSeek when no template matches.
 */
export const ComposedSpecSchema = z.object({
  mode: z.literal("composed"),
  parts: z.array(PartSchema).min(1).max(LIMITS.SCENE_PART_CAP),
  variables: z.array(VariableSchema).max(10),
  readouts: z.array(ReadoutSchema).max(10),
  content: ContentSchema,
});

/**
 * Template scene: the viewer renders the hand-built template by ID using the
 * same variables/readouts/content interface as composed scenes.
 */
export const TemplateSpecSchema = z.object({
  mode: z.literal("template"),
  templateId: z.string().min(1).max(60),
  variables: z.array(VariableSchema).max(10),
  readouts: z.array(ReadoutSchema).max(10),
  content: ContentSchema,
});

export const SceneSpecSchema = z.discriminatedUnion("mode", [
  TemplateSpecSchema,
  ComposedSpecSchema,
]);

export type Binding = z.infer<typeof BindingSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type Readout = z.infer<typeof ReadoutSchema>;
export type SpecContent = z.infer<typeof ContentSchema>;
export type ComposedSpec = z.infer<typeof ComposedSpecSchema>;
export type TemplateSpec = z.infer<typeof TemplateSpecSchema>;
export type SceneSpec = z.infer<typeof SceneSpecSchema>;
export type ScenePart = z.infer<typeof PartSchema>;
