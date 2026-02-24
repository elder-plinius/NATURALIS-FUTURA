"use client";

import { compoundThreats, getCreatureById, Creature } from "@/data";

interface CompoundExplorerProps {
  onSelectCreature: (creature: Creature) => void;
}

export default function CompoundExplorer({
  onSelectCreature,
}: CompoundExplorerProps) {
  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2
        className="text-2xl font-bold tracking-widest text-ink mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        COMPOUND THREAT EXPLORER
      </h2>
      <p className="text-sm text-ink-light mb-8">
        The most dangerous scenarios arise when threats from different regions
        combine. These are the compound creatures — threats that multiply when
        they meet.
      </p>

      <div className="space-y-6">
        {compoundThreats.map((compound) => {
          const creatures = compound.creatures
            .map(getCreatureById)
            .filter((c): c is Creature => c !== undefined);

          return (
            <div
              key={compound.id}
              className="parchment-card rounded-xl p-5 md:p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3
                    className="text-lg md:text-xl font-bold tracking-wider text-ink"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {compound.name}
                  </h3>
                  <p className="text-xs text-ink-light mt-1">
                    Regions:{" "}
                    {compound.regions
                      .map((r) =>
                        r.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase()),
                      )
                      .join(" + ")}
                  </p>
                </div>
              </div>

              {/* Creature cards */}
              <div className="flex flex-wrap gap-3 mb-4">
                {creatures.map((creature, i) => (
                  <div key={creature.id} className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectCreature(creature)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ink/5 hover:bg-ink/10 transition-colors"
                    >
                      <span className="text-xl">{creature.icon}</span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-ink">
                          {creature.name}
                        </div>
                        <div className="text-xs text-ink-light">
                          {creature.threatClass}
                        </div>
                      </div>
                    </button>
                    {i < creatures.length - 1 && (
                      <span className="text-ink-light text-lg mx-1">+</span>
                    )}
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="text-ink-light text-lg mx-2">=</span>
                  <span
                    className="text-sm font-bold text-red-800 tracking-wider"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {compound.name}
                  </span>
                </div>
              </div>

              {/* Scenario */}
              <div className="mb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-1">
                  Scenario
                </h4>
                <p className="text-sm leading-relaxed text-ink">
                  {compound.scenario}
                </p>
              </div>

              {/* Natural analogue */}
              <div className="mb-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-ink-light mb-1">
                  Natural Analogue
                </h4>
                <p className="text-sm leading-relaxed text-ink italic">
                  {compound.naturalAnalogue}
                </p>
              </div>

              {/* Risk amplification */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <h4 className="text-xs font-bold uppercase tracking-widest text-red-800 mb-1">
                  Risk Amplification
                </h4>
                <p className="text-xs text-red-700">
                  {compound.riskAmplification}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
