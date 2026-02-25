"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { regions, allCreatures, hopeCreatures, getCreaturesByRegion } from "@/data";
import type { Creature, Region } from "@/data";
import type { Direction } from "@/lib/usePlayerSprite";

// ── World configuration ──
const WORLD_SCALE = 3;
const ENCOUNTER_DISTANCE = 0.035;
const HINT_DISTANCE = ENCOUNTER_DISTANCE * 3;
const TORCH_RADIUS = 0.14; // creatures within this range are dimly visible even if undiscovered

// ── Obstacle types ──
export type ObstacleType = "wall" | "hedge" | "ruin" | "water" | "rock";

export interface Obstacle {
  x: number; y: number; w: number; h: number;
  type: ObstacleType;
}

// ── OBSTACLE DATA ──
export const WORLD_OBSTACLES: Obstacle[] = [
  // ═══ HORIZONTAL WALLS — region borders ═══

  // Between Abyss/Siren-Sea and Throne Room (y ≈ 0.285)
  { x: 0.03, y: 0.282, w: 0.16, h: 0.012, type: "wall" },
  { x: 0.24, y: 0.282, w: 0.24, h: 0.012, type: "wall" },
  { x: 0.52, y: 0.282, w: 0.21, h: 0.012, type: "wall" },
  { x: 0.78, y: 0.282, w: 0.19, h: 0.012, type: "wall" },

  // Between Throne Room and Hive/Mirror (y ≈ 0.478)
  { x: 0.20, y: 0.475, w: 0.14, h: 0.012, type: "wall" },
  { x: 0.39, y: 0.475, w: 0.10, h: 0.012, type: "wall" },
  { x: 0.54, y: 0.475, w: 0.26, h: 0.012, type: "wall" },

  // Between Hive/Mirror and Spawning/Colosseum (y ≈ 0.72)
  { x: 0.03, y: 0.718, w: 0.18, h: 0.012, type: "wall" },
  { x: 0.26, y: 0.718, w: 0.22, h: 0.012, type: "wall" },
  { x: 0.53, y: 0.718, w: 0.20, h: 0.012, type: "wall" },
  { x: 0.78, y: 0.718, w: 0.19, h: 0.012, type: "wall" },

  // Between Spawning/Colosseum and Catacombs (y ≈ 0.935)
  { x: 0.03, y: 0.932, w: 0.22, h: 0.010, type: "wall" },
  { x: 0.30, y: 0.932, w: 0.28, h: 0.010, type: "wall" },
  { x: 0.63, y: 0.932, w: 0.34, h: 0.010, type: "wall" },

  // ═══ VERTICAL WALLS ═══

  // Between Abyss and Siren-Sea
  { x: 0.483, y: 0.02, w: 0.012, h: 0.10, type: "wall" },
  { x: 0.483, y: 0.17, w: 0.012, h: 0.112, type: "wall" },

  // Between Hive and Mirror-Dark
  { x: 0.483, y: 0.49, w: 0.012, h: 0.08, type: "wall" },
  { x: 0.483, y: 0.62, w: 0.012, h: 0.098, type: "wall" },

  // Between Spawning and Colosseum
  { x: 0.483, y: 0.73, w: 0.012, h: 0.08, type: "wall" },
  { x: 0.483, y: 0.86, w: 0.012, h: 0.072, type: "wall" },

  // ═══ HEDGES ═══
  { x: 0.07, y: 0.12, w: 0.07, h: 0.010, type: "hedge" },
  { x: 0.22, y: 0.07, w: 0.010, h: 0.06, type: "hedge" },
  { x: 0.34, y: 0.19, w: 0.06, h: 0.010, type: "hedge" },
  { x: 0.60, y: 0.13, w: 0.09, h: 0.010, type: "hedge" },
  { x: 0.78, y: 0.06, w: 0.010, h: 0.07, type: "hedge" },
  { x: 0.85, y: 0.19, w: 0.07, h: 0.010, type: "hedge" },
  { x: 0.08, y: 0.55, w: 0.08, h: 0.010, type: "hedge" },
  { x: 0.28, y: 0.59, w: 0.010, h: 0.06, type: "hedge" },
  { x: 0.15, y: 0.68, w: 0.07, h: 0.010, type: "hedge" },
  { x: 0.62, y: 0.63, w: 0.08, h: 0.010, type: "hedge" },
  { x: 0.82, y: 0.54, w: 0.010, h: 0.07, type: "hedge" },
  { x: 0.70, y: 0.70, w: 0.06, h: 0.010, type: "hedge" },
  { x: 0.08, y: 0.84, w: 0.06, h: 0.010, type: "hedge" },
  { x: 0.32, y: 0.80, w: 0.010, h: 0.05, type: "hedge" },
  { x: 0.68, y: 0.85, w: 0.08, h: 0.010, type: "hedge" },
  { x: 0.88, y: 0.80, w: 0.010, h: 0.06, type: "hedge" },

  // ═══ RUINS ═══
  { x: 0.48, y: 0.34, w: 0.025, h: 0.035, type: "ruin" },
  { x: 0.26, y: 0.40, w: 0.020, h: 0.025, type: "ruin" },
  { x: 0.72, y: 0.38, w: 0.020, h: 0.025, type: "ruin" },
  { x: 0.18, y: 0.62, w: 0.025, h: 0.025, type: "ruin" },
  { x: 0.75, y: 0.60, w: 0.015, h: 0.035, type: "ruin" },
  { x: 0.78, y: 0.90, w: 0.06, h: 0.015, type: "ruin" },

  // ═══ WATER ═══
  { x: 0.68, y: 0.17, w: 0.04, h: 0.03, type: "water" },
  { x: 0.22, y: 0.85, w: 0.05, h: 0.03, type: "water" },

  // ═══ ROCKS ═══
  { x: 0.12, y: 0.17, w: 0.020, h: 0.020, type: "rock" },
  { x: 0.38, y: 0.10, w: 0.018, h: 0.018, type: "rock" },
  { x: 0.62, y: 0.88, w: 0.020, h: 0.018, type: "rock" },
  { x: 0.92, y: 0.85, w: 0.018, h: 0.020, type: "rock" },
  { x: 0.42, y: 0.95, w: 0.015, h: 0.015, type: "rock" },
  { x: 0.56, y: 0.96, w: 0.015, h: 0.015, type: "rock" },
];

const PLAYER_RADIUS = 0.006;

export function isBlockedAt(px: number, py: number): boolean {
  for (const obs of WORLD_OBSTACLES) {
    if (
      px + PLAYER_RADIUS > obs.x &&
      px - PLAYER_RADIUS < obs.x + obs.w &&
      py + PLAYER_RADIUS > obs.y &&
      py - PLAYER_RADIUS < obs.y + obs.h
    ) return true;
  }
  return false;
}

// ── Props ──
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

// ── Obstacle visual styles ──
const OBS_STYLES: Record<ObstacleType, { bg: string; border: string; radius: string }> = {
  wall: { bg: "linear-gradient(135deg, #4a3f35, #3a3028, #4a3f35)", border: "1px solid #2a2218", radius: "1px" },
  hedge: { bg: "linear-gradient(135deg, #1a3a1a, #2a4a2a, #1a3a1a)", border: "1px solid #0a2a0a", radius: "3px" },
  ruin: { bg: "linear-gradient(145deg, #3a3530, #4a4540, #3a3530)", border: "1px dashed #2a2520", radius: "2px" },
  water: { bg: "linear-gradient(135deg, #1a3a5a, #2a4a6a, #1a3a5a)", border: "1px solid #0a2a4a", radius: "6px" },
  rock: { bg: "radial-gradient(ellipse, #3a3a3a, #2a2a2a)", border: "1px solid #1a1a1a", radius: "50%" },
};

// ── Player Sprite (explorer character) ──
function PlayerSprite({ direction, isMoving, step }: { direction: Direction; isMoving: boolean; step: number }) {
  const bobY = isMoving ? [0, -2, 0, -2][step] : 0;
  const leftLeg = isMoving ? [-3, 0, 3, 0][step] : 0;
  const rightLeg = isMoving ? [3, 0, -3, 0][step] : 0;
  const leftArm = isMoving ? [12, 0, -12, 0][step] : 0;
  const rightArm = isMoving ? [-12, 0, 12, 0][step] : 0;
  const facingLeft = direction === "left";
  const facingUp = direction === "up";

  return (
    <div style={{
      transform: `translateY(${bobY}px) scaleX(${facingLeft ? -1 : 1})`,
      transition: "transform 50ms linear",
    }}>
      <svg width="48" height="62" viewBox="0 0 28 36" className="drop-shadow-[0_2px_8px_rgba(255,200,100,0.6)]">
        {/* Torch glow around sprite */}
        <circle cx="14" cy="18" r="20" fill="url(#torchGlow)" opacity="0.3" />
        <defs>
          <radialGradient id="torchGlow">
            <stop offset="0%" stopColor="#ffcc66" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffcc66" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hat */}
        <ellipse cx="14" cy="6" rx="10" ry="5" fill="#8B4513" />
        <ellipse cx="14" cy="5" rx="7" ry="4" fill="#A0522D" />
        <rect x="7" y="4" width="14" height="2" rx="1" fill="#8B4513" />

        {/* Head */}
        <rect x="8" y="8" width="12" height="10" rx="3" fill="#F5D0A9" />
        {!facingUp && <>
          <circle cx="11" cy="13" r="1.2" fill="#2c1810" />
          <circle cx="17" cy="13" r="1.2" fill="#2c1810" />
          <ellipse cx="14" cy="16" rx="1.5" ry="0.5" fill="#C98B6A" />
        </>}

        {/* Explorer coat */}
        <rect x="6" y="18" width="16" height="10" rx="2" fill="#2E6B30" />
        <line x1="14" y1="18" x2="14" y2="28" stroke="#1B4D1D" strokeWidth="0.5" />
        <rect x="7" y="24" width="14" height="2" rx="1" fill="#8B4513" />
        <rect x="12.5" y="23.5" width="3" height="3" rx="1" fill="#CD853F" />

        {/* Arms */}
        <rect x="3" y="19" width="4" height="8" rx="2" fill="#2E6B30" transform={`rotate(${leftArm}, 5, 19)`} />
        <rect x="21" y="19" width="4" height="8" rx="2" fill="#2E6B30" transform={`rotate(${rightArm}, 23, 19)`} />

        {/* Legs */}
        <rect x="8" y="27" width="4" height="7" rx="2" fill="#5C3317" transform={`translate(${leftLeg}, 0)`} />
        <rect x="16" y="27" width="4" height="7" rx="2" fill="#5C3317" transform={`translate(${rightLeg}, 0)`} />

        {/* Boots */}
        <ellipse cx={10 + leftLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
        <ellipse cx={18 + rightLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
      </svg>
    </div>
  );
}

// ── Creature Node ──
function CreatureNode({
  creature, onSelect, isSelected, isConnected, isDiscovered, isContained, isNearPlayer, distToPlayer,
}: {
  creature: Creature; onSelect: (c: Creature) => void; isSelected: boolean;
  isConnected: boolean; isDiscovered: boolean; isContained: boolean; isNearPlayer: boolean; distToPlayer: number;
}) {
  const regionColor = REGION_COLORS[creature.region] ?? { accent: "#7c3aed", glow: "124, 58, 237" };
  const composite = creature.threatGradient.likelihood + creature.threatGradient.impact + creature.threatGradient.detectability;

  // Dungeon crawler: undiscovered creatures far from player are invisible
  const inTorchRange = distToPlayer < TORCH_RADIUS;
  if (!isDiscovered && !inTorchRange) return null;

  const statusClass = isDiscovered
    ? creature.currentStatus.status === "confirmed" ? "status-alert" : creature.currentStatus.status === "emerging" ? "status-breathing" : ""
    : "";

  // Fade based on distance from player
  const distOpacity = isDiscovered ? 1 : Math.max(0.3, 1 - (distToPlayer / TORCH_RADIUS));

  return (
    <button
      onClick={() => onSelect(creature)}
      className={`absolute flex flex-col items-center cursor-pointer ${statusClass} ${isSelected ? "z-20" : "z-10"} group`}
      style={{
        left: `${creature.mapPosition.x * 100}%`,
        top: `${creature.mapPosition.y * 100}%`,
        transform: "translate(-50%, -50%)",
        opacity: distOpacity,
        transition: "opacity 0.3s ease",
      }}
      title={isDiscovered ? creature.name : "???"}
    >
      <div className={`relative flex items-center justify-center transition-all duration-200 ${isSelected ? "scale-[1.3]" : "group-hover:scale-110"}`}>
        {isNearPlayer && !isDiscovered && (
          <div className="absolute rounded-full animate-[threat-pulse_1.2s_ease-in-out_infinite]"
            style={{ width: "200%", height: "200%", background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.35) 0%, transparent 70%)` }} />
        )}
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            !isDiscovered ? isNearPlayer ? "border-2 border-dashed" : "border border-white/10 bg-white/5" : "border-2"
          } ${isConnected ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent" : ""}`}
          style={isDiscovered ? {
            borderColor: isContained ? "#16a34a" : regionColor.accent + "80",
            background: isContained
              ? "radial-gradient(circle, rgba(22,163,74,0.2), rgba(22,163,74,0.05))"
              : `radial-gradient(circle, rgba(${regionColor.glow}, 0.25), rgba(${regionColor.glow}, 0.05))`,
            boxShadow: isSelected
              ? `0 0 20px rgba(${regionColor.glow}, 0.6), 0 0 40px rgba(${regionColor.glow}, 0.3)`
              : `0 0 8px rgba(${regionColor.glow}, 0.3)`,
          } : isNearPlayer ? {
            borderColor: regionColor.accent + "50",
            background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.15), transparent)`,
          } : undefined}
        >
          {isDiscovered && !isContained && (
            <div className="absolute -top-0.5 -right-0.5 flex gap-px">
              {[...Array(Math.min(5, Math.ceil(composite / 3)))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: composite >= 12 ? "#ef4444" : composite >= 8 ? "#f59e0b" : "#9ca3af",
                  boxShadow: `0 0 4px ${composite >= 12 ? "#ef4444" : "#f59e0b"}`,
                }} />
              ))}
            </div>
          )}
          <span className={`text-xl md:text-2xl ${!isDiscovered ? isNearPlayer ? "opacity-50 grayscale-[50%]" : "opacity-30 grayscale" : ""}`}>
            {isDiscovered ? creature.icon : isNearPlayer ? creature.icon : "?"}
          </span>
          {isContained && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>
      </div>
      <span
        className={`mt-0.5 text-[10px] font-bold whitespace-nowrap tracking-wide ${isDiscovered ? "text-amber-200" : isNearPlayer ? "text-white/40" : "text-white/15"}`}
        style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
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
      className={`absolute rounded-xl transition-all duration-300 overflow-hidden ${isSelected ? "shadow-lg" : ""}`}
      style={{
        left: `${region.mapPosition.x * 100}%`, top: `${region.mapPosition.y * 100}%`,
        width: `${region.mapPosition.width * 100}%`, height: `${region.mapPosition.height * 100}%`,
        border: isSelected ? `2px solid ${region.color.accent}60` : `1px solid ${region.color.accent}15`,
        backgroundColor: region.color.primary + "15",
      }}
      aria-label={`${region.name} — ${creatureCount} creatures`}
    >
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${region.color.accent}, transparent 70%)` }} />
      <div className="absolute top-2 left-3 md:top-3 md:left-4">
        <h3 className="text-xs md:text-sm font-bold tracking-[0.2em] drop-shadow-lg"
          style={{ fontFamily: "var(--font-display)", color: region.color.accent }}>
          {region.name}
        </h3>
        <p className="text-[10px] text-white/30 mt-0.5">{region.subtitle}</p>
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

// ── Obstacle Renderer ──
function ObstacleNode({ obstacle }: { obstacle: Obstacle }) {
  const s = OBS_STYLES[obstacle.type];
  return (
    <div className="absolute pointer-events-none" style={{
      left: `${obstacle.x * 100}%`, top: `${obstacle.y * 100}%`,
      width: `${obstacle.w * 100}%`, height: `${obstacle.h * 100}%`,
      background: s.bg, border: s.border, borderRadius: s.radius,
      boxShadow: obstacle.type === "water"
        ? "inset 0 1px 4px rgba(100,180,255,0.2), 0 0 6px rgba(100,180,255,0.1)"
        : "0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      zIndex: obstacle.type === "wall" ? 8 : 6,
    }}>
      {obstacle.type === "wall" && (
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 9px),
                            repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.15) 5px, rgba(0,0,0,0.15) 6px)`,
        }} />
      )}
      {obstacle.type === "water" && (
        <div className="absolute inset-0 opacity-20 animate-[fog-drift_6s_ease-in-out_infinite_alternate]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(200,230,255,0.3) 4px, rgba(200,230,255,0.3) 6px)`,
        }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ── Main Map Canvas ──
// ══════════════════════════════════════════
export default function MapCanvas({
  onSelectCreature, onSelectRegion, onEncounterCreature,
  selectedCreature, selectedRegion, showHope, mapRevealed,
  discoveredSet = new Set(), containedSet = new Set(),
  playerX = 0.5, playerY = 0.5,
  playerDirection = "down", playerMoving = false, playerStep = 0,
}: MapCanvasProps) {
  const connectedIds = selectedCreature?.compoundRisk ?? [];
  const lastEncountered = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1, h: 1 });

  // ── Measure viewport with ResizeObserver ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Camera: pixel-based transform to center player ──
  const cameraTransform = useMemo(() => {
    const worldW = viewport.w * WORLD_SCALE;
    const worldH = viewport.h * WORLD_SCALE;
    const playerWorldX = playerX * worldW;
    const playerWorldY = playerY * worldH;

    // Center player in viewport
    let camX = viewport.w / 2 - playerWorldX;
    let camY = viewport.h / 2 - playerWorldY;

    // Clamp to world edges
    camX = Math.max(viewport.w - worldW, Math.min(0, camX));
    camY = Math.max(viewport.h - worldH, Math.min(0, camY));

    return {
      transform: `translate3d(${Math.round(camX)}px, ${Math.round(camY)}px, 0)`,
      width: `${WORLD_SCALE * 100}%`,
      height: `${WORLD_SCALE * 100}%`,
      transition: playerMoving ? "transform 60ms linear" : "transform 200ms ease-out",
    };
  }, [playerX, playerY, playerMoving, viewport]);

  // ── Proximity encounters ──
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
        return;
      }
      if (dist > ENCOUNTER_DISTANCE * 2.5 && lastEncountered.current === creature.id) {
        lastEncountered.current = null;
      }
    }
  }, [playerX, playerY, mapRevealed, discoveredSet, onEncounterCreature]);

  // ── Near-player and distance map ──
  const { nearCreatures, creatureDistances } = useMemo(() => {
    const near = new Set<string>();
    const dists = new Map<string, number>();
    for (const c of allCreatures) {
      const dx = playerX - c.mapPosition.x;
      const dy = playerY - c.mapPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      dists.set(c.id, dist);
      if (!discoveredSet.has(c.id) && dist < HINT_DISTANCE) near.add(c.id);
    }
    return { nearCreatures: near, creatureDistances: dists };
  }, [playerX, playerY, discoveredSet]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-[#0e0c0a]">
      {/* ── WORLD CONTAINER — pixel-based camera ── */}
      <div className="absolute top-0 left-0 will-change-transform" style={cameraTransform}>
        {/* Dark dungeon floor */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(26, 17, 71, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 85% 10%, rgba(127, 29, 29, 0.10) 0%, transparent 40%),
            radial-gradient(ellipse at 10% 55%, rgba(146, 64, 14, 0.10) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 60%, rgba(107, 114, 128, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 35%, rgba(88, 28, 135, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(6, 95, 70, 0.08) 0%, transparent 40%),
            linear-gradient(145deg, #1a1714, #151210, #1a1714, #151210, #1a1714)
          `,
        }} />

        {/* Stone tile grid — prominent dungeon floor */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{
          backgroundImage: `
            linear-gradient(rgba(180,160,120,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,160,120,1) 1px, transparent 1px)
          `,
          backgroundSize: "3.33% 3.33%",
        }} />

        {/* Secondary smaller tiles for detail */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(180,160,120,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,160,120,1) 1px, transparent 1px)
          `,
          backgroundSize: "1.67% 1.67%",
        }} />

        {/* Regions */}
        {regions.map((region) => (
          <RegionOverlay key={region.id} region={region} onSelect={onSelectRegion}
            isSelected={selectedRegion === region.id}
            creatureCount={getCreaturesByRegion(region.id).length} />
        ))}

        {/* Obstacles */}
        {WORLD_OBSTACLES.map((obs, i) => (
          <ObstacleNode key={`obs-${i}`} obstacle={obs} />
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
            isNearPlayer={nearCreatures.has(creature.id)}
            distToPlayer={creatureDistances.get(creature.id) ?? 1} />
        ))}

        {/* Hope creatures */}
        {showHope && hopeCreatures.map((hope) => (
          <div key={hope.id}
            className="absolute flex flex-col items-center z-10 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{
              left: `${hope.mapPosition.x * 100}%`, top: `${hope.mapPosition.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-[hope-pulse_3s_ease-in-out_infinite]"
                style={{ background: "radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)", transform: "scale(3)" }} />
              <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/20 to-amber-100/10 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                <span className="text-xl">{hope.icon}</span>
              </div>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-amber-300 whitespace-nowrap tracking-wide"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {hope.name.replace("THE ", "")}
            </span>
          </div>
        ))}

        {/* ── Player sprite ── */}
        {mapRevealed && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${playerX * 100}%`,
              top: `${playerY * 100}%`,
              transform: "translate(-50%, -80%)",
            }}
          >
            <PlayerSprite direction={playerDirection} isMoving={playerMoving} step={playerStep} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ── VIEWPORT-FIXED OVERLAYS ──             */}
      {/* ══════════════════════════════════════════ */}

      {/* Torchlight effect — radial gradient centered on viewport */}
      {mapRevealed && (
        <div className="absolute inset-0 pointer-events-none z-20 animate-[torch-flicker_4s_ease-in-out_infinite]" style={{
          background: `radial-gradient(ellipse 45% 50% at 50% 50%,
            transparent 0%,
            rgba(0,0,0,0.05) 30%,
            rgba(0,0,0,0.25) 50%,
            rgba(0,0,0,0.55) 65%,
            rgba(0,0,0,0.80) 80%,
            rgba(0,0,0,0.92) 100%
          )`,
        }} />
      )}

      {/* Warm vignette inner glow */}
      {mapRevealed && (
        <div className="absolute inset-0 pointer-events-none z-20" style={{
          background: `radial-gradient(ellipse 35% 40% at 50% 50%,
            rgba(255, 180, 80, 0.06) 0%,
            transparent 100%
          )`,
        }} />
      )}

      {/* Fog overlay (before map reveal) */}
      {!mapRevealed && (
        <div className="absolute inset-0 z-40 bg-gradient-to-b from-[#0e0c0a] via-[#1a1714ee] to-[#0e0c0a] flex items-center justify-center">
          <div className="text-center max-w-2xl px-8">
            <h1 className="title-inscription text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] text-amber-200 mb-8"
              style={{ fontFamily: "var(--font-display)", animationDelay: "0.5s" }}>
              NATURALIS FUTURA
            </h1>
            <p className="text-sm md:text-base text-amber-200/60 leading-relaxed opacity-0 animate-[fade-in-up_1s_ease-out_2s_forwards]"
              style={{ fontFamily: "var(--font-body)" }}>
              The territory beyond human-level intelligence is real. It is
              approaching. No one has drawn the map.{" "}
              <em className="text-amber-100">Until now.</em>
            </p>
            <p className="mt-6 text-xs text-amber-200/30 opacity-0 animate-[fade-in-up_1s_ease-out_3s_forwards]">
              Click anywhere to enter the dungeon...
            </p>
          </div>
        </div>
      )}

      {/* WASD hint */}
      {mapRevealed && (
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-none select-none">
          <div className="flex flex-col items-center gap-0.5">
            <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">W</kbd>
            <div className="flex gap-0.5">
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">A</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">S</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">D</kbd>
            </div>
          </div>
          <span className="text-[10px] text-amber-200/25 font-mono">MOVE</span>
        </div>
      )}

      {/* Minimap */}
      {mapRevealed && (
        <div className="absolute top-3 right-3 z-30 w-28 h-24 rounded-lg border border-amber-200/15 bg-black/60 backdrop-blur-sm overflow-hidden pointer-events-none shadow-lg">
          {/* Player dot */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(255,180,80,0.8)]"
            style={{ left: `${playerX * 100}%`, top: `${playerY * 100}%`, transform: "translate(-50%, -50%)" }} />
          {/* Regions */}
          {regions.map((r) => (
            <div key={r.id} className="absolute rounded-sm border"
              style={{
                left: `${r.mapPosition.x * 100}%`, top: `${r.mapPosition.y * 100}%`,
                width: `${r.mapPosition.width * 100}%`, height: `${r.mapPosition.height * 100}%`,
                borderColor: r.color.accent + "30",
                backgroundColor: r.color.accent + "0a",
              }} />
          ))}
          {/* Discovered creatures */}
          {allCreatures.filter((c) => discoveredSet.has(c.id)).map((c) => (
            <div key={c.id} className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${c.mapPosition.x * 100}%`, top: `${c.mapPosition.y * 100}%`,
                backgroundColor: REGION_COLORS[c.region]?.accent ?? "#666",
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 3px ${REGION_COLORS[c.region]?.accent ?? "#666"}`,
              }} />
          ))}
          {/* Walls on minimap */}
          {WORLD_OBSTACLES.filter((o) => o.type === "wall").map((obs, i) => (
            <div key={`mini-${i}`} className="absolute" style={{
              left: `${obs.x * 100}%`, top: `${obs.y * 100}%`,
              width: `${obs.w * 100}%`, height: `${obs.h * 100}%`,
              backgroundColor: "rgba(180,160,120,0.3)",
            }} />
          ))}
        </div>
      )}

      {/* Compass */}
      <div className="absolute bottom-3 right-3 z-30 opacity-30 pointer-events-none">
        <svg width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" stroke="#b4a078" strokeWidth="0.5" fill="none" />
          <polygon points="20,4 18,12 22,12" fill="#b4a078" opacity="0.8" />
          <text x="20" y="11" textAnchor="middle" fontSize="5" fill="#b4a078" fontFamily="serif">N</text>
        </svg>
      </div>
    </div>
  );
}
