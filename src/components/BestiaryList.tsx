"use client";

import { allCreatures, regions, Creature, getCreaturesByRegion } from "@/data";

interface BestiaryListProps {
  onSelectCreature: (creature: Creature) => void;
}

export default function BestiaryList({ onSelectCreature }: BestiaryListProps) {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2
        className="text-2xl font-bold tracking-widest text-ink mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        THE BESTIARY
      </h2>
      <p className="text-sm text-ink-light mb-8">
        A complete catalog of {allCreatures.length} threat archetypes across{" "}
        {regions.length} regions. Every danger that advanced AI could pose has
        already appeared in nature, myth, or story.
      </p>

      {regions.map((region) => {
        const creatures = getCreaturesByRegion(region.id);
        return (
          <div key={region.id} className="mb-10">
            {/* Region header */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: region.color.accent + "15",
                  border: `1.5px solid ${region.color.accent}40`,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: region.color.accent }}
                />
              </div>
              <h3
                className="text-lg font-bold tracking-[0.15em]"
                style={{
                  fontFamily: "var(--font-display)",
                  color: region.color.primary,
                }}
              >
                {region.name}
              </h3>
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(90deg, ${region.color.accent}30, transparent)`,
                }}
              />
              <span className="text-xs text-ink-light font-mono">
                {creatures.length}
              </span>
            </div>
            <p className="text-xs italic text-ink-light mb-4 pl-8">
              &ldquo;{region.epigraph}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8">
              {creatures.map((creature) => {
                const composite =
                  creature.threatGradient.likelihood +
                  creature.threatGradient.impact +
                  creature.threatGradient.detectability;

                return (
                  <button
                    key={creature.id}
                    onClick={() => onSelectCreature(creature)}
                    className="group parchment-card rounded-xl p-4 text-left transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] relative overflow-hidden"
                  >
                    {/* Region accent bar */}
                    <div
                      className="absolute top-0 left-0 w-1 h-full rounded-l-xl"
                      style={{ backgroundColor: region.color.accent + "60" }}
                    />

                    <div className="flex items-start gap-3">
                      {/* Sprite icon */}
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 relative"
                        style={{
                          background: `linear-gradient(135deg, ${region.color.accent}12, ${region.color.accent}05)`,
                          border: `1px solid ${region.color.accent}20`,
                        }}
                      >
                        <span className="text-xl">{creature.icon}</span>
                        {/* Glow on hover */}
                        <div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{
                            boxShadow: `0 0 12px ${region.color.accent}25`,
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-bold text-ink truncate">
                            {creature.name}
                          </h4>
                          <StatusPill status={creature.currentStatus.status} />
                        </div>
                        <p className="text-xs text-ink-light line-clamp-2 mb-2">
                          {creature.mythicOrigin.split(".")[0]}.
                        </p>
                        <div className="flex items-center gap-3">
                          {/* Threat mini dots */}
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-ink-light font-mono">Risk</span>
                            <div className="flex gap-px">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{
                                    backgroundColor:
                                      i < Math.ceil(composite / 3)
                                        ? composite >= 12 ? "#ef4444" : composite >= 8 ? region.color.accent : "#9ca3af"
                                        : "rgba(44,24,16,0.08)",
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-xs font-mono text-ink-light">{composite}</span>
                          </div>
                          <span className="text-ink/10">|</span>
                          <span className="text-xs text-ink-light truncate">
                            {creature.countermeasure.name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config = {
    confirmed: { bg: "#fef2f2", border: "#fecaca", text: "#991b1b", dot: "#ef4444" },
    emerging: { bg: "#fffbeb", border: "#fde68a", text: "#92400e", dot: "#f59e0b" },
    theoretical: { bg: "#f9fafb", border: "#e5e7eb", text: "#6b7280", dot: "#9ca3af" },
  };
  const c = config[status as keyof typeof config] ?? config.theoretical;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
      style={{
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        color: c.text,
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${status === "confirmed" ? "animate-pulse" : ""}`}
        style={{ backgroundColor: c.dot }}
      />
      {status}
    </span>
  );
}
