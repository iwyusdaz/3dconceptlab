"use client";

import { Text } from "@react-three/drei";
import * as THREE from "three";
import type { ScenePart } from "@/lib/spec/schema";
import { readOverride, type PartOverrides } from "@/lib/viewer/evaluate";

/**
 * Map from whitelisted part type to a React Three Fiber component.
 * Each component receives its base spec values plus evaluated binding
 * overrides; overrides win over base values.
 */

export interface PartViewProps {
  part: ScenePart;
  overrides: Map<string, number>;
  /** Object labels render only while the scene is hovered or focused. */
  labelsVisible?: boolean;
}

function baseNumber(part: ScenePart, key: string): number | undefined {
  return (part as unknown as Record<string, unknown>)[key] as number | undefined;
}

/** Override keys are full binding targets: `<partId>.<property>`. */
function overrideKey(part: ScenePart, key: keyof PartOverrides): string {
  return `${part.id}.${key}`;
}

function num(
  key: keyof PartOverrides,
  part: ScenePart,
  overrides: Map<string, number>,
  fallback: number,
): number {
  const base = baseNumber(part, key);
  return readOverride(overrides, overrideKey(part, key) as keyof PartOverrides, base ?? fallback);
}

function vec3(
  part: ScenePart,
  overrides: Map<string, number>,
  key: "position" | "origin" | "center",
  fallback: [number, number, number],
): [number, number, number] {
  const base = ((part as unknown as Record<string, unknown>)[key] as
    | [number, number, number]
    | undefined) ?? fallback;
  return [
    readOverride(overrides, `${part.id}.${key}.x` as keyof PartOverrides, base[0]),
    readOverride(overrides, `${part.id}.${key}.y` as keyof PartOverrides, base[1]),
    readOverride(overrides, `${part.id}.${key}.z` as keyof PartOverrides, base[2]),
  ];
}

const D2R = Math.PI / 180;

function SpherePartView({ part, overrides }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "sphere" }>;
  const position = vec3(part, overrides, "position", [0, 0, 0]);
  const radius = num("radius", part, overrides, p.radius);
  const rotationYDeg = num("rotationYDeg", part, overrides, p.rotationYDeg ?? 0);
  const opacity = num("opacity", part, overrides, p.opacity ?? 1);
  const tilt = p.axialTiltDeg ?? 0;
  return (
    <mesh position={position} rotation={[0, rotationYDeg * D2R, tilt * D2R]}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial
        color={p.color}
        roughness={0.8}
        metalness={0.05}
        transparent={opacity < 1}
        opacity={opacity}
      />
    </mesh>
  );
}

function LightSourcePartView({ part, overrides }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "lightSource" }>;
  const position = vec3(part, overrides, "position", [0, 0, 0]);
  const radius = num("radius", part, overrides, p.radius ?? 1.5);
  const intensity = num("intensity", part, overrides, p.intensity);
  return (
    <group position={position}>
      {/* Visible sun disc: unlit material (self-luminous). */}
      <mesh>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshBasicMaterial color={p.color} />
      </mesh>
      <pointLight intensity={intensity * 40} decay={0} color={p.color} />
    </group>
  );
}

function OrbitPathView({ part, overrides }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "orbitPath" }>;
  const radius = num("radius", part, overrides, p.radius);
  // The center is not bindable; read the base value directly.
  const center = ((part as unknown as Record<string, unknown>).center as
    | [number, number, number]
    | undefined) ?? [0, 0, 0];
  return (
    <mesh position={center} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[radius, 0.015, 8, 128]} />
      <meshBasicMaterial color={p.color} transparent opacity={0.6} />
    </mesh>
  );
}

function ArrowPartView({ part, overrides }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "arrow" }>;
  const origin = vec3(part, overrides, "origin", [0, 0, 0]);
  const angleDeg = num("angleDeg", part, overrides, p.angleDeg);
  const length = num("length", part, overrides, p.length);
  const dir: [number, number, number] = [Math.cos(angleDeg * D2R), 0, Math.sin(angleDeg * D2R)];
  return (
    <group position={origin}>
      {/* Shaft along the direction, then a cone head. */}
      <mesh
        position={[dir[0] * length * 0.45, 0, dir[2] * length * 0.45]}
        rotation={[0, -angleDeg * D2R, Math.PI / 2]}
      >
        <cylinderGeometry args={[0.03, 0.03, length * 0.9, 8]} />
        <meshBasicMaterial color={p.color} />
      </mesh>
      <mesh
        position={[dir[0] * length * 0.95, 0, dir[2] * length * 0.95]}
        rotation={[0, -angleDeg * D2R, Math.PI / 2]}
      >
        <coneGeometry args={[0.08, 0.25, 8]} />
        <meshBasicMaterial color={p.color} />
      </mesh>
    </group>
  );
}

function LabelPartView({ part, overrides, labelsVisible = true }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "label" }>;
  const position = vec3(part, overrides, "position", [0, 0, 0]);
  const opacity = num("opacity", part, overrides, p.opacity ?? 1);
  if (!labelsVisible) return null;
  return (
    <Text
      position={position}
      fontSize={0.35}
      color={p.color ?? "#dfe6f5"}
      fillOpacity={opacity}
      anchorX="center"
      anchorY="bottom"
    >
      {p.text}
    </Text>
  );
}

function GroundPatchView({ part }: PartViewProps) {
  const p = part as Extract<ScenePart, { type: "groundPatch" }>;
  return (
    <mesh position={p.position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[p.radius, 32]} />
      <meshStandardMaterial color={p.color} roughness={1} side={THREE.DoubleSide} />
    </mesh>
  );
}

export const PART_COMPONENTS: Record<
  ScenePart["type"],
  (props: PartViewProps) => React.ReactElement | null
> = {
  sphere: SpherePartView,
  lightSource: LightSourcePartView,
  orbitPath: OrbitPathView,
  arrow: ArrowPartView,
  label: LabelPartView,
  groundPatch: GroundPatchView,
};

export function PartView(props: PartViewProps) {
  const Component = PART_COMPONENTS[props.part.type];
  if (!Component) return null;
  return <Component {...props} />;
}
