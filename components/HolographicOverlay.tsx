"use client";

import clsx from "clsx";

interface HolographicOverlayProps {
  glareX?: number;
  glareY?: number;
  intensity?: "normal" | "high";
}

export default function HolographicOverlay({
  glareX = 50,
  glareY = 50,
  intensity = "normal",
}: HolographicOverlayProps) {
  const isHigh = intensity === "high";

  return (
    <>
      <div
        className={clsx(
          "absolute inset-0 pointer-events-none holo-overlay",
          isHigh && "holo-overlay-premium"
        )}
      />
      <div
        className="holo-shine absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.55) 0%, transparent 45%)`,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-70 transition-opacity duration-300 mix-blend-overlay"
        style={{
          background: `conic-gradient(from ${glareX * 3.6}deg at ${glareX}% ${glareY}%,
            rgba(255,50,150,0.35),
            rgba(50,200,255,0.35),
            rgba(255,220,50,0.35),
            rgba(150,50,255,0.35),
            rgba(255,100,50,0.35),
            rgba(255,50,150,0.35))`,
        }}
      />
      {isHigh && (
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-500"
          style={{
            background: `linear-gradient(
              ${135 + glareX * 0.5}deg,
              transparent 30%,
              rgba(255,255,255,0.6) 48%,
              rgba(200,220,255,0.4) 50%,
              rgba(255,255,255,0.6) 52%,
              transparent 70%
            )`,
            backgroundSize: "200% 200%",
            animation: "holoShift 2.5s linear infinite",
          }}
        />
      )}
    </>
  );
}
