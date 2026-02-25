"use client";

import { useEffect, useRef, useCallback } from "react";
import { regions, allCreatures, hopeCreatures, getCreaturesByRegion } from "@/data";
import type { Creature, Region } from "@/data";
import type { Direction } from "@/lib/usePlayerSprite";

interface MapCanvasProps {
  onSelectCreature: (creature: Creature) => void;
  onSelectRegion: (regionId: string) => void;
  onEncounterCreature?: (creature: Creature) => void;
  selectedCreature: Creature | null;
  selectedRegion: string | null;
  showHope: boolean;
  mapRevealed: boolean;
  discoveredSet?: Set<string>;
  containedSet?: Set<string>;
  playerX?: number;
  playerY?: number;
  playerDirection?: Direction;
  playerMoving?: boolean;
  playerStep?: number;
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

const ENCOUNTER_DISTANCE = 0.04; // ~4% of map = walk close to encounter

function PlayerSprite({
  x,
  y,
  direction,
  isMoving,
  step,
}: {
  x: number;
  y: number;
  direction: Direction;
  isMoving: boolean;
  step: number;
}) {
  // Pixel-art style character using CSS
  const directionAngle = {
    down: 0,
    left: -20,
    right: 20,
    up: 0,
  };

  const bodyOffset = isMoving ? (step === 0 ? -1 : 1) : 0;

  return (
    <div
      className="absolute z-30 pointer-events-none transition-[left,top] duration-[30ms] ease-linear"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      {/* Player shadow */}
      <div
        className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 w-6 h-2 rounded-full bg-ink/15 blur-[1px]"
      />

      {/* Sprite body */}
      <div
        className="relative flex flex-col items-center"
        style={{
          transform: `rotate(${directionAngle[direction]}deg) translateY(${bodyOffset}px)`,
          transition: "transform 60ms ease",
        }}
      >
        {/* Hat / Head */}
        <div className="w-5 h-3 rounded-t-full bg-amber-700 border border-amber-900/30 relative">
          {/* Hat brim */}
          <div className="absolute -left-0.5 bottom-0 w-6 h-1 rounded-full bg-amber-800" />
        </div>

        {/* Face */}
        <div className="w-5 h-3 bg-[#f5d0a9] rounded-sm border-x border-amber-900/10 relative">
          {/* Eyes */}
          {direction !== "up" && (
            <div className="absolute top-0.5 left-0 right-0 flex justify-center gap-1.5">
              <div className="w-[3px] h-[3px] rounded-full bg-ink" />
              <div className="w-[3px] h-[3px] rounded-full bg-ink" />
            </div>
          )}
        </div>

        {/* Body / Coat */}
        <div className="w-6 h-4 bg-[#2c5f2d] rounded-sm border-x border-[#1a3f1b]/30 relative flex items-center justify-center">
          {/* Belt/Bag detail */}
          <div className="absolute bottom-0.5 w-4 h-0.5 bg-amber-800/60 rounded-full" />
          {/* Arm positions */}
          {isMoving && (
            <>
              <div
                className="absolute -left-1 top-0 w-1.5 h-3 bg-[#2c5f2d] rounded-full"
                style={{ transform: `rotate(${step === 0 ? 15 : -15}deg)` }}
              />
              <div
                className="absolute -right-1 top-0 w-1.5 h-3 bg-[#2c5f2d] rounded-full"
                style={{ transform: `rotate(${step === 0 ? -15 : 15}deg)` }}
              />
            </>
          )}
        </div>

        {/* Legs */}
        <div className="flex gap-0.5">
          <div
            className="w-2 h-2 bg-amber-900 rounded-b-sm"
            style={{
              transform: isMoving ? `translateY(${step === 0 ? -1 : 0}px)` : "none",
            }}
          />
          <div
            className="w-2 h-2 bg-amber-900 rounded-b-sm"
            style={{
              transform: isMoving ? `translateY(${step === 0 ? 0 : -1}px)` : "none",
            }}
          />
        </div>
      </div>

      {/* Direction indicator / interaction radius hint */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full border border-dashed border-amber-600/20 pointer-events-none"
      />
    </div>
  );
}

function CreatureNode({
  creature,
  onSelect,
  isSelected,
  isConnected,
  isDiscovered,
  isContained,
  isNearPlayer,
}: {
  creature: Creature;
  onSelect: (c: Creature) => void;
  isSelected: boolean;
  isConnected: boolean;
  isDiscovered: boolean;
  isContained: boolean;
  isNearPlayer: boolean;
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
      aria-label={isDiscovered ? `${creature.name} — ${creature.currentStatus.status}` : "Unknown creature"}
    >
      <div
        className={`relative flex items-center justify-center transition-all duration-300 ${isSelected ? "scale-125" : "group-hover:scale-110"}`}
      >
        {/* Proximity glow when player is near */}
        {isNearPlayer && !isDiscovered && (
          <div
            className="absolute inset-0 rounded-full animate-[threat-pulse_1s_ease-in-out_infinite]"
            style={{
              background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.4) 0%, transparent 70%)`,
              transform: "scale(3)",
            }}
          />
        )}

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

        {/* Sprite container */}
        <div
          className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            !isDiscovered
              ? isNearPlayer ? "border-2 border-dashed animate-[breathe_1.5s_ease-in-out_infinite]" : "bg-ink/5 border border-ink/10"
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
          } : isNearPlayer ? {
            borderColor: regionColor.accent + "60",
            background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.08), transparent)`,
          } : undefined}
        >
          {/* Threat pips */}
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

          {/* Icon */}
          <span className={`text-2xl md:text-2xl ${!isDiscovered ? isNearPlayer ? "opacity-60 grayscale-[50%]" : "grayscale opacity-30" : ""}`}>
            {isDiscovered ? creature.icon : isNearPlayer ? creature.icon : "?"}
          </span>

          {/* Contained badge */}
          {isContained && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white">
                <path d="M2 5L4.5 7.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          )}

          {/* Confirmed pulse ring */}
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

      {/* Name */}
      <span
        className={`mt-1 text-xs font-bold whitespace-nowrap tracking-wide leading-tight max-w-20 truncate ${
          isDiscovered ? "text-ink" : isNearPlayer ? "text-ink/50" : "text-ink/20"
        } ${isSelected ? "text-sm" : ""}`}
        style={{
          fontFamily: "var(--font-display)",
          textShadow: "0 1px 3px rgba(245,240,225,0.9), 0 0px 1px rgba(245,240,225,1)",
        }}
      >
        {isDiscovered ? creature.name.replace("THE ", "") : isNearPlayer ? "???" : ""}
      </span>

      {/* Status dot */}
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
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${region.color.accent}, transparent 70%)`,
        }}
      />
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
        <p className="text-xs text-ink-light opacity-60 mt-0.5">{region.subtitle}</p>
      </div>
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
    <svg className="absolute inset-0 w-full h-full pointer-events-none z-5" aria-hidden="true">
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

export default function MapCanvas({
  onSelectCreature,
  onSelectRegion,
  onEncounterCreature,
  selectedCreature,
  selectedRegion,
  showHope,
  mapRevealed,
  discoveredSet = new Set(),
  containedSet = new Set(),
  playerX = 0.5,
  playerY = 0.5,
  playerDirection = "down",
  playerMoving = false,
  playerStep = 0,
}: MapCanvasProps) {
  const connectedIds = selectedCreature?.compoundRisk ?? [];

  // Track which creatures the player is near
  const lastEncountered = useRef<string | null>(null);

  // Proximity-based encounters
  useEffect(() => {
    if (!mapRevealed || !onEncounterCreature) return;

    for (const creature of allCreatures) {
      if (discoveredSet.has(creature.id)) continue;
      const dx = playerX - creature.mapPosition.x;
      const dy = playerY - creature.mapPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < ENCOUNTER_DISTANCE && creature.id !== lastEncountered.current) {
        lastEncountered.current = creature.id;
        onEncounterCreature(creature);
        return; // One encounter at a time
      }
    }
  }, [playerX, playerY, mapRevealed, discoveredSet, onEncounterCreature]);

  // Check proximity for visual hints
  const getNearCreatures = useCallback((): Set<string> => {
    const near = new Set<string>();
    const hintDistance = ENCOUNTER_DISTANCE * 2.5; // Show hints at 2.5x encounter distance
    for (const c of allCreatures) {
      if (discoveredSet.has(c.id)) continue;
      const dx = playerX - c.mapPosition.x;
      const dy = playerY - c.mapPosition.y;
      if (Math.sqrt(dx * dx + dy * dy) < hintDistance) {
        near.add(c.id);
      }
    }
    return near;
  }, [playerX, playerY, discoveredSet]);

  const nearCreatures = getNearCreatures();

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
      {/* Parchment texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at 50% 50%, transparent 60%, rgba(44,24,16,0.06) 100%)",
        }}
      />

      {/* Regions */}
      {regions.map((region) => (
        <RegionOverlay
          key={region.id}
          region={region}
          onSelect={onSelectRegion}
          isSelected={selectedRegion === region.id}
          creatureCount={getCreaturesByRegion(region.id).length}
        />
      ))}

      {/* Compound lines */}
      <CompoundLines selectedCreature={selectedCreature} creatures={allCreatures} />

      {/* Creatures */}
      {allCreatures.map((creature) => (
        <CreatureNode
          key={creature.id}
          creature={creature}
          onSelect={onSelectCreature}
          isSelected={selectedCreature?.id === creature.id}
          isConnected={connectedIds.includes(creature.id)}
          isDiscovered={discoveredSet.has(creature.id)}
          isContained={containedSet.has(creature.id)}
          isNearPlayer={nearCreatures.has(creature.id)}
        />
      ))}

      {/* Hope creatures */}
      {showHope &&
        hopeCreatures.map((hope) => (
          <div
            key={hope.id}
            className="absolute flex flex-col items-center z-30 animate-[fade-in-up_0.6s_ease-out_forwards] group"
            style={{
              left: `${hope.mapPosition.x * 100}%`,
              top: `${hope.mapPosition.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              <div
                className="absolute inset-0 rounded-full animate-[hope-pulse_3s_ease-in-out_infinite]"
                style={{
                  background: "radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)",
                  transform: "scale(3)",
                }}
              />
              <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/80 to-amber-100/40 shadow-[0_0_16px_rgba(234,179,8,0.3)]">
                <span className="text-2xl md:text-2xl">{hope.icon}</span>
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
        ))}

      {/* Player sprite */}
      {mapRevealed && (
        <PlayerSprite
          x={playerX}
          y={playerY}
          direction={playerDirection}
          isMoving={playerMoving}
          step={playerStep}
        />
      )}

      {/* Fog overlay */}
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

      {/* Movement hint */}
      {mapRevealed && (
        <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 flex items-center gap-2 opacity-30 pointer-events-none">
          <div className="flex flex-col items-center gap-0.5 text-xs font-mono text-ink">
            <kbd className="px-1.5 py-0.5 rounded bg-ink/10 text-ink/60 text-[10px]">W</kbd>
            <div className="flex gap-0.5">
              <kbd className="px-1.5 py-0.5 rounded bg-ink/10 text-ink/60 text-[10px]">A</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-ink/10 text-ink/60 text-[10px]">S</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-ink/10 text-ink/60 text-[10px]">D</kbd>
            </div>
          </div>
          <span className="text-xs text-ink/40">move</span>
        </div>
      )}

      {/* Compass rose */}
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-20 pointer-events-none">
        <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
          <circle cx="30" cy="30" r="27" stroke="#2c1810" strokeWidth="0.5" fill="none" />
          <line x1="30" y1="4" x2="30" y2="56" stroke="#2c1810" strokeWidth="0.3" />
          <line x1="4" y1="30" x2="56" y2="30" stroke="#2c1810" strokeWidth="0.3" />
          <polygon points="30,6 27,16 33,16" fill="#2c1810" opacity="0.8" />
          <text x="30" y="14" textAnchor="middle" fontSize="6" fill="#2c1810" fontFamily="serif">N</text>
        </svg>
      </div>
    </div>
  );
}
