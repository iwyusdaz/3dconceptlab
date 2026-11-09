"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const HomeSceneCanvas = dynamic(() => import("./HomeSceneCanvas"), { ssr: false });

/**
 * Landing-page decorative lit sphere. The three.js canvas is deferred until
 * the main thread is idle so it never blocks interactivity (Lighthouse
 * target: performance 90+); an SVG lit sphere shows immediately.
 */
export function HomeScene() {
  const [showCanvas, setShowCanvas] = useState(false);

  useEffect(() => {
    const w = window as Window &
      typeof globalThis & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };
    const idle = w.requestIdleCallback
      ? w.requestIdleCallback(() => setShowCanvas(true), { timeout: 3000 })
      : window.setTimeout(() => setShowCanvas(true), 1200);
    return () => {
      if (w.cancelIdleCallback && typeof idle === "number") {
        w.cancelIdleCallback(idle);
      } else {
        clearTimeout(idle as unknown as number);
      }
    };
  }, []);

  if (!showCanvas) {
    return (
      <div className="hero-sphere-fallback" aria-hidden="true">
        <svg viewBox="0 0 200 200" width="240" height="240" role="presentation">
          <defs>
            <radialGradient id="litSphere" cx="35%" cy="30%" r="75%">
              <stop offset="0%" stopColor="#7db2ff" />
              <stop offset="55%" stopColor="#3b6fc9" />
              <stop offset="100%" stopColor="#12224a" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="80" fill="url(#litSphere)" />
          <ellipse cx="72" cy="62" rx="26" ry="16" fill="#b9d4ff" opacity="0.25" />
        </svg>
      </div>
    );
  }
  return <HomeSceneCanvas />;
}
