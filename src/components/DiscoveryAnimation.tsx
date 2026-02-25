"use client";

import { useEffect, useState } from "react";
import type { Creature } from "@/data";
import { regions } from "@/data";

interface DiscoveryAnimationProps {
  creature: Creature;
  onComplete: () => void;
}

export default function DiscoveryAnimation({ creature, onComplete }: DiscoveryAnimationProps) {
  const [phase, setPhase] = useState<"burst" | "info" | "done">("burst");

  const region = regions.find((r) => r.id === creature.region);
  const accent = region?.color.accent ?? "#f59e0b";

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("info"), 600);
    const t2 = setTimeout(() => setPhase("done"), 2400);
    const t3 = setTimeout(onComplete, 2600);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none">
      {/* Backdrop flash with region color */}
      <div
        className="absolute inset-0 animate-[discovery-flash_1s_ease-out_forwards]"
        style={{
          background: `radial-gradient(circle at 50% 45%, ${accent}20, transparent 60%)`,
        }}
      />

      {/* Center content */}
      <div className="relative flex flex-col items-center">
        {/* Outer particle ring */}
        <div className="absolute w-64 h-64">
          {[...Array(16)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                top: "50%",
                left: "50%",
                backgroundColor: i % 2 === 0 ? accent : "#f59e0b",
                opacity: 0,
                animation: `discovery-particle ${0.8 + Math.random() * 0.4}s ease-out ${i * 0.03}s forwards`,
                transform: `rotate(${i * 22.5}deg) translateY(-${60 + Math.random() * 40}px)`,
              }}
            />
          ))}
        </div>

        {/* Inner sparkle ring */}
        <div className="absolute w-40 h-40 animate-[discovery-ring_1.2s_ease-out_forwards]">
          {[...Array(8)].map((_, i) => (
            <div
              key={`spark-${i}`}
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: "3px",
                height: "12px",
                borderRadius: "2px",
                backgroundColor: accent,
                opacity: 0,
                transform: `rotate(${i * 45}deg) translateY(-50px)`,
                animation: `discovery-sparkle 0.8s ease-out ${0.1 + i * 0.04}s forwards`,
              }}
            />
          ))}
        </div>

        {/* Expanding glow ring */}
        <div
          className="absolute w-24 h-24 rounded-full animate-[discovery-glow-ring_1s_ease-out_forwards]"
          style={{
            border: `2px solid ${accent}`,
            opacity: 0,
          }}
        />

        {/* Sprite container */}
        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center animate-[discovery-burst_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
          style={{
            transform: "scale(0)",
            background: `linear-gradient(135deg, ${accent}18, ${accent}08)`,
            border: `2px solid ${accent}40`,
            boxShadow: `0 0 40px ${accent}30, inset 0 0 20px ${accent}10`,
          }}
        >
          <span className="text-5xl">{creature.icon}</span>
        </div>

        {/* Name + XP + Region */}
        {phase !== "burst" && (
          <div className="flex flex-col items-center gap-1.5 mt-4 animate-[fade-in-up_0.4s_ease-out_forwards]">
            <span
              className="text-xl font-bold text-ink tracking-[0.15em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {creature.name}
            </span>
            <span
              className="text-xs font-bold tracking-widest"
              style={{ color: accent }}
            >
              {region?.name}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-ink-light tracking-wide">DISCOVERED</span>
            </div>
            <span
              className="mt-1 px-3 py-1 rounded-full text-sm font-bold animate-[xp-float_1.5s_ease-out_0.5s_forwards]"
              style={{
                backgroundColor: `${accent}15`,
                color: accent,
                border: `1px solid ${accent}25`,
              }}
            >
              +10 XP
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
