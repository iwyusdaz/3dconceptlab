"use client";

import { useMemo } from "react";
import { Stars, Text } from "@react-three/drei";
import * as THREE from "three";
import type { VariableValues } from "@/lib/viewer/evaluate";

/**
 * The Eclipses template scene (scope-growth round 1).
 *
 * The Sun sits fixed on the -x side; Earth is at the origin. The Moon's
 * orbit is tilted by `inclination` around the Sun-Earth line (the node
 * line), so at most orbit positions the Moon passes above or below the
 * shadow lines — which is why eclipses do not happen every month. The Moon
 * enters Earth's shadow cone near full moon at a node (lunar eclipse); its
 * own shadow cone reaches Earth near new moon at a node (solar eclipse).
 * Not to scale; sizes and distances are compressed for visibility.
 */

const DEG = Math.PI / 180;

/** Moon orbit radius (scene units) at the mean Earth-Moon distance. */
const ORBIT_RADIUS = 4;
/** Extra orbit radius at perigee/apogee so the distance slider moves visibly. */
const ORBIT_RADIUS_SPREAD = 0.8;
const MEAN_MOON_DISTANCE = 384400;
const APPEAR_SIZE_REF = 406700; // apogee; normalises the distance→radius mapping

const SUN_POSITION: [number, number, number] = [-14, 0, 0];
const EARTH_RADIUS = 2;
const MOON_RADIUS = 0.55;

/** Earth's umbra cone: base radius at Earth, apex at this distance. */
const UMBRA_LENGTH = 6.5;
const UMBRA_BASE_RADIUS = 1.2;

/**
 * Moon position on the inclined orbit, measured from the node that points
 * toward the Sun: x = -r·cos θ, y = r·sin i·sin θ, z = r·cos i·sin θ.
 * θ = 0 is a new moon exactly on the node (solar eclipse); θ = 180 a full
 * moon on the opposite node (lunar eclipse).
 */
function moonPosition(orbitAngle: number, inclination: number, radius: number): [number, number, number] {
  const th = orbitAngle * DEG;
  const inc = inclination * DEG;
  return [
    -radius * Math.cos(th),
    radius * Math.sin(inc) * Math.sin(th),
    radius * Math.cos(inc) * Math.sin(th),
  ];
}

/** Points along the inclined orbit, for the orbit ring line. */
function orbitPoints(inclination: number, radius: number): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 128; i++) {
    const [x, y, z] = moonPosition((i * 360) / 128, inclination, radius);
    pts.push(new THREE.Vector3(x, y, z));
  }
  return pts;
}

/** A cone of shadow along +x from `origin`, matching the shadowCone part renderer. */
function ShadowCone({
  origin,
  length,
  baseRadius,
  opacity,
  color = "#0b0e14",
}: {
  origin: [number, number, number];
  length: number;
  baseRadius: number;
  opacity: number;
  color?: string;
}) {
  const quaternion = useMemo(
    () =>
      new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(1, 0, 0),
      ),
    [],
  );
  return (
    <mesh position={[origin[0] + length / 2, origin[1], origin[2]]} quaternion={quaternion}>
      <coneGeometry args={[baseRadius, length, 24, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent={opacity < 1}
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function EclipsesScene({
  values,
  labelsVisible = true,
}: {
  values: VariableValues;
  labelsVisible?: boolean;
}) {
  const orbitAngle = values.orbitAngle ?? 0;
  const inclination = values.inclination ?? 5.1;
  const moonDistance = values.moonDistance ?? MEAN_MOON_DISTANCE;

  const texture = useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/earth-blue-marble.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Map the km distance onto a visible orbit radius (perigee→apogee).
  const radius =
    ORBIT_RADIUS +
    ((moonDistance - MEAN_MOON_DISTANCE) / (APPEAR_SIZE_REF - MEAN_MOON_DISTANCE)) * ORBIT_RADIUS_SPREAD;

  const moon = moonPosition(orbitAngle, inclination, radius);

  // Ecliptic reference ring: the flat circle the inclined orbit crosses at
  // the two nodes. Same radius as the moon orbit, very faint.
  const eclipticRing = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const a = ((i * 360) / 128) * DEG;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    const geom = new THREE.BufferGeometry().setFromPoints(pts);
    return new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: "#5a6b8c", transparent: true, opacity: 0.35 }),
    );
  }, [radius]);

  const moonOrbitRing = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints(orbitPoints(inclination, radius));
    return new THREE.Line(
      geom,
      new THREE.LineBasicMaterial({ color: "#8fa8cc", transparent: true, opacity: 0.8 }),
    );
  }, [inclination, radius]);

  // The Moon's shadow always points away from the Sun (+x here).
  const moonShadowLength = radius;

  return (
    <group>
      <Stars radius={90} depth={30} count={1400} factor={3} saturation={0} fade={false} speed={0} />

      {/* Sun: fixed on the -x side. */}
      <mesh position={SUN_POSITION}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#fff4d6" />
      </mesh>
      <pointLight position={SUN_POSITION} intensity={120} decay={0} color="#fff4d6" />
      {labelsVisible && (
        <Text position={[SUN_POSITION[0], 2.1, 0]} fontSize={0.5} color="#ffe9b0">
          Sun
        </Text>
      )}

      {/* Earth at the origin. */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 40, 40]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
      </mesh>
      {labelsVisible && (
        <Text position={[0, 2.6, 0]} fontSize={0.5} color="#dfe6f5">
          Earth
        </Text>
      )}

      {/* Earth's umbra cone pointing away from the Sun (+x). */}
      <ShadowCone origin={[0, 0, 0]} length={UMBRA_LENGTH} baseRadius={UMBRA_BASE_RADIUS} opacity={0.5} />

      {/* Moon on its inclined orbit. */}
      <mesh position={moon}>
        <sphereGeometry args={[MOON_RADIUS, 24, 24]} />
        <meshStandardMaterial color="#b9bfcd" roughness={0.95} metalness={0} />
      </mesh>
      {labelsVisible && (
        <Text position={[moon[0], moon[1] + 0.9, moon[2]]} fontSize={0.4} color="#cfd6e4">
          Moon
        </Text>
      )}

      {/* The Moon's own shadow cone pointing away from the Sun (+x). */}
      <ShadowCone
        origin={moon}
        length={moonShadowLength}
        baseRadius={MOON_RADIUS}
        opacity={0.55}
        color="#111621"
      />

      {/* Orbit rings: faint flat ecliptic reference + inclined moon orbit.
          The crossing points are the nodes. */}
      <primitive object={eclipticRing} />
      <primitive object={moonOrbitRing} />

      {/* Node markers where the orbit crosses the ecliptic plane. */}
      {[
        [radius, 0, 0],
        [-radius, 0, 0],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshBasicMaterial color="#ffd76e" />
        </mesh>
      ))}
      {labelsVisible && (
        <>
          <Text position={[radius + 0.15, 0.55, 0]} fontSize={0.35} color="#ffd76e">
            node
          </Text>
          <Text position={[-radius - 0.15, 0.55, 0]} fontSize={0.35} color="#ffd76e">
            node
          </Text>
        </>
      )}
    </group>
  );
}
