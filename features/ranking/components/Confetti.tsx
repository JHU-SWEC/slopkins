"use client";

import { useEffect, useRef } from "react";

// Brand blues plus the score colors, so it feels like Slopkins.
const COLORS = ["#002d72", "#68ace5", "#10b981", "#f59e0b", "#f43f5e", "#a855f7"];
const PIECES = 90;

/**
 * A one-time burst of confetti over the page, for big moments (a first plate,
 * a new #1). Pure Web Animations, no library. Skipped when the device asks
 * for reduced motion.
 */
export function Confetti() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const fall = window.innerHeight * 0.7;
    const animations = Array.from({ length: PIECES }, (_, i) => {
      const piece = document.createElement("span");
      const size = 6 + Math.random() * 6;
      Object.assign(piece.style, {
        position: "absolute",
        left: "50%",
        top: "30%",
        width: `${size}px`,
        height: `${size * 0.45}px`,
        background: COLORS[i % COLORS.length],
        borderRadius: "1px",
      });
      root.appendChild(piece);

      // Burst outward (mostly up), then drift down and fade.
      const angle = Math.random() * Math.PI * 2;
      const speed = 120 + Math.random() * 260;
      const dx = Math.cos(angle) * speed;
      const dy = Math.sin(angle) * speed - 160;
      const spin = (Math.random() - 0.5) * 1440;
      return piece.animate(
        [
          { transform: "translate(-50%, -50%) rotate(0deg)", opacity: 1 },
          {
            transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) rotate(${spin / 2}deg)`,
            opacity: 1,
            offset: 0.35,
          },
          {
            transform: `translate(calc(-50% + ${dx * 1.3}px), calc(-50% + ${dy + fall}px)) rotate(${spin}deg)`,
            opacity: 0,
          },
        ],
        { duration: 1800 + Math.random() * 1200, easing: "cubic-bezier(0.2, 0.6, 0.4, 1)", fill: "forwards" },
      );
    });

    return () => {
      animations.forEach((animation) => animation.cancel());
      root.replaceChildren();
    };
  }, []);

  return <div ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden" />;
}
