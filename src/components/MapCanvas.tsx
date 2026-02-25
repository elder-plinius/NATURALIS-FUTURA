"use client";

import { useEffect, useRef, useCallback, useMemo } from "react";
import { regions, allCreatures, hopeCreatures, getCreaturesByRegion } from "@/data";
import type { Creature, Region } from "@/data";
import type { Direction } from "@/lib/usePlayerSprite";

// ── World configuration ──
// The world is WORLD_SCALE times larger than the viewport.
// This creates a scrollable area the player explores.
const WORLD_SCALE = 2.8;
const ENCOUNTER_DISTANCE = 0.035;
const HINT_DISTANCE = ENCOUNTER_DISTANCE * 3;

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

// ── Player Sprite ──
function PlayerSprite({ direction, isMoving, step }: { direction: Direction; isMoving: boolean; step: number }) {
  const bobY = isMoving ? [0, -2, 0, -2][step] : 0;
  const leftLeg = isMoving ? [-3, 0, 3, 0][step] : 0;
  const rightLeg = isMoving ? [3, 0, -3, 0][step] : 0;
  const leftArm = isMoving ? [12, 0, -12, 0][step] : 0;
  const rightArm = isMoving ? [-12, 0, 12, 0][step] : 0;
  const facingLeft = direction === "left";
  const facingUp = direction === "up";

  return (
    <div
      className="flex flex-col items-center"
      style={{
        transform: `translateY(${bobY}px) scaleX(${facingLeft ? -1 : 1})`,
        transition: "transform 50ms linear",
      }}
    >
      {/* Shadow */}
      <div className="absolute bottom-[-2px] w-8 h-2 rounded-full bg-black/15 blur-[2px]" />

      <svg width="28" height="36" viewBox="0 0 28 36" className="drop-shadow-md">
        {/* Hat */}
        <ellipse cx="14" cy="6" rx="10" ry="5" fill="#8B4513" />
        <ellipse cx="14" cy="5" rx="7" ry="4" fill="#A0522D" />
        <rect x="7" y="4" width="14" height="2" rx="1" fill="#8B4513" />

        {/* Head */}
        <rect x="8" y="8" width="12" height="10" rx="3" fill="#F5D0A9" />
        {!facingUp && (
          <>
            <circle cx="11" cy="13" r="1.2" fill="#2c1810" />
            <circle cx="17" cy="13" r="1.2" fill="#2c1810" />
            <ellipse cx="14" cy="16" rx="1.5" ry="0.5" fill="#C98B6A" />
          </>
        )}

        {/* Body / Explorer coat */}
        <rect x="6" y="18" width="16" height="10" rx="2" fill="#2E6B30" />
        <line x1="14" y1="18" x2="14" y2="28" stroke="#1B4D1D" strokeWidth="0.5" />
        {/* Belt */}
        <rect x="7" y="24" width="14" height="2" rx="1" fill="#8B4513" />
        <rect x="12.5" y="23.5" width="3" height="3" rx="1" fill="#CD853F" />

        {/* Left arm */}
        <rect
          x="3" y="19" width="4" height="8" rx="2" fill="#2E6B30"
          transform={`rotate(${leftArm}, 5, 19)`}
        />
        {/* Right arm */}
        <rect
          x="21" y="19" width="4" height="8" rx="2" fill="#2E6B30"
          transform={`rotate(${rightArm}, 23, 19)`}
        />

        {/* Left leg */}
        <rect
          x="8" y="27" width="4" height="7" rx="2" fill="#5C3317"
          transform={`translate(${leftLeg}, 0)`}
        />
        {/* Right leg */}
        <rect
          x="16" y="27" width="4" height="7" rx="2" fill="#5C3317"
          transform={`translate(${rightLeg}, 0)`}
        />

        {/* Boots */}
        <ellipse cx={10 + leftLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
        <ellipse cx={18 + rightLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
      </svg>
    </div>
  );
}

// ── Creature Node ──
function CreatureNode({
  creature, onSelect, isSelected, isConnected, isDiscovered, isContained, isNearPlayer,
}: {
  creature: Creature; onSelect: (c: Creature) => void; isSelected: boolean;
  isConnected: boolean; isDiscovered: boolean; isContained: boolean; isNearPlayer: boolean;
}) {
  const regionColor = REGION_COLORS[creature.region] ?? { accent: "#7c3aed", glow: "124, 58, 237" };
  const composite = creature.threatGradient.likelihood + creature.threatGradient.impact + creature.threatGradient.detectability;

  const statusClass = isDiscovered
    ? creature.currentStatus.status === "confirmed" ? "status-alert" : creature.currentStatus.status === "emerging" ? "status-breathing" : ""
    : "";

  return (
    <button
      onClick={() => onSelect(creature)}
      className={`absolute flex flex-col items-center cursor-pointer ${statusClass} ${isSelected ? "z-20" : "z-10"} group`}
      style={{
        left: `${creature.mapPosition.x * 100}%`,
        top: `${creature.mapPosition.y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      title={isDiscovered ? creature.name : "???"}
    >
      <div className={`relative flex items-center justify-center transition-all duration-200 ${isSelected ? "scale-[1.3]" : "group-hover:scale-110"}`}>
        {/* Proximity pulse */}
        {isNearPlayer && !isDiscovered && (
          <div
            className="absolute rounded-full animate-[threat-pulse_1.2s_ease-in-out_infinite]"
            style={{
              width: "200%", height: "200%",
              background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.35) 0%, transparent 70%)`,
            }}
          />
        )}

        {/* Sprite circle */}
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            !isDiscovered
              ? isNearPlayer ? "border-2 border-dashed" : "border border-ink/10 bg-ink/5"
              : "border-2"
          } ${isConnected ? "ring-2 ring-amber-400 ring-offset-1" : ""}`}
          style={isDiscovered ? {
            borderColor: isContained ? "#16a34a" : regionColor.accent + "80",
            background: isContained
              ? "radial-gradient(circle, rgba(22,163,74,0.12), rgba(22,163,74,0.04))"
              : `radial-gradient(circle, rgba(${regionColor.glow}, 0.15), rgba(${regionColor.glow}, 0.04))`,
            boxShadow: isSelected ? `0 0 16px rgba(${regionColor.glow}, 0.5)` : `0 2px 6px rgba(0,0,0,0.1)`,
          } : isNearPlayer ? {
            borderColor: regionColor.accent + "50",
            background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.1), transparent)`,
          } : undefined}
        >
          {/* Threat pips */}
          {isDiscovered && !isContained && (
            <div className="absolute -top-0.5 -right-0.5 flex gap-px">
              {[...Array(Math.min(5, Math.ceil(composite / 3)))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: composite >= 12 ? "#ef4444" : composite >= 8 ? "#f59e0b" : "#9ca3af",
                }} />
              ))}
            </div>
          )}

          <span className={`text-xl md:text-2xl ${!isDiscovered ? isNearPlayer ? "opacity-50 grayscale-[50%]" : "opacity-20 grayscale" : ""}`}>
            {isDiscovered ? creature.icon : isNearPlayer ? creature.icon : "?"}
          </span>

          {isContained && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>
      </div>

      {/* Name */}
      <span
        className={`mt-0.5 text-[10px] font-bold whitespace-nowrap tracking-wide ${
          isDiscovered ? "text-ink" : isNearPlayer ? "text-ink/40" : "text-ink/15"
        }`}
        style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 3px rgba(245,240,225,0.9)" }}
      >
        {isDiscovered ? creature.name.replace("THE ", "") : isNearPlayer ? "???" : ""}
      </span>
    </button>
  );
}

// ── Region Overlay ──
function RegionOverlay({ region, onSelect, isSelected, creatureCount }: {
  region: Region; onSelect: (id: string) => void; isSelected: boolean; creatureCount: number;
}) {
  return (
    <button
      onClick={() => onSelect(region.id)}
      className={`absolute rounded-2xl transition-all duration-300 overflow-hidden ${isSelected ? "shadow-lg" : ""}`}
      style={{
        left: `${region.mapPosition.x * 100}%`, top: `${region.mapPosition.y * 100}%`,
        width: `${region.mapPosition.width * 100}%`, height: `${region.mapPosition.height * 100}%`,
        border: isSelected ? `2px solid ${region.color.accent}90` : `1px dashed ${region.color.accent}35`,
        backgroundColor: region.color.primary + "06",
      }}
      aria-label={`${region.name} — ${creatureCount} creatures`}
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${region.color.accent}, transparent 70%)` }} />
      <div className="absolute top-2 left-3 md:top-3 md:left-4">
        <h3 className="text-xs md:text-sm font-bold tracking-[0.2em]"
          style={{ fontFamily: "var(--font-display)", color: region.color.accent }}>
          {region.name}
        </h3>
        <p className="text-[10px] text-ink-light opacity-50 mt-0.5">{region.subtitle}</p>
      </div>
    </button>
  );
}

// ── Compound Lines ──
function CompoundLines({ selectedCreature, creatures }: { selectedCreature: Creature | null; creatures: Creature[] }) {
  if (!selectedCreature) return null;
  const connected = creatures.filter((c) => selectedCreature.compoundRisk.includes(c.id));
  const rc = REGION_COLORS[selectedCreature.region] ?? { accent: "#f59e0b" };

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      {connected.map((t) => (
        <line key={`${selectedCreature.id}-${t.id}`}
          x1={`${selectedCreature.mapPosition.x * 100}%`} y1={`${selectedCreature.mapPosition.y * 100}%`}
          x2={`${t.mapPosition.x * 100}%`} y2={`${t.mapPosition.y * 100}%`}
          className="compound-line" stroke={rc.accent} strokeWidth="1.5" opacity="0.5" />
      ))}
    </svg>
  );
}

// ── Main Map Canvas ──
export default function MapCanvas({
  onSelectCreature, onSelectRegion, onEncounterCreature,
  selectedCreature, selectedRegion, showHope, mapRevealed,
  discoveredSet = new Set(), containedSet = new Set(),
  playerX = 0.5, playerY = 0.5,
  playerDirection = "down", playerMoving = false, playerStep = 0,
}: MapCanvasProps) {
  const connectedIds = selectedCreature?.compoundRisk ?? [];
  const lastEncountered = useRef<string | null>(null);

  // ── Camera system ──
  // Camera centers on player. We compute a CSS transform to pan the world.
  // The world is WORLD_SCALE * viewport size. Camera offset = player position in that space.
  const cameraStyle = useMemo(() => {
    // Player position in world-space pixels (as % of the world)
    // We want the player at the center of the viewport.
    // World is WORLD_SCALE * 100% wide. Player is at playerX * WORLD_SCALE * 100%.
    // To center player: translate = 50% - playerX * WORLD_SCALE * 100%
    const tx = 50 - playerX * WORLD_SCALE * 100;
    const ty = 50 - playerY * WORLD_SCALE * 100;

    // Clamp so we don't scroll past world edges
    // Min translate: 50 - WORLD_SCALE * 100 (player at right edge)
    // Max translate: 50 - 0 = 50 (player at left edge)
    const minTx = -(WORLD_SCALE * 100 - 100);
    const maxTx = 0;
    const minTy = -(WORLD_SCALE * 100 - 100);
    const maxTy = 0;

    const clampedTx = Math.max(minTx, Math.min(maxTx, tx));
    const clampedTy = Math.max(minTy, Math.min(maxTy, ty));

    return {
      transform: `translate(${clampedTx}%, ${clampedTy}%)`,
      width: `${WORLD_SCALE * 100}%`,
      height: `${WORLD_SCALE * 100}%`,
      transition: playerMoving ? "transform 50ms linear" : "transform 200ms ease-out",
    };
  }, [playerX, playerY, playerMoving]);

  // ── Proximity encounters ──
  useEffect(() => {
    if (!mapRevealed || !onEncounterCreature) return;
    for (const creature of allCreatures) {
      if (discoveredSet.has(creature.id)) continue;
      const dx = playerX - creature.mapPosition.x;
      const dy = playerY - creature.mapPosition.y;
      if (Math.sqrt(dx * dx + dy * dy) < ENCOUNTER_DISTANCE && creature.id !== lastEncountered.current) {
        lastEncountered.current = creature.id;
        onEncounterCreature(creature);
        return;
      }
    }
  }, [playerX, playerY, mapRevealed, discoveredSet, onEncounterCreature]);

  // ── Near-player set for visual hints ──
  const nearCreatures = useMemo(() => {
    const near = new Set<string>();
    for (const c of allCreatures) {
      if (discoveredSet.has(c.id)) continue;
      const dx = playerX - c.mapPosition.x;
      const dy = playerY - c.mapPosition.y;
      if (Math.sqrt(dx * dx + dy * dy) < HINT_DISTANCE) near.add(c.id);
    }
    return near;
  }, [playerX, playerY, discoveredSet]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#e8dcc8]">
      {/* ── WORLD CONTAINER — larger than viewport, camera-translated ── */}
      <div className="absolute top-0 left-0" style={cameraStyle}>
        {/* World background */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse at 15% 15%, rgba(26, 17, 71, 0.07) 0%, transparent 40%),
              radial-gradient(ellipse at 85% 10%, rgba(127, 29, 29, 0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 10% 55%, rgba(146, 64, 14, 0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 90% 60%, rgba(107, 114, 128, 0.05) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 35%, rgba(88, 28, 135, 0.04) 0%, transparent 40%),
              radial-gradient(ellipse at 50% 80%, rgba(6, 95, 70, 0.04) 0%, transparent 40%),
              linear-gradient(145deg, #f5f0e1, #e8dcc8, #f0e8d5, #e8dcc8, #f5f0e1)
            `,
          }}
        />

        {/* Parchment texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M20 20h-2v2h2v2h2v-2h2v-2h-2v-2h-2v2zM0 20h-2v2h2v2h2v-2h2v-2H2v-2H0v2z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Grid lines for old-school feel */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(44,24,16,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(44,24,16,1) 1px, transparent 1px)
            `,
            backgroundSize: "5% 5%",
          }}
        />

        {/* Regions */}
        {regions.map((region) => (
          <RegionOverlay key={region.id} region={region} onSelect={onSelectRegion}
            isSelected={selectedRegion === region.id}
            creatureCount={getCreaturesByRegion(region.id).length} />
        ))}

        {/* Compound lines */}
        <CompoundLines selectedCreature={selectedCreature} creatures={allCreatures} />

        {/* Creatures */}
        {allCreatures.map((creature) => (
          <CreatureNode key={creature.id} creature={creature}
            onSelect={onSelectCreature}
            isSelected={selectedCreature?.id === creature.id}
            isConnected={connectedIds.includes(creature.id)}
            isDiscovered={discoveredSet.has(creature.id)}
            isContained={containedSet.has(creature.id)}
            isNearPlayer={nearCreatures.has(creature.id)} />
        ))}

        {/* Hope creatures */}
        {showHope && hopeCreatures.map((hope) => (
          <div key={hope.id}
            className="absolute flex flex-col items-center z-15 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{
              left: `${hope.mapPosition.x * 100}%`, top: `${hope.mapPosition.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-[hope-pulse_3s_ease-in-out_infinite]"
                style={{ background: "radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)", transform: "scale(3)" }} />
              <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/80 to-amber-100/40 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                <span className="text-xl">{hope.icon}</span>
              </div>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-amber-800 whitespace-nowrap tracking-wide"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 3px rgba(245,240,225,0.9)" }}>
              {hope.name.replace("THE ", "")}
            </span>
          </div>
        ))}

        {/* ── Player sprite (positioned in world space) ── */}
        {mapRevealed && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${playerX * 100}%`,
              top: `${playerY * 100}%`,
              transform: "translate(-50%, -50%)",
              transition: playerMoving ? "left 50ms linear, top 50ms linear" : "left 200ms ease-out, top 200ms ease-out",
            }}
          >
            <PlayerSprite direction={playerDirection} isMoving={playerMoving} step={playerStep} />
          </div>
        )}
      </div>

      {/* ── HUD overlays (not inside the world, fixed to viewport) ── */}

      {/* Fog overlay */}
      {!mapRevealed && (
        <div className="absolute inset-0 z-40 bg-gradient-to-b from-[#f5f0e1] via-[#e8dcc8ee] to-[#f5f0e1] flex items-center justify-center">
          <div className="text-center max-w-2xl px-8">
            <h1 className="title-inscription text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] text-ink mb-8"
              style={{ fontFamily: "var(--font-display)", animationDelay: "0.5s" }}>
              NATURALIS FUTURA
            </h1>
            <p className="text-sm md:text-base text-ink-light leading-relaxed opacity-0 animate-[fade-in-up_1s_ease-out_2s_forwards]"
              style={{ fontFamily: "var(--font-body)" }}>
              The territory beyond human-level intelligence is real. It is
              approaching. No one has drawn the map.{" "}
              <em className="text-ink">Until now.</em>
            </p>
          </div>
        </div>
      )}

      {/* Movement controls hint */}
      {mapRevealed && (
        <div className="absolute bottom-3 left-3 z-20 flex items-center gap-2 pointer-events-none select-none">
          <div className="flex flex-col items-center gap-0.5">
            <kbd className="w-6 h-5 flex items-center justify-center rounded bg-ink/8 text-ink/40 text-[9px] font-mono font-bold border border-ink/10">W</kbd>
            <div className="flex gap-0.5">
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-ink/8 text-ink/40 text-[9px] font-mono font-bold border border-ink/10">A</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-ink/8 text-ink/40 text-[9px] font-mono font-bold border border-ink/10">S</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-ink/8 text-ink/40 text-[9px] font-mono font-bold border border-ink/10">D</kbd>
            </div>
          </div>
          <span className="text-[10px] text-ink/30 font-mono">MOVE</span>
        </div>
      )}

      {/* Minimap */}
      {mapRevealed && (
        <div className="absolute top-3 right-3 z-20 w-24 h-20 rounded-lg border border-ink/15 bg-parchment/80 backdrop-blur-sm overflow-hidden pointer-events-none shadow-sm">
          {/* Player dot on minimap */}
          <div className="absolute w-2 h-2 rounded-full bg-amber-600 shadow-sm"
            style={{
              left: `${playerX * 100}%`, top: `${playerY * 100}%`,
              transform: "translate(-50%, -50%)",
            }} />
          {/* Region outlines on minimap */}
          {regions.map((r) => (
            <div key={r.id} className="absolute rounded-sm border"
              style={{
                left: `${r.mapPosition.x * 100}%`, top: `${r.mapPosition.y * 100}%`,
                width: `${r.mapPosition.width * 100}%`, height: `${r.mapPosition.height * 100}%`,
                borderColor: r.color.accent + "40",
                backgroundColor: r.color.accent + "08",
              }} />
          ))}
          {/* Discovered creatures as dots */}
          {allCreatures.filter((c) => discoveredSet.has(c.id)).map((c) => (
            <div key={c.id} className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${c.mapPosition.x * 100}%`, top: `${c.mapPosition.y * 100}%`,
                backgroundColor: REGION_COLORS[c.region]?.accent ?? "#666",
                transform: "translate(-50%, -50%)",
              }} />
          ))}
        </div>
      )}

      {/* Compass */}
      <div className="absolute bottom-3 right-3 z-20 opacity-20 pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" stroke="#2c1810" strokeWidth="0.5" fill="none" />
          <polygon points="20,4 18,12 22,12" fill="#2c1810" opacity="0.8" />
          <text x="20" y="11" textAnchor="middle" fontSize="5" fill="#2c1810" fontFamily="serif">N</text>
        </svg>
      </div>
    </div>
  );
}
