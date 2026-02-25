"use client";

import { usePlayerProgress } from "@/lib/PlayerProgressContext";

export default function PlayerHUD() {
  const {
    state,
    title,
    nextTitle,
    discoveryCount,
    containmentCount,
    totalCreatures,
    isLoaded,
  } = usePlayerProgress();

  if (!isLoaded) return null;

  const xpToNext = nextTitle ? nextTitle.xp - state.xp : 0;
  const xpProgress = nextTitle
    ? ((state.xp - (title.xp)) / (nextTitle.xp - title.xp)) * 100
    : 100;

  return (
    <div className="shrink-0 border-b border-ink/10 bg-parchment/95 backdrop-blur-sm px-4 py-1.5">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-3 text-xs">
        {/* Title + XP */}
        <div className="flex items-center gap-2">
          <span>{title.icon}</span>
          <span className="font-bold text-ink hidden sm:inline">{title.title}</span>
          <div className="flex items-center gap-1.5">
            <div className="w-16 h-1.5 rounded-full bg-ink/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            <span className="text-ink-light font-mono text-xs">
              {state.xp} XP
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-ink-light">
          <span title="Creatures discovered">
            🔍 {discoveryCount}/{totalCreatures}
          </span>
          <span title="Creatures contained">
            🛡️ {containmentCount}/{totalCreatures}
          </span>
          {state.battleStats.currentStreak > 1 && (
            <span title="Current win streak" className="text-amber-600 font-bold">
              🔥 {state.battleStats.currentStreak}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
