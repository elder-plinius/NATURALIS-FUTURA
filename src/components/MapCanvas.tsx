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

  return (
    <button
      onClick={() => onSelect(creature)}
      className={`creature-icon absolute flex flex-col items-center gap-1 ${statusClass} ${isSelected ? "z-20 scale-125" : "z-10"} ${isConnected ? "ring-2 ring-amber-400 rounded-full" : ""} ${!isDiscovered ? "opacity-40 grayscale" : ""}`}
      style={{
        left: `${creature.mapPosition.x * 100}%`,
        top: `${creature.mapPosition.y * 100}%`,
        transform: `translate(-50%, -50%) scale(${0.8 + sizeMultiplier * 0.4})`,
      }}
      title={isDiscovered ? creature.name : "Unknown creature"}
      aria-label={isDiscovered ? `${creature.name} — ${creature.currentStatus.status}` : "Unknown creature — click to discover"}
    >
      <span
        className="text-2xl md:text-3xl drop-shadow-lg relative"
        role="img"
        aria-hidden="true"
      >
        {isDiscovered ? creature.icon : "❓"}
        {isContained && (
          <span className="absolute -bottom-1 -right-1 text-xs">🛡️</span>
        )}
      </span>
      <span className={`text-xs md:text-xs font-bold whitespace-nowrap drop-shadow-[0_1px_2px_rgba(245,240,225,0.8)] tracking-wide ${isDiscovered ? "text-ink" : "text-ink-light"}`}>
        {isDiscovered ? creature.name.replace("THE ", "") : "???"}
      </span>
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
      className={`region-area absolute rounded-2xl border transition-all duration-300 ${isSelected ? "border-2 shadow-lg" : "border border-dashed"}`}
      style={{
        left: `${region.mapPosition.x * 100}%`,
        top: `${region.mapPosition.y * 100}%`,
        width: `${region.mapPosition.width * 100}%`,
        height: `${region.mapPosition.height * 100}%`,
        borderColor: region.color.accent + "80",
        backgroundColor: region.color.primary + "15",
      }}
      aria-label={`${region.name} region — ${creatureCount} creatures`}
    >
      <div className="absolute top-2 left-3 md:top-3 md:left-4">
        <h3
          className="text-xs md:text-sm font-bold tracking-widest"
          style={{ color: region.color.accent }}
        >
          {region.name}
        </h3>
        <p className="text-xs md:text-xs text-ink-light opacity-70 mt-0.5">
          {region.subtitle}
        </p>
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

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-5"
      aria-hidden="true"
    >
      {connected.map((target) => (
        <line
          key={`${selectedCreature.id}-${target.id}`}
          x1={`${selectedCreature.mapPosition.x * 100}%`}
          y1={`${selectedCreature.mapPosition.y * 100}%`}
          x2={`${target.mapPosition.x * 100}%`}
          y2={`${target.mapPosition.y * 100}%`}
          className="compound-line"
          stroke="#f59e0b"
          strokeWidth="2"
          opacity="0.6"
        />
      ))}
    </svg>
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
          <div
            key={hope.id}
            className="absolute flex flex-col items-center gap-1 z-30 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{
              left: `${hope.mapPosition.x * 100}%`,
              top: `${hope.mapPosition.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <span className="text-3xl md:text-4xl drop-shadow-[0_0_12px_rgba(234,179,8,0.5)]">
              {hope.icon}
            </span>
            <span className="text-xs md:text-xs font-bold text-amber-800 whitespace-nowrap tracking-wide">
              {hope.name.replace("THE ", "")}
            </span>
          </div>
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
      <div className="absolute bottom-4 right-4 md:bottom-8 md:right-8 opacity-30 pointer-events-none">
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          aria-hidden="true"
        >
          <circle cx="30" cy="30" r="28" stroke="#2c1810" strokeWidth="1" fill="none" />
          <line x1="30" y1="2" x2="30" y2="58" stroke="#2c1810" strokeWidth="0.5" />
          <line x1="2" y1="30" x2="58" y2="30" stroke="#2c1810" strokeWidth="0.5" />
          <polygon points="30,4 27,15 33,15" fill="#2c1810" />
          <text x="30" y="14" textAnchor="middle" fontSize="6" fill="#2c1810" fontFamily="serif">N</text>
        </svg>
      </div>
    </div>
  );
}
