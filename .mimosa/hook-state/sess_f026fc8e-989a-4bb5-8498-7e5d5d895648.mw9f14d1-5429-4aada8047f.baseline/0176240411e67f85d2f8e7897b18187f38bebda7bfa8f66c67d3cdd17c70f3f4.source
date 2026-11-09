"use client";

import { Canvas } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

/**
 * The actual three.js canvas for the landing page. Loaded on demand (see
 * HomeScene) so three.js never blocks the landing page's interactivity.
 */
export default function HomeSceneCanvas() {
  const mesh = useRef<Mesh>(null);
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 45 }}
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[4, 3, 5]} intensity={2} color="#fff4e0" />
      <mesh ref={mesh} rotation={[0, -0.4, 0.25]}>
        <sphereGeometry args={[1.5, 48, 48]} />
        <meshStandardMaterial color="#3b6fc9" roughness={0.7} metalness={0.05} />
      </mesh>
    </Canvas>
  );
}
