"use client";

import { allCreatures, regions } from "@/data";
import type { ThreatSignal } from "@/data/dashboard-types";

interface ThreatRadarProps {
  signals: ThreatSignal[];
  onSelectCreature: (creatureId: string) => void;
}

export default function ThreatRadar({
  signals,
  onSelectCreature,
}: ThreatRadarProps) {
  // Compute per-region aggregate threat level from signals
  const regionSignalCounts = new Map<string, number>();
  const regionMaxStrength = new Map<string, number>();
  for (const signal of signals) {
    for (const regionId of signal.relatedRegions) {
      regionSignalCounts.set(
        regionId,
        (regionSignalCounts.get(regionId) ?? 0) + 1,
      );
      regionMaxStrength.set(
        regionId,
        Math.max(regionMaxStrength.get(regionId) ?? 0, signal.strength),
      );
    }
  }

  // Creature-level signal heat
  const creatureSignalCount = new Map<string, number>();
  const creatureMaxStrength = new Map<string, number>();
  for (const signal of signals) {
    for (const cid of signal.relatedCreatures) {
      creatureSignalCount.set(
        cid,
        (creatureSignalCount.get(cid) ?? 0) + 1,
      );
      creatureMaxStrength.set(
        cid,
        Math.max(creatureMaxStrength.get(cid) ?? 0, signal.strength),
      );
    }
  }

  const svgSize = 500;
  const center = svgSize / 2;
  const maxRadius = svgSize / 2 - 40;

  // Place regions evenly around the radar
  const regionAngles = regions.map((_, i) => (i / regions.length) * Math.PI * 2 - Math.PI / 2);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${svgSize} ${svgSize}`}
        className="w-full max-w-[500px] mx-auto"
        role="img"
        aria-label="Threat radar visualization showing signal activity by region"
      >
        {/* Concentric rings */}
        {[0.2, 0.4, 0.6, 0.8, 1.0].map((r) => (
          <circle
            key={r}
            cx={center}
            cy={center}
            r={maxRadius * r}
            fill="none"
            stroke="rgba(44,24,16,0.1)"
            strokeWidth={r === 1 ? 1.5 : 0.5}
            strokeDasharray={r < 1 ? "4 4" : undefined}
          />
        ))}

        {/* Sweep line animation */}
        <line
          x1={center}
          y1={center}
          x2={center}
          y2={center - maxRadius}
          stroke="rgba(6,95,70,0.3)"
          strokeWidth={2}
          className="radar-sweep"
          style={{ transformOrigin: `${center}px ${center}px` }}
        />

        {/* Radial lines to each region */}
        {regionAngles.map((angle, i) => {
          const region = regions[i];
          const x2 = center + Math.cos(angle) * maxRadius;
          const y2 = center + Math.sin(angle) * maxRadius;
          return (
            <line
              key={region.id}
              x1={center}
              y1={center}
              x2={x2}
              y2={y2}
              stroke="rgba(44,24,16,0.08)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Region sectors — filled with signal intensity */}
        {regionAngles.map((angle, i) => {
          const region = regions[i];
          const nextAngle = regionAngles[(i + 1) % regions.length];
          const signalCount = regionSignalCounts.get(region.id) ?? 0;
          const maxStr = regionMaxStrength.get(region.id) ?? 0;
          const intensity = Math.min(signalCount / 8, 1); // normalize
          const sectorRadius = maxRadius * (0.3 + intensity * 0.7);

          // Arc path
          const x1 = center + Math.cos(angle) * sectorRadius;
          const y1 = center + Math.sin(angle) * sectorRadius;
          const x2 = center + Math.cos(nextAngle) * sectorRadius;
          const y2 = center + Math.sin(nextAngle) * sectorRadius;
          const largeArc = nextAngle - angle > Math.PI ? 1 : 0;

          return (
            <g key={region.id}>
              <path
                d={`M ${center} ${center} L ${x1} ${y1} A ${sectorRadius} ${sectorRadius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                fill={region.color.accent}
                opacity={0.08 + intensity * 0.15}
                className={maxStr >= 4 ? "radar-pulse" : ""}
              />
            </g>
          );
        })}

        {/* Creature blips */}
        {allCreatures.map((creature) => {
          const regionIdx = regions.findIndex((r) => r.id === creature.region);
          if (regionIdx === -1) return null;

          const angle = regionAngles[regionIdx];
          const nextAngle = regionAngles[(regionIdx + 1) % regions.length];
          const midAngle = angle + (nextAngle - angle) / 2 + (
            // Offset within sector based on creature position
            ((creature.mapPosition.x + creature.mapPosition.y) % 1 - 0.5) * 0.3
          );

          // Distance from center based on threat level
          const threatTotal =
            creature.threatGradient.likelihood +
            creature.threatGradient.impact +
            creature.threatGradient.detectability;
          const normalizedThreat = threatTotal / 15;
          const distance = maxRadius * (0.2 + normalizedThreat * 0.7);

          const cx = center + Math.cos(midAngle) * distance;
          const cy = center + Math.sin(midAngle) * distance;

          const signalHeat = creatureSignalCount.get(creature.id) ?? 0;
          const maxStr = creatureMaxStrength.get(creature.id) ?? 0;
          const blipSize = 4 + signalHeat * 2;

          const region = regions[regionIdx];

          return (
            <g key={creature.id}>
              {/* Signal heat glow */}
              {signalHeat > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={blipSize + 6}
                  fill={region.color.accent}
                  opacity={0.15 + signalHeat * 0.05}
                  className={maxStr >= 4 ? "radar-pulse" : ""}
                />
              )}
              {/* Creature blip */}
              <circle
                cx={cx}
                cy={cy}
                r={blipSize}
                fill={region.color.accent}
                opacity={
                  creature.currentStatus.status === "confirmed"
                    ? 0.9
                    : creature.currentStatus.status === "emerging"
                      ? 0.6
                      : 0.3
                }
                stroke="rgba(245,240,225,0.6)"
                strokeWidth={1}
                className="cursor-pointer transition-all duration-200 hover:opacity-100"
                onClick={() => onSelectCreature(creature.id)}
              >
                <title>
                  {creature.name} — {signalHeat} signal{signalHeat !== 1 ? "s" : ""}
                </title>
              </circle>
            </g>
          );
        })}

        {/* Region labels */}
        {regionAngles.map((angle, i) => {
          const region = regions[i];
          const nextAngle = regionAngles[(i + 1) % regions.length];
          const midAngle = angle + (nextAngle - angle) / 2;
          const labelR = maxRadius + 20;
          const lx = center + Math.cos(midAngle) * labelR;
          const ly = center + Math.sin(midAngle) * labelR;

          return (
            <text
              key={region.id}
              x={lx}
              y={ly}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[8px] font-bold uppercase tracking-widest"
              fill="rgba(44,24,16,0.5)"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {region.name.replace("The ", "").slice(0, 10)}
            </text>
          );
        })}

        {/* Center icon */}
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-lg"
        >
          👁️
        </text>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 mt-4 px-4">
        <div className="flex items-center gap-1.5 text-xs text-ink-light">
          <div className="w-2 h-2 rounded-full bg-red-500 opacity-90" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-light">
          <div className="w-2 h-2 rounded-full bg-amber-500 opacity-60" />
          <span>Emerging</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-light">
          <div className="w-2 h-2 rounded-full bg-gray-400 opacity-30" />
          <span>Theoretical</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-light">
          <div className="w-3 h-3 rounded-full border-2 border-amber-400 opacity-60 radar-pulse" />
          <span>Active signals</span>
        </div>
      </div>
    </div>
  );
}
