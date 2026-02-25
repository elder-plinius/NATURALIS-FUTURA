"use client";

import { regions, allCreatures, hopeCreatures, getCreaturesByRegion } from "@/data";
import type { Creature, Region } from "@/data";

interface MapCanvasProps {
  onSelectCreature: (creature: Creature) => void;
  onSelectRegion: (regionId: string) => void;
  selectedCreature: Creature | null;
  selectedRegion: string | null;
  showHope: boolean;
  mapRevealed: boolean;
  discoveredSet?: Set<string>;
  containedSet?: Set<string>;
}

const REGION_COLORS: Record<string, { accent: string; glow: string }> = {
  abyss: { accent: "#7c3aed", glow: "124, 58, 237" },
  "siren-sea": { accent: "#f59e0b", glow: "245, 158, 11" },
  "throne-room": { accent: "#ca8a04", glow: "202, 138, 4" },
  hive: { accent: "#eab308", glow: "234, 179, 8" },
  "mirror-dark": { accent: "#93c5fd", glow: "147, 197, 253" },
  "spawning-grounds": { accent: "#06b6d4", glow: "6, 182, 212" },
  colosseum: { accent: "#ea580c", glow: "234, 88, 12" },
  catacombs: { accent: "#00ff88", glow: "0, 255, 136" },
};

function CreatureNode({
  creature,
  onSelect,
  isSelected,
  isConnected,
  isDiscovered,
  isContained,
}: {
  creature: Creature;
  onSelect: (c: Creature) => void;
  isSelected: boolean;
  isConnected: boolean;
  isDiscovered: boolean;
  isContained: boolean;
}) {
  const statusClass =
    isDiscovered
      ? creature.currentStatus.status === "emerging"
        ? "status-breathing"
        : creature.currentStatus.status === "confirmed"
          ? "status-alert"
          : ""
      : "";

  const sizeMultiplier =
    (creature.threatGradient.likelihood +
      creature.threatGradient.impact +
      creature.threatGradient.detectability) /
    15;

  const regionColor = REGION_COLORS[creature.region] ?? { accent: "#7c3aed", glow: "124, 58, 237" };
  const composite = creature.threatGradient.likelihood + creature.threatGradient.impact + creature.threatGradient.detectability;

  return (
    <button
      onClick={() => onSelect(creature)}
      className={`creature-node absolute flex flex-col items-center ${statusClass} ${isSelected ? "z-20" : "z-10"} group`}
      style={{
        left: `${creature.mapPosition.x * 100}%`,
        top: `${creature.mapPosition.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${0.8 + sizeMultiplier * 0.4})`,
      }}
      title={isDiscovered ? creature.name : "Unknown creature"}
      aria-label={isDiscovered ? `${creature.name} — ${creature.currentStatus.status}` : "Unknown creature — click to discover"}
    >
      {/* Outer threat ring */}
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ${isSelected ? "scale-125" : "group-hover:scale-110"}`}
      >
        {/* Ambient glow */}
        {isDiscovered && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.6) 0%, transparent 70%)`,
              transform: "scale(2)",
            }}
          />
        )}

        {/* Threat ring (outer) */}
        <div
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            !isDiscovered
              ? "bg-ink/5 border border-ink/10"
              : isContained
                ? "border-2"
                : "border-2"
          } ${isConnected ? "ring-2 ring-offset-1 ring-amber-400" : ""}`}
          style={isDiscovered ? {
            borderColor: isContained ? "#16a34a" : regionColor.accent + "80",
            background: isContained
              ? `radial-gradient(circle at 30% 30%, rgba(22, 163, 74, 0.12), rgba(22, 163, 74, 0.04))`
              : `radial-gradient(circle at 30% 30%, rgba(${regionColor.glow}, 0.15), rgba(${regionColor.glow}, 0.03))`,
            boxShadow: isSelected
              ? `0 0 20px rgba(${regionColor.glow}, 0.5), inset 0 0 8px rgba(${regionColor.glow}, 0.15)`
              : `0 2px 8px rgba(0,0,0,0.1), inset 0 1px 2px rgba(255,255,255,0.3)`,
          } : undefined}
        >
          {/* Inner threat level dots */}
          {isDiscovered && !isContained && (
            <div className="absolute -top-0.5 -right-0.5 flex gap-px">
              {[...Array(Math.min(5, Math.ceil(composite / 3)))].map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor: composite >= 12 ? "#ef4444" : composite >= 8 ? "#f59e0b" : "#6b7280",
                  }}
                />
              ))}
            </div>
          )}

          {/* Creature emoji / mystery */}
          <span className={`text-2xl md:text-2xl ${!isDiscovered ? "grayscale opacity-50" : ""}`}>
            {isDiscovered ? creature.icon : "?"}
          </span>

          {/* Contained shield */}
          {isContained && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                <path d="M2 5L4.5 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Status ring animation for confirmed threats */}
          {isDiscovered && creature.currentStatus.status === "confirmed" && !isContained && (
            <div
              className="absolute inset-0 rounded-full animate-[threat-pulse_2s_ease-in-out_infinite]"
              style={{
                border: `1px solid ${regionColor.accent}`,
                opacity: 0.4,
              }}
            />
          )}
        </div>
      </div>

      {/* Name label */}
      <span
        className={`mt-1 text-xs font-bold whitespace-nowrap tracking-wide leading-tight max-w-20 truncate ${
          isDiscovered ? "text-ink" : "text-ink/30"
        } ${isSelected ? "text-sm" : ""}`}
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 1px 3px rgba(245,240,225,0.9), 0 0px 1px rgba(245,240,225,1)",
        }}
      >
        {isDiscovered ? creature.name.replace("THE ", "") : "???"}
      </span>

      {/* Status indicator dot */}
      {isDiscovered && !isContained && (
        <div className="flex items-center gap-1 mt-0.5">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              creature.currentStatus.status === "confirmed"
                ? "bg-red-500 animate-pulse"
                : creature.currentStatus.status === "emerging"
                  ? "bg-amber-500"
                  : "bg-gray-400"
            }`}
          />
        </div>
      )}
    </button>
  );
}

function RegionOverlay({
  region,
  onSelect,
  isSelected,
  creatureCount,
}: {
  region: Region;
  onSelect: (id: string) => void;
  isSelected: boolean;
  creatureCount: number;
}) {
  return (
    <button
      onClick={() => onSelect(region.id)}
      className={`region-area absolute rounded-2xl transition-all duration-300 overflow-hidden ${
        isSelected ? "shadow-lg" : ""
      }`}
      style={{
        left: `${region.mapPosition.x * 100}%`,
        top: `${region.mapPosition.y * 100}%`,
        width: `${region.mapPosition.width * 100}%`,
        height: `${region.mapPosition.height * 100}%`,
        border: isSelected
          ? `2px solid ${region.color.accent}90`
          : `1px dashed ${region.color.accent}40`,
        backgroundColor: region.color.primary + "08",
      }}
      aria-label={`${region.name} region — ${creatureCount} creatures`}
    >
      {/* Region ambient glow */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${region.color.accent}, transparent 70%)`,
        }}
      />

      {/* Region corner accents */}
      <div
        className="absolute top-0 left-0 w-8 h-8 opacity-20 pointer-events-none"
        style={{
          borderTop: `2px solid ${region.color.accent}`,
          borderLeft: `2px solid ${region.color.accent}`,
          borderRadius: "16px 0 0 0",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-8 h-8 opacity-20 pointer-events-none"
        style={{
          borderBottom: `2px solid ${region.color.accent}`,
          borderRight: `2px solid ${region.color.accent}`,
          borderRadius: "0 0 16px 0",
        }}
      />

      <div className="absolute top-2 left-3 md:top-3 md:left-4">
        <h3
          className="text-xs md:text-sm font-bold tracking-[0.2em]"
          style={{
            fontFamily: "var(--font-display)",
            color: region.color.accent,
            textShadow: `0 0 20px ${region.color.accent}30`,
          }}
        >
          {region.name}
        </h3>
        <p className="text-xs text-ink-light opacity-60 mt-0.5">
          {region.subtitle}
        </p>
      </div>

      {/* Region creature count badge */}
      <div
        className="absolute bottom-2 right-3 md:bottom-3 md:right-4 text-xs font-mono opacity-30"
        style={{ color: region.color.accent }}
      >
        {creatureCount}
      </div>
    </button>
  );
}

function CompoundLines({
  selectedCreature,
  creatures,
}: {
  selectedCreature: Creature | null;
  creatures: Creature[];
}) {
  if (!selectedCreature) return null;

  const connectedIds = selectedCreature.compoundRisk;
  const connected = creatures.filter((c) => connectedIds.includes(c.id));
  const regionColor = REGION_COLORS[selectedCreature.region] ?? { accent: "#f59e0b", glow: "245, 158, 11" };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-5"
      aria-hidden="true"
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {connected.map((target) => (
        <g key={`${selectedCreature.id}-${target.id}`}>
          {/* Glow line */}
          <line
            x1={`${selectedCreature.mapPosition.x * 100}%`}
            y1={`${selectedCreature.mapPosition.y * 100}%`}
            x2={`${target.mapPosition.x * 100}%`}
            y2={`${target.mapPosition.y * 100}%`}
            stroke={regionColor.accent}
            strokeWidth="4"
            opacity="0.15"
            filter="url(#glow)"
          />
          {/* Main line */}
          <line
            x1={`${selectedCreature.mapPosition.x * 100}%`}
            y1={`${selectedCreature.mapPosition.y * 100}%`}
            x2={`${target.mapPosition.x * 100}%`}
            y2={`${target.mapPosition.y * 100}%`}
            className="compound-line"
            stroke={regionColor.accent}
            strokeWidth="1.5"
            opacity="0.6"
          />
        </g>
      ))}
    </svg>
  );
}

function HopeCreatureNode({ hope }: { hope: (typeof hopeCreatures)[number] }) {
  return (
    <div
      className="absolute flex flex-col items-center z-30 animate-[fade-in-up_0.6s_ease-out_forwards] group"
      style={{
        left: `${hope.mapPosition.x * 100}%`,
        top: `${hope.mapPosition.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Hope aura */}
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full animate-[hope-pulse_3s_ease-in-out_infinite]"
          style={{
            background: "radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)",
            transform: "scale(3)",
          }}
        />
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/80 to-amber-100/40 shadow-[0_0_16px_rgba(234,179,8,0.3)] group-hover:shadow-[0_0_24px_rgba(234,179,8,0.5)] transition-shadow">
          <span className="text-2xl md:text-2xl">
            {hope.icon}
          </span>
        </div>
      </div>
      <span
        className="mt-1 text-xs font-bold text-amber-800 whitespace-nowrap tracking-wide"
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 1px 3px rgba(245,240,225,0.9)",
        }}
      >
        {hope.name.replace("THE ", "")}
      </span>
    </div>
  );
}

export default function MapCanvas({
  onSelectCreature,
  onSelectRegion,
  selectedCreature,
  selectedRegion,
  showHope,
  mapRevealed,
  discoveredSet = new Set(),
  containedSet = new Set(),
}: MapCanvasProps) {
  const connectedIds = selectedCreature?.compoundRisk ?? [];

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at 20% 20%, rgba(26, 17, 71, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 15%, rgba(127, 29, 29, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 15% 70%, rgba(146, 64, 14, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 85% 70%, rgba(107, 114, 128, 0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 40%, rgba(88, 28, 135, 0.05) 0%, transparent 50%),
          linear-gradient(145deg, #f5f0e1, #e8dcc8, #f5f0e1)
        `,
      }}
    >
      {/* Parchment texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Aged vignette effect */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(44,24,16,0.06) 100%)",
        }}
      />

      {/* Region overlays */}
      {regions.map((region) => (
        <RegionOverlay
          key={region.id}
          region={region}
          onSelect={onSelectRegion}
          isSelected={selectedRegion === region.id}
          creatureCount={getCreaturesByRegion(region.id).length}
        />
      ))}

      {/* Compound connection lines */}
      <CompoundLines
        selectedCreature={selectedCreature}
        creatures={allCreatures}
      />

      {/* Creature nodes */}
      {allCreatures.map((creature) => (
        <CreatureNode
          key={creature.id}
          creature={creature}
          onSelect={onSelectCreature}
          isSelected={selectedCreature?.id === creature.id}
          isConnected={connectedIds.includes(creature.id)}
          isDiscovered={discoveredSet.has(creature.id)}
          isContained={containedSet.has(creature.id)}
        />
      ))}

      {/* Hope creatures overlay */}
      {showHope &&
        hopeCreatures.map((hope) => (
          <HopeCreatureNode key={hope.id} hope={hope} />
        ))}

      {/* Fog overlay for unrevealed state */}
      {!mapRevealed && (
        <div className="fog-overlay absolute inset-0 z-40 bg-gradient-to-b from-[#f5f0e1] via-[#e8dcc8ee] to-[#f5f0e1] flex items-center justify-center">
          <div className="text-center max-w-2xl px-8">
            <h1
              className="title-inscription text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] text-ink mb-8"
              style={{ fontFamily: "var(--font-display)", animationDelay: "0.5s" }}
            >
              NATURALIS FUTURA
            </h1>
            <p
              className="text-sm md:text-base text-ink-light leading-relaxed opacity-0 animate-[fade-in-up_1s_ease-out_2s_forwards]"
              style={{ fontFamily: "var(--font-body)" }}
            >
              The territory beyond human-level intelligence is real. It is
              approaching. No one has drawn the map.{" "}
              <em className="text-ink">Until now.</em>
            </p>
          </div>
        </div>
      )}

      {/* Compass rose */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-20 pointer-events-none">
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          aria-hidden="true"
        >
          <circle cx="40" cy="40" r="37" stroke="#2c1810" strokeWidth="0.5" fill="none" />
          <circle cx="40" cy="40" r="32" stroke="#2c1810" strokeWidth="0.3" fill="none" opacity="0.5" />
          {/* Cardinal lines */}
          <line x1="40" y1="4" x2="40" y2="76" stroke="#2c1810" strokeWidth="0.3" />
          <line x1="4" y1="40" x2="76" y2="40" stroke="#2c1810" strokeWidth="0.3" />
          {/* Diagonal lines */}
          <line x1="14" y1="14" x2="66" y2="66" stroke="#2c1810" strokeWidth="0.2" opacity="0.5" />
          <line x1="66" y1="14" x2="14" y2="66" stroke="#2c1810" strokeWidth="0.2" opacity="0.5" />
          {/* North arrow */}
          <polygon points="40,6 37,18 43,18" fill="#2c1810" opacity="0.8" />
          <polygon points="40,6 40,18 43,18" fill="#2c1810" opacity="0.4" />
          {/* South */}
          <polygon points="40,74 37,62 43,62" fill="none" stroke="#2c1810" strokeWidth="0.5" opacity="0.4" />
          {/* Labels */}
          <text x="40" y="16" textAnchor="middle" fontSize="7" fill="#2c1810" fontFamily="serif" fontWeight="bold">N</text>
          <text x="40" y="72" textAnchor="middle" fontSize="5" fill="#2c1810" fontFamily="serif" opacity="0.5">S</text>
          <text x="68" y="42" textAnchor="middle" fontSize="5" fill="#2c1810" fontFamily="serif" opacity="0.5">E</text>
          <text x="12" y="42" textAnchor="middle" fontSize="5" fill="#2c1810" fontFamily="serif" opacity="0.5">W</text>
        </svg>
      </div>
    </div>
  );
}
