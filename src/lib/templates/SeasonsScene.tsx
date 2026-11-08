"use client";

import { useMemo } from "react";
import { Stars, Text } from "@react-three/drei";
import * as THREE from "three";
import type { VariableValues } from "@/lib/viewer/evaluate";
import {
  solarDeclination,
  noonSunAltitude,
  beamSpread,
} from "@/lib/formulas";

/**
 * The Seasons template scene (Task 5).
 *
 * Earth keeps its axis fixed in space (pointing the same way all year) while
 * the Sun's direction rotates around it as the student scrubs the orbit —
 * which is what actually happens: seasons come from the tilt, not distance.
 * Not to scale; the Sun is drawn far smaller and closer than reality.
 */

const DEG = Math.PI / 180;
/** Day the northern hemisphere leans hardest toward the Sun (June solstice). */
const JUNE_SOLSTICE = 172;

function AxisLine({ tiltDeg }: { tiltDeg: number }) {
  const { geometry, quaternion } = useMemo(() => {
    const dir = new THREE.Vector3(Math.sin(tiltDeg * DEG), Math.cos(tiltDeg * DEG), 0);
    const g = new THREE.CylinderGeometry(0.015, 0.015, 1, 6);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.normalize(),
    );
    return { geometry: g, quaternion: q };
  }, [tiltDeg]);
  return (
    // Cylinder spans 1 unit in y; scale to the 5.6-unit axis length through
    // the globe centre (the tilt quaternion orients it along the axis).
    <mesh geometry={geometry} quaternion={quaternion} position={[0, 0, 0]} scale={[1, 5.6, 1]}>
      <meshBasicMaterial color="#9aa6c3" />
    </mesh>
  );
}

function EarthScene({ values }: { values: VariableValues }) {
  const dayOfYear = values.dayOfYear ?? 172;
  const tilt = values.tilt ?? 23.44;
  const latitude = values.latitude ?? 51.5;

  const texture = useMemo(() => {
    const t = new THREE.TextureLoader().load("/textures/earth-blue-marble.jpg");
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);

  // Sun direction angle around Earth: 0° (+x) on the June solstice, so the
  // fixed axis (leaning toward +x) points at the Sun in June and away in
  // December.
  const sunAngle = ((dayOfYear - JUNE_SOLSTICE) / 365.25) * 360;
  const sunPos: [number, number, number] = [
    Math.cos(sunAngle * DEG) * 10,
    0,
    Math.sin(sunAngle * DEG) * 10,
  ];

  const declination = solarDeclination(dayOfYear, tilt);
  const altitude = noonSunAltitude(latitude, declination);
  const spread = beamSpread(altitude);

  return (
    <group>
      <Stars radius={90} depth={30} count={2500} factor={3} saturation={0} fade={false} speed={0} />
      {/* Sun: unlit disc + point light from the current orbital direction. */}
      <mesh position={sunPos}>
        <sphereGeometry args={[1.6, 32, 32]} />
        <meshBasicMaterial color="#fff4d6" />
      </mesh>
      <pointLight position={sunPos} intensity={120} decay={0} color="#fff4d6" />
      <Text position={[sunPos[0] * 1.12, 1.9, sunPos[1] * 1.12]} fontSize={0.5} color="#ffe9b0">
        Sun
      </Text>

      {/* Earth: Blue Marble texture, axis tilted around z (toward +x at 0°). */}
      <mesh rotation={[0, 0, tilt * DEG]}>
        <sphereGeometry args={[2, 48, 48]} />
        <meshStandardMaterial map={texture} roughness={0.85} metalness={0} />
      </mesh>
      <AxisLine tiltDeg={tilt} />
      <Text position={[0, 3.2, 0]} fontSize={0.5} color="#dfe6f5">
        Earth
      </Text>

      {/* Orbit ring showing the year's path (visual only). */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[10, 0.02, 8, 128]} />
        <meshBasicMaterial color="#5a6b8c" transparent opacity={0.5} />
      </mesh>
      <SeasonsGroundView latitude={latitude} altitude={altitude} spread={spread} />
    </group>
  );
}

/**
 * City ground view: flat ground, an observer marker, the Sun at its noon
 * altitude, and the sunlight patch whose spread grows as the Sun gets lower.
 */
function SeasonsGroundView({
  latitude,
  altitude,
  spread,
}: {
  latitude: number;
  altitude: number;
  spread: number;
}) {
  const alt = Math.max(0, Math.min(90, altitude));
  // Display cap so extreme spreads stay readable.
  const spreadCap = Math.min(spread, 6);
  const sunDist = 6;
  const sunY = Math.sin(alt * DEG) * sunDist;
  const sunHoriz = Math.cos(alt * DEG) * sunDist;
  const sunPos: [number, number, number] = [sunHoriz, sunY, 3.5];
  // Patch: the overhead-sun reference patch (radius 1) and the spread patch.
  const patchA = Math.max(0.15, spreadCap);
  return (
    <group position={[0, -3.2, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4.5, 32]} />
        <meshStandardMaterial color="#2e4d3a" roughness={1} />
      </mesh>
      {/* Observer marker. */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.7, 8]} />
        <meshStandardMaterial color="#cfd6e4" />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial color="#e8ecf7" />
      </mesh>
      <Text position={[0, 1.35, 0]} fontSize={0.35} color="#cfd6e4">
        {`City (${latitude.toFixed(1)}°)`}
      </Text>
      {/* Sun disc in the ground-view sky + ray down to the patch. */}
      <mesh position={sunPos}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial color="#ffe9b0" />
      </mesh>
      <RayFromTo from={sunPos} to={[0, 0.05, 0]} color="#ffd76e" />
      {/* Overhead-sun reference patch and the spread patch (bigger and
          dimmer as the sun gets lower). */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.95, 1, 32]} />
        <meshBasicMaterial color="#ffd76e" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[patchA, 1, 1]}>
        <circleGeometry args={[1, 32]} />
        <meshBasicMaterial color="#ffd76e" transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

function RayFromTo({
  from,
  to,
  color,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
}) {
  const line = useMemo(() => {
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(...from),
      new THREE.Vector3(...to),
    ]);
    return new THREE.Line(geom, new THREE.LineBasicMaterial({ color }));
  }, [from, to, color]);
  return <primitive object={line} />;
}

export default EarthScene;
