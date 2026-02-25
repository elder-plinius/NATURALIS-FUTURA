"use client";

import {
  Creature,
  ViewMode,
  getConnectedCreatures,
  getCompoundsForCreature,
} from "@/data";

interface BestiaryPanelProps {
  creature: Creature;
  viewMode: ViewMode;
  onClose: () => void;
  onSelectCreature: (creature: Creature) => void;
  onSetViewMode: (mode: ViewMode) => void;
  isContained?: boolean;
  onChallenge?: (creature: Creature) => void;
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    theoretical: "bg-gray-200 text-gray-700",
    emerging: "bg-amber-100 text-amber-800",
    confirmed: "bg-red-100 text-red-800",
  };
  const icons = {
    theoretical: "○",
    emerging: "◐",
    confirmed: "●",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${colors[status as keyof typeof colors]}`}
    >
      <span>{icons[status as keyof typeof icons]}</span>
      {status.toUpperCase()}
    </span>
  );
}

function ThreatBar({ value, max = 5, label }: { value: number; max?: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-ink-light w-24">{label}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-2 rounded-sm ${i < value ? "bg-red-700" : "bg-gray-200"}`}
          />
        ))}
      </div>
      <span className="text-xs font-mono text-ink-light">{value}/{max}</span>
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

  return (
    <div className="bestiary-panel h-full overflow-y-auto border-l border-ink/10">
      <div className="p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-3xl" role="img" aria-hidden="true">
                {creature.icon}
              </span>
              <h2
                className="text-xl md:text-2xl font-bold tracking-wider text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {creature.name}
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-ink-light">
              <span>Region: {creature.region.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}</span>
              <span>|</span>
              <StatusBadge status={creature.currentStatus.status} />
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

        {/* Challenge / Contained button */}
        {isContained ? (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
            <span>🛡️</span>
            <span className="text-xs font-bold text-green-800">CONTAINED</span>
          </div>
        ) : onChallenge ? (
          <button
            onClick={() => onChallenge(creature)}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-ink text-parchment font-bold text-sm tracking-wide hover:bg-ink/90 transition-colors"
          >
            <span>⚔️</span>
            CHALLENGE — ATTEMPT CONTAINMENT
          </button>
        ) : null}

        {/* Separator */}
        <div className="border-t border-ink/10 my-4" />

        {/* Novice content — always shown */}
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
            Mythic Origin
          </h3>
          <p className="text-sm leading-relaxed text-ink">
            {creature.mythicOrigin}
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
            In Nature
          </h3>
          <p className="text-sm leading-relaxed text-ink">
            {creature.naturalAnalogue}
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
            Science Fiction Echo
          </h3>
          <p className="text-sm leading-relaxed text-ink italic">
            {creature.sciFiEcho}
          </p>
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
            The Danger
          </h3>
          {viewMode === "novice" ? (
            <p className="text-sm leading-relaxed text-ink">
              {creature.technicalSpec.split(".").slice(0, 3).join(".") + "."}
            </p>
          ) : (
            <div
              className="text-sm leading-relaxed text-ink p-3 rounded-lg bg-ink/[0.03] border border-ink/5"
              style={{ fontFamily: "var(--font-mono)", fontSize: "13px" }}
            >
              {creature.technicalSpec}
            </div>
          )}
        </section>

        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
            Countermeasure: {creature.countermeasure.name}
          </h3>
          <p className="text-sm leading-relaxed text-ink">
            {creature.countermeasure.description}
          </p>
        </section>

        {/* Scholar/Cartographer content */}
        {viewMode !== "novice" && (
          <>
            <section className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-3">
                Threat Gradient
              </h3>
              <div className="space-y-2">
                <ThreatBar
                  value={creature.threatGradient.likelihood}
                  label="Likelihood"
                />
                <ThreatBar
                  value={creature.threatGradient.impact}
                  label="Impact"
                />
                <ThreatBar
                  value={creature.threatGradient.detectability}
                  label="Stealth"
                />
              </div>
              <p className="text-xs text-ink-light mt-2">
                Composite risk score:{" "}
                {creature.threatGradient.likelihood +
                  creature.threatGradient.impact +
                  creature.threatGradient.detectability}
                /15
              </p>
            </section>

            <section className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-2">
                Current Status
              </h3>
              <div className="text-sm leading-relaxed text-ink p-3 rounded-lg bg-ink/[0.03] border border-ink/5">
                {creature.currentStatus.evidence}
              </div>
            </section>
          </>
        )}

        {/* Compound connections */}
        <section className="mb-6">
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-light mb-3">
            Compounds With
          </h3>
          <div className="flex flex-wrap gap-2">
            {connected.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCreature(c)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-ink/5 hover:bg-ink/10 transition-colors text-ink"
              >
                <span>{c.icon}</span>
                {c.name.replace("THE ", "")}
              </button>
            ))}
          </div>
          {compounds.length > 0 && (
            <div className="mt-3 space-y-2">
              {compounds.map((ct) => (
                <div
                  key={ct.id}
                  className="text-xs p-2 rounded bg-amber-50 border border-amber-200"
                >
                  <span className="font-bold text-amber-900">{ct.name}</span>
                  <span className="text-amber-700"> — {ct.scenario.split(".")[0]}.</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* View mode switcher */}
        <div className="border-t border-ink/10 pt-4 mt-4">
          <div className="flex gap-2">
            {(["novice", "scholar", "cartographer"] as ViewMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => onSetViewMode(mode)}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                    viewMode === mode
                      ? "bg-ink text-parchment"
                      : "bg-ink/5 text-ink hover:bg-ink/10"
                  }`}
                >
                  {mode === "novice"
                    ? "Novice"
                    : mode === "scholar"
                      ? "Scholar"
                      : "Cartographer"}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
