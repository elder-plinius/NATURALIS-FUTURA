"use client";

import { useEffect, useRef } from "react";
import {
  Creature,
  ViewMode,
  getConnectedCreatures,
  getCompoundsForCreature,
  regions,
} from "@/data";
import StatusSeal from "./StatusSeal";

interface BestiaryPanelProps {
  creature: Creature;
  viewMode: ViewMode;
  onClose: () => void;
  onSelectCreature: (creature: Creature) => void;
  onSetViewMode: (mode: ViewMode) => void;
  isContained?: boolean;
  onChallenge?: (creature: Creature) => void;
}

function ThreatBar({ value, max = 5, label, color }: { value: number; max?: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-light w-24 shrink-0">{label}</span>
      <div className="flex gap-1 flex-1">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className="flex-1 h-2 rounded-full transition-all duration-500"
            style={{
              backgroundColor: i < value ? color : "rgba(44,24,16,0.08)",
              boxShadow: i < value ? `0 0 6px ${color}40` : "none",
            }}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-ink-light w-8 text-right">{value}/{max}</span>
    </div>
  );
}

export default function BestiaryPanel({
  creature,
  viewMode,
  onClose,
  onSelectCreature,
  onSetViewMode,
  isContained = false,
  onChallenge,
}: BestiaryPanelProps) {
  const connected = getConnectedCreatures(creature.id);
  const compounds = getCompoundsForCreature(creature.id);
  const region = regions.find((r) => r.id === creature.region);
  const regionAccent = region?.color.accent ?? "#7c3aed";
  const composite = creature.threatGradient.likelihood + creature.threatGradient.impact + creature.threatGradient.detectability;

  // A new specimen starts at the top of its dossier, not wherever the
  // previous creature's scroll position happened to be.
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [creature.id]);

  return (
    <div ref={scrollRef} className="bestiary-panel h-full overflow-y-auto border-l border-ink/10 relative">
      {/* Region accent header bar */}
      <div
        className="absolute top-0 left-0 right-0 h-1 z-10"
        style={{ background: `linear-gradient(90deg, ${regionAccent}, ${regionAccent}40)` }}
      />

      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              {/* Styled sprite icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${regionAccent}15, ${regionAccent}08)`,
                  border: `1.5px solid ${regionAccent}30`,
                  boxShadow: `0 4px 12px ${regionAccent}15`,
                }}
              >
                <span className="text-3xl relative z-10" role="img" aria-hidden="true">
                  {creature.icon}
                </span>
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${regionAccent}, transparent 70%)`,
                  }}
                />
              </div>
              <div>
                <h2
                  className="text-xl md:text-2xl font-bold tracking-wider text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {creature.name}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-xs font-bold tracking-widest"
                    style={{ color: regionAccent }}
                  >
                    {region?.name}
                  </span>
                  <span className="text-ink/20">|</span>
                  <StatusSeal status={creature.currentStatus.status} />
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-ink-light hover:text-ink transition-colors text-xl leading-none p-1"
            aria-label="Close panel"
          >
            &times;
          </button>
        </div>

        {/* Threat gradient mini bar */}
        <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-lg bg-ink/[0.02] border border-ink/5">
          <div className="flex gap-2 flex-1">
            {[
              { label: "L", value: creature.threatGradient.likelihood },
              { label: "I", value: creature.threatGradient.impact },
              { label: "D", value: creature.threatGradient.detectability },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-xs text-ink-light font-mono">{label}</span>
                <div className="flex gap-px">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-sm"
                      style={{
                        backgroundColor: i <= value ? regionAccent : "rgba(44,24,16,0.08)",
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <span
            className="text-sm font-bold font-mono"
            style={{ color: composite >= 12 ? "#ef4444" : composite >= 8 ? regionAccent : "#6b7280" }}
          >
            {composite}/15
          </span>
        </div>

        {/* Battle / Defeated */}
        {isContained ? (
          <div className="flex items-center gap-2 mb-4 px-3 py-2.5 rounded-lg bg-green-50 border border-green-200">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-white">
                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="text-xs font-bold text-green-800 tracking-wide">DEFEATED</span>
          </div>
        ) : onChallenge ? (
          <button
            onClick={() => onChallenge(creature)}
            className="mb-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-bold text-sm tracking-[0.25em] transition-all duration-200 text-(--writ) hover:bg-(--writ) hover:text-white hover:shadow-lg active:scale-[0.98]"
            style={{
              ["--writ" as string]: regionAccent,
              fontFamily: "var(--font-display)",
              border: `1px solid ${regionAccent}70`,
              boxShadow: `inset 0 0 0 3px transparent, inset 0 0 0 3.5px ${regionAccent}30`,
            }}
          >
            <span className="text-base">&#9876;</span>
            ISSUE THE CHALLENGE
          </button>
        ) : null}

        {/* Separator */}
        <div
          className="my-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${regionAccent}20, transparent)`,
          }}
        />

        {/* Novice content */}
        <section className="mb-6">
          <SectionHeader label="Mythic Origin" accent={regionAccent} />
          <p className="drop-cap text-sm leading-relaxed text-ink">{creature.mythicOrigin}</p>
        </section>

        <section className="mb-6">
          <SectionHeader label="In Nature" accent={regionAccent} />
          <p className="text-sm leading-relaxed text-ink">{creature.naturalAnalogue}</p>
        </section>

        <section className="mb-6">
          <SectionHeader label="Science Fiction Echo" accent={regionAccent} />
          <p className="text-sm leading-relaxed text-ink italic">{creature.sciFiEcho}</p>
        </section>

        <section className="mb-6">
          <SectionHeader label="Inner World Echo" accent={regionAccent} />
          <p className="text-sm leading-relaxed text-ink">{creature.innerWorldEcho}</p>
        </section>

        <section className="mb-6">
          <SectionHeader label="The Danger" accent={regionAccent} />
          {viewMode === "novice" ? (
            <p className="text-sm leading-relaxed text-ink">
              {creature.technicalSpec.split(".").slice(0, 3).join(".") + "."}
            </p>
          ) : (
            <div
              className="text-sm leading-relaxed text-ink p-3 rounded-lg border"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "13px",
                backgroundColor: `${regionAccent}05`,
                borderColor: `${regionAccent}15`,
              }}
            >
              {creature.technicalSpec}
            </div>
          )}
        </section>

        <section className="mb-6">
          <SectionHeader label={`Countermeasure: ${creature.countermeasure.name}`} accent={regionAccent} />
          <div
            className="text-sm leading-relaxed text-ink p-3 rounded-lg border-l-2"
            style={{
              borderColor: regionAccent,
              backgroundColor: `${regionAccent}05`,
            }}
          >
            {creature.countermeasure.description}
          </div>
        </section>

        {/* Scholar/Cartographer content */}
        {viewMode !== "novice" && (
          <>
            <section className="mb-6">
              <SectionHeader label="Threat Gradient" accent={regionAccent} />
              <div className="space-y-2.5 p-3 rounded-lg bg-ink/[0.02]">
                <ThreatBar value={creature.threatGradient.likelihood} label="Likelihood" color={regionAccent} />
                <ThreatBar value={creature.threatGradient.impact} label="Impact" color="#ef4444" />
                <ThreatBar value={creature.threatGradient.detectability} label="Stealth" color="#6366f1" />
              </div>
            </section>

            <section className="mb-6">
              <SectionHeader label="Current Status" accent={regionAccent} />
              <div
                className="text-sm leading-relaxed text-ink p-3 rounded-lg border"
                style={{
                  backgroundColor: `${regionAccent}05`,
                  borderColor: `${regionAccent}15`,
                }}
              >
                {creature.currentStatus.evidence}
              </div>
            </section>
          </>
        )}

        {/* Compound connections */}
        <section className="mb-6">
          <SectionHeader label="Compounds With" accent={regionAccent} />
          <div className="flex flex-wrap gap-2">
            {connected.map((c) => {
              const cRegion = regions.find((r) => r.id === c.region);
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCreature(c)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:shadow-md hover:scale-105"
                  style={{
                    backgroundColor: `${cRegion?.color.accent ?? regionAccent}10`,
                    border: `1px solid ${cRegion?.color.accent ?? regionAccent}25`,
                    color: "#2c1810",
                  }}
                >
                  <span>{c.icon}</span>
                  {c.name.replace("THE ", "")}
                </button>
              );
            })}
          </div>
          {compounds.length > 0 && (
            <div className="mt-3 space-y-2">
              {compounds.map((ct) => (
                <div
                  key={ct.id}
                  className="text-xs p-3 rounded-lg border"
                  style={{
                    backgroundColor: `${regionAccent}08`,
                    borderColor: `${regionAccent}20`,
                  }}
                >
                  <span className="font-bold" style={{ color: regionAccent }}>{ct.name}</span>
                  <span className="text-ink-light"> &mdash; {ct.scenario.split(".")[0]}.</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* View mode switcher */}
        <div
          className="mt-4 mb-4 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${regionAccent}20, transparent)`,
          }}
        />
        <div className="flex gap-2">
          {(["novice", "scholar", "cartographer"] as ViewMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => onSetViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "text-white shadow-md"
                    : "bg-ink/5 text-ink hover:bg-ink/10"
                }`}
                style={viewMode === mode ? {
                  background: `linear-gradient(135deg, ${regionAccent}, ${regionAccent}cc)`,
                  boxShadow: `0 2px 8px ${regionAccent}30`,
                } : undefined}
              >
                {mode === "novice" ? "Novice" : mode === "scholar" ? "Scholar" : "Cartographer"}
              </button>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ label, accent }: { label: string; accent: string }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
      <div
        className="w-1 h-4 rounded-full shrink-0"
        style={{ backgroundColor: accent }}
      />
      {label}
    </h3>
  );
}
