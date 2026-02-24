"use client";

import { allCreatures, regions, Creature } from "@/data";

interface RiskMatrixProps {
  onSelectCreature: (creature: Creature) => void;
  filterStatus: string | null;
}

function getRegionColor(regionId: string): string {
  const region = regions.find((r) => r.id === regionId);
  return region?.color.accent ?? "#666";
}

export default function RiskMatrix({
  onSelectCreature,
  filterStatus,
}: RiskMatrixProps) {
  const filtered = filterStatus
    ? allCreatures.filter((c) => c.currentStatus.status === filterStatus)
    : allCreatures;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <h2
        className="text-2xl font-bold tracking-widest text-ink mb-2"
        style={{ fontFamily: "var(--font-display)" }}
      >
        RISK MATRIX
      </h2>
      <p className="text-sm text-ink-light mb-8">
        All regions. Size indicates detection difficulty. Color indicates region.
      </p>

      {/* Matrix plot */}
      <div className="relative bg-parchment-dark/50 rounded-xl border border-ink/10 p-4 mb-8">
        {/* Y-axis label */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -rotate-90 text-xs font-bold tracking-widest text-ink-light">
          IMPACT
        </div>
        {/* X-axis label */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-xs font-bold tracking-widest text-ink-light">
          LIKELIHOOD
        </div>

        {/* Grid */}
        <div
          className="relative ml-8 mb-6"
          style={{ height: "400px" }}
          role="img"
          aria-label="Risk matrix scatter plot of all threat creatures"
        >
          {/* Grid lines */}
          {[1, 2, 3, 4, 5].map((v) => (
            <div key={`h-${v}`}>
              <div
                className="absolute left-0 right-0 border-t border-ink/5"
                style={{ bottom: `${((v - 0.5) / 5) * 100}%` }}
              />
              <span
                className="absolute -left-6 text-xs text-ink-light"
                style={{
                  bottom: `${((v - 0.5) / 5) * 100}%`,
                  transform: "translateY(50%)",
                }}
              >
                {v}
              </span>
            </div>
          ))}
          {[1, 2, 3, 4, 5].map((v) => (
            <div key={`v-${v}`}>
              <div
                className="absolute top-0 bottom-0 border-l border-ink/5"
                style={{ left: `${((v - 0.5) / 5) * 100}%` }}
              />
              <span
                className="absolute -bottom-5 text-xs text-ink-light"
                style={{
                  left: `${((v - 0.5) / 5) * 100}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {v}
              </span>
            </div>
          ))}

          {/* Danger zone gradient */}
          <div
            className="absolute inset-0 rounded opacity-10 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(6,95,70,0.3) 0%, rgba(234,179,8,0.3) 50%, rgba(153,27,27,0.5) 100%)",
            }}
          />

          {/* Creature dots */}
          {filtered.map((creature) => {
            const size = 12 + creature.threatGradient.detectability * 6;
            return (
              <button
                key={creature.id}
                onClick={() => onSelectCreature(creature)}
                className="absolute transition-all duration-200 hover:scale-125 hover:z-10 rounded-full flex items-center justify-center"
                style={{
                  left: `${((creature.threatGradient.likelihood - 0.5) / 5) * 100}%`,
                  bottom: `${((creature.threatGradient.impact - 0.5) / 5) * 100}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                  backgroundColor: getRegionColor(creature.region),
                  transform: "translate(-50%, 50%)",
                  border: "2px solid rgba(245,240,225,0.8)",
                  boxShadow: `0 0 ${creature.threatGradient.detectability * 2}px ${getRegionColor(creature.region)}40`,
                }}
                title={`${creature.name} — L:${creature.threatGradient.likelihood} I:${creature.threatGradient.impact} D:${creature.threatGradient.detectability}`}
                aria-label={`${creature.name}: Likelihood ${creature.threatGradient.likelihood}, Impact ${creature.threatGradient.impact}, Detectability ${creature.threatGradient.detectability}`}
              >
                <span className="text-[8px]">{creature.icon}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {regions.map((region) => (
          <div key={region.id} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: region.color.accent }}
            />
            <span className="text-xs text-ink-light">{region.name}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-ink-light">
        Larger dots indicate higher stealth (harder to detect). Position shows likelihood (x) vs impact (y).
      </p>

      {/* Table view */}
      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-ink/10">
              <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-light">
                Creature
              </th>
              <th className="text-left py-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-light">
                Region
              </th>
              <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-light">
                Risk
              </th>
              <th className="text-center py-2 px-3 text-xs font-bold uppercase tracking-wider text-ink-light">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {[...filtered]
              .sort(
                (a, b) =>
                  b.threatGradient.likelihood +
                  b.threatGradient.impact +
                  b.threatGradient.detectability -
                  (a.threatGradient.likelihood +
                    a.threatGradient.impact +
                    a.threatGradient.detectability),
              )
              .map((creature) => (
                <tr
                  key={creature.id}
                  className="border-b border-ink/5 hover:bg-ink/[0.02] cursor-pointer"
                  onClick={() => onSelectCreature(creature)}
                >
                  <td className="py-2 px-3 font-medium">
                    <span className="mr-2">{creature.icon}</span>
                    {creature.name}
                  </td>
                  <td className="py-2 px-3 text-ink-light text-xs">
                    {regions.find((r) => r.id === creature.region)?.name}
                  </td>
                  <td className="py-2 px-3 text-center font-mono text-xs">
                    {creature.threatGradient.likelihood +
                      creature.threatGradient.impact +
                      creature.threatGradient.detectability}
                    /15
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        creature.currentStatus.status === "confirmed"
                          ? "bg-red-100 text-red-800"
                          : creature.currentStatus.status === "emerging"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {creature.currentStatus.status}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
