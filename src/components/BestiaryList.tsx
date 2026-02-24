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
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: region.color.accent }}
              />
              <h3
                className="text-lg font-bold tracking-wider"
                style={{
                  fontFamily: "var(--font-display)",
                  color: region.color.primary,
                }}
              >
                {region.name}
              </h3>
              <span className="text-xs text-ink-light">
                — {region.subtitle}
              </span>
            </div>
            <p className="text-xs italic text-ink-light mb-4 pl-7">
              &ldquo;{region.epigraph}&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-7">
              {creatures.map((creature) => (
                <button
                  key={creature.id}
                  onClick={() => onSelectCreature(creature)}
                  className="parchment-card rounded-lg p-4 text-left hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{creature.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-ink truncate">
                          {creature.name}
                        </h4>
                        <span
                          className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                            creature.currentStatus.status === "confirmed"
                              ? "bg-red-100 text-red-800"
                              : creature.currentStatus.status === "emerging"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {creature.currentStatus.status}
                        </span>
                      </div>
                      <p className="text-xs text-ink-light line-clamp-2">
                        {creature.mythicOrigin.split(".")[0]}.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-ink-light font-mono">
                          Risk:{" "}
                          {creature.threatGradient.likelihood +
                            creature.threatGradient.impact +
                            creature.threatGradient.detectability}
                          /15
                        </span>
                        <span className="text-xs text-ink-light">
                          | Countermeasure: {creature.countermeasure.name}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
