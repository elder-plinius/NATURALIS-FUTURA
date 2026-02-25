"use client";

import { useEffect, useState } from "react";
import type { Creature } from "@/data";

interface DiscoveryAnimationProps {
  creature: Creature;
  onComplete: () => void;
}

export default function DiscoveryAnimation({ creature, onComplete }: DiscoveryAnimationProps) {
  const [phase, setPhase] = useState<"burst" | "info" | "done">("burst");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("info"), 600);
    const t2 = setTimeout(() => setPhase("done"), 2200);
    const t3 = setTimeout(onComplete, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop flash */}
      <div className="absolute inset-0 bg-amber-400/10 animate-[discovery-flash_0.8s_ease-out_forwards]" />

      {/* Center content */}
      <div className="relative flex flex-col items-center gap-3">
        {/* Particle ring */}
        <div className="absolute w-40 h-40 animate-[discovery-ring_1s_ease-out_forwards]">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-amber-400"
              style={{
                top: "50%",
                left: "50%",
                transform: `rotate(${i * 45}deg) translateY(-60px)`,
                opacity: 0,
                animation: `discovery-particle 1s ease-out ${i * 0.05}s forwards`,
              }}
            />
          ))}
        </div>

        {/* Creature icon */}
        <span
          className="text-7xl drop-shadow-[0_0_20px_rgba(234,179,8,0.6)] animate-[discovery-burst_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
          style={{ transform: "scale(0)" }}
        >
          {creature.icon}
        </span>

        {/* Name + XP */}
        {phase !== "burst" && (
          <div className="flex flex-col items-center gap-1 animate-[fade-in-up_0.4s_ease-out_forwards]">
            <span
              className="text-lg font-bold text-ink tracking-widest"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {creature.name}
            </span>
            <span className="text-sm text-ink-light">DISCOVERED</span>
            <span className="text-amber-600 font-bold text-sm animate-[xp-float_1.2s_ease-out_0.3s_forwards]">
              +10 XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
