"use client";

import { usePlayerProgress } from "@/lib/PlayerProgressContext";
import { regions, getCreaturesByRegion } from "@/data";
import { getTitle, getNextTitle, getRegionProgress, getOverallDiscovery, getOverallContainment } from "@/lib/game-logic";
import { TITLE_THRESHOLDS } from "@/lib/game-types";

export default function ProgressPanel() {
  const {
    state,
    discoveredSet,
    containedSet,
    title,
    nextTitle,
    discoveryCount,
    containmentCount,
    totalCreatures,
    isLoaded,
    resetProgress,
  } = usePlayerProgress();

  if (!isLoaded) return null;

  const overallDiscovery = getOverallDiscovery(discoveredSet);
  const overallContainment = getOverallContainment(containedSet);
  const mapComplete = containmentCount >= totalCreatures && totalCreatures > 0;
  const winRate = state.battleStats.wins + state.battleStats.losses > 0
    ? Math.round((state.battleStats.wins / (state.battleStats.wins + state.battleStats.losses)) * 100)
    : 0;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold tracking-widest text-ink mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CARTOGRAPHER&apos;S JOURNAL
        </h2>
        <p className="text-sm text-ink-light">
          Track your exploration of the bestiary. Discover creatures, contain threats, master regions.
        </p>
      </div>

      {/* Completion banner — the whole map is drawn */}
      {mapComplete && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent("naturalis:show-victory"))}
          className="w-full mb-6 rounded-xl px-5 py-4 flex items-center gap-3 text-left bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/25 hover:from-amber-500 hover:to-amber-400 transition-all"
        >
          <span className="text-2xl">&#128081;</span>
          <div className="flex-1">
            <p className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)" }}>
              The Map Is Complete
            </p>
            <p className="text-sm opacity-90">Grand Cartographer &mdash; view your completion</p>
          </div>
          <span className="text-lg">&rarr;</span>
        </button>
      )}

      {/* Title & XP */}
      <div className="parchment-card rounded-xl p-5 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{title.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-ink">{title.title}</h3>
            <p className="text-xs text-ink-light">{state.xp} XP total</p>
          </div>
        </div>

        {/* Title progression */}
        <div className="space-y-2">
          {TITLE_THRESHOLDS.map((t, i) => {
            const next = TITLE_THRESHOLDS[i + 1];
            const isCurrent = state.xp >= t.xp && (!next || state.xp < next.xp);
            const isAchieved = state.xp >= t.xp;
            const progress = next
              ? Math.min(100, Math.max(0, ((state.xp - t.xp) / (next.xp - t.xp)) * 100))
              : 100;

            return (
              <div key={t.title} className={`flex items-center gap-3 ${!isAchieved ? "opacity-40" : ""}`}>
                <span className="text-lg w-8 text-center">{t.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-xs ${isCurrent ? "font-bold text-ink" : "text-ink-light"}`}>
                      {t.title}
                    </span>
                    <span className="text-xs text-ink-light font-mono">{t.xp} XP</span>
                  </div>
                  {isCurrent && next && (
                    <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-amber-500 transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatBox icon="🔍" label="Discovered" value={`${discoveryCount}/${totalCreatures}`} sub={`${overallDiscovery}%`} />
        <StatBox icon="🛡️" label="Contained" value={`${containmentCount}/${totalCreatures}`} sub={`${overallContainment}%`} />
        <StatBox icon="⚔️" label="Win Rate" value={`${winRate}%`} sub={`${state.battleStats.wins}W / ${state.battleStats.losses}L`} />
        <StatBox icon="🔥" label="Best Streak" value={`${state.battleStats.bestStreak}`} sub={`Current: ${state.battleStats.currentStreak}`} />
      </div>

      {/* Region breakdown */}
      <div className="parchment-card rounded-xl p-5 mb-6">
        <h3
          className="text-sm font-bold tracking-widest text-ink mb-4"
          style={{ fontFamily: "var(--font-display)" }}
        >
          REGION MASTERY
        </h3>
        <div className="space-y-3">
          {regions.map((region) => {
            const creatures = getCreaturesByRegion(region.id);
            const discovered = creatures.filter((c) => discoveredSet.has(c.id)).length;
            const contained = creatures.filter((c) => containedSet.has(c.id)).length;
            const mastered = !!state.regionMastery[region.id];
            const discPct = creatures.length > 0 ? Math.round((discovered / creatures.length) * 100) : 0;

            return (
              <div key={region.id} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: region.color.accent }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs font-bold text-ink truncate">
                      {region.name}
                      {mastered && <span className="ml-1 text-amber-600">&#9734;</span>}
                    </span>
                    <span className="text-xs text-ink-light font-mono shrink-0">
                      {discovered}/{creatures.length} found &middot; {contained}/{creatures.length} contained
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-ink/10 overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${discPct}%`,
                        backgroundColor: region.color.accent + "80",
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => {
            if (confirm("Reset all progress? This cannot be undone.")) {
              resetProgress();
            }
          }}
          className="text-xs text-ink-light hover:text-red-600 transition-colors"
        >
          Reset Progress
        </button>
      </div>
    </div>
  );
}

function StatBox({ icon, label, value, sub }: { icon: string; label: string; value: string; sub: string }) {
  return (
    <div className="parchment-card rounded-xl p-3 text-center">
      <div className="text-lg mb-0.5">{icon}</div>
      <div className="text-lg font-bold text-ink">{value}</div>
      <div className="text-xs text-ink-light">{label}</div>
      <div className="text-xs text-ink-light font-mono mt-0.5">{sub}</div>
    </div>
  );
}
