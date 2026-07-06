"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { usePlayerProgress } from "@/lib/PlayerProgressContext";
import { allCreatures, regions } from "@/data";

export default function PlayerHUD() {
  const {
    state,
    title,
    nextTitle,
    discoveryCount,
    containmentCount,
    totalCreatures,
    discoveredSet,
    containedSet,
    isLoaded,
  } = usePlayerProgress();

  // Find a suggested next target
  const suggestion = useMemo(() => {
    // First priority: discovered but not contained (battle it!)
    const unbattled = allCreatures.find(
      (c) => discoveredSet.has(c.id) && !containedSet.has(c.id),
    );
    if (unbattled) {
      const r = regions.find((reg) => reg.id === unbattled.region);
      return { type: "battle" as const, name: unbattled.name.replace("THE ", ""), region: r?.name ?? "" };
    }
    // Second: just explore
    if (discoveryCount < totalCreatures) {
      return { type: "explore" as const, name: "", region: "" };
    }
    return null;
  }, [discoveredSet, containedSet, discoveryCount, totalCreatures]);

  // Auto-save indicator
  const [showSaved, setShowSaved] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevXP = useRef(state.xp);

  useEffect(() => {
    if (!isLoaded) return;
    // Only flash on meaningful changes (XP, discoveries, containments)
    if (prevXP.current !== state.xp && prevXP.current !== 0) {
      setShowSaved(true);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setShowSaved(false), 2000);
    }
    prevXP.current = state.xp;
  }, [state.xp, isLoaded]);

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
            <div className="w-20 h-1.5 rounded-full bg-ink/10 overflow-hidden" title={nextTitle ? `${xpToNext} XP to ${nextTitle.title}` : "Max rank!"}>
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${Math.min(xpProgress, 100)}%` }}
              />
            </div>
            <span className="text-ink-light font-mono text-xs">
              {state.xp} XP
            </span>
            {nextTitle && (
              <span className="text-ink/30 font-mono text-[10px] hidden md:inline">
                ({xpToNext} to {nextTitle.title})
              </span>
            )}
          </div>
        </div>

        {/* Suggested next action */}
        {suggestion && (
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] text-ink/40 italic">
            {suggestion.type === "battle" ? (
              <span>Next: Battle <strong className="text-ink/60 not-italic">{suggestion.name}</strong></span>
            ) : (
              <span>Explore to find new creatures...</span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-ink-light">
          <span title="Creatures discovered">
            🔍 {discoveryCount}/{totalCreatures}
          </span>
          <span title="Creatures defeated">
            🛡️ {containmentCount}/{totalCreatures}
          </span>
          {state.battleStats.currentStreak > 1 && (
            <span title="Current win streak" className="text-amber-600 font-bold">
              🔥 {state.battleStats.currentStreak}
            </span>
          )}
          {showSaved && (
            <span className="motion-static text-green-600/60 font-mono text-[10px] animate-[save-flash_2s_ease-out_forwards]">
              &#10003; Saved
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
