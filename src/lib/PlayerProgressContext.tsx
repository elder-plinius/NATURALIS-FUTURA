"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import type { RegionId } from "@/data/types";
import { getCreaturesByRegion, regions } from "@/data";
import type { PlayerState } from "./game-types";
import {
  DEFAULT_PLAYER_STATE,
  STORAGE_KEY,
  XP_DISCOVERY,
  XP_REGION_MASTERY,
} from "./game-types";
import { calculateContainmentXP, getTitle, getNextTitle, checkRegionMastery } from "./game-logic";
import type { Creature } from "@/data/types";

interface PlayerProgressValue {
  state: PlayerState;
  discoveredSet: Set<string>;
  containedSet: Set<string>;
  isLoaded: boolean;
  // Derived
  title: ReturnType<typeof getTitle>;
  nextTitle: ReturnType<typeof getNextTitle>;
  discoveryCount: number;
  containmentCount: number;
  totalCreatures: number;
  // Actions
  discoverCreature: (id: string) => boolean; // returns true if newly discovered
  containCreature: (creature: Creature) => number; // returns XP earned
  recordBattleLoss: () => void;
  resetProgress: () => void;
}

const PlayerProgressContext = createContext<PlayerProgressValue | null>(null);

export function PlayerProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(DEFAULT_PLAYER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PlayerState;
        if (parsed.version === 1) {
          setState(parsed);
        }
      }
    } catch {
      // Corrupted storage, use defaults
    }
    setIsLoaded(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, isLoaded]);

  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);
  const containedSet = useMemo(() => new Set(state.contained), [state.contained]);

  const totalCreatures = useMemo(() => {
    let count = 0;
    for (const r of regions) {
      count += getCreaturesByRegion(r.id).length;
    }
    return count;
  }, []);

  const discoverCreature = useCallback((id: string): boolean => {
    let isNew = false;
    setState((prev) => {
      if (prev.discovered.includes(id)) return prev;
      isNew = true;
      return {
        ...prev,
        discovered: [...prev.discovered, id],
        xp: prev.xp + XP_DISCOVERY,
      };
    });
    return isNew;
  }, []);

  const containCreature = useCallback((creature: Creature): number => {
    const xpEarned = calculateContainmentXP(creature);
    setState((prev) => {
      if (prev.contained.includes(creature.id)) return prev;
      const newContained = [...prev.contained, creature.id];
      const newContainedSet = new Set(newContained);
      let bonusXP = 0;

      // Check region mastery
      const newMastery = { ...prev.regionMastery };
      const regionId = creature.region as RegionId;
      if (!newMastery[regionId] && checkRegionMastery(regionId, newContainedSet)) {
        newMastery[regionId] = true;
        bonusXP = XP_REGION_MASTERY;
      }

      return {
        ...prev,
        contained: newContained,
        xp: prev.xp + xpEarned + bonusXP,
        battleStats: {
          ...prev.battleStats,
          wins: prev.battleStats.wins + 1,
          currentStreak: prev.battleStats.currentStreak + 1,
          bestStreak: Math.max(prev.battleStats.bestStreak, prev.battleStats.currentStreak + 1),
        },
        regionMastery: newMastery,
      };
    });
    return xpEarned;
  }, []);

  const recordBattleLoss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      battleStats: {
        ...prev.battleStats,
        losses: prev.battleStats.losses + 1,
        currentStreak: 0,
      },
    }));
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = { ...DEFAULT_PLAYER_STATE, createdAt: new Date().toISOString() };
    setState(fresh);
  }, []);

  const value = useMemo<PlayerProgressValue>(() => ({
    state,
    discoveredSet,
    containedSet,
    isLoaded,
    title: getTitle(state.xp),
    nextTitle: getNextTitle(state.xp),
    discoveryCount: state.discovered.length,
    containmentCount: state.contained.length,
    totalCreatures,
    discoverCreature,
    containCreature,
    recordBattleLoss,
    resetProgress,
  }), [state, discoveredSet, containedSet, isLoaded, totalCreatures, discoverCreature, containCreature, recordBattleLoss, resetProgress]);

  return (
    <PlayerProgressContext.Provider value={value}>
      {children}
    </PlayerProgressContext.Provider>
  );
}

export function usePlayerProgress(): PlayerProgressValue {
  const ctx = useContext(PlayerProgressContext);
  if (!ctx) throw new Error("usePlayerProgress must be used within PlayerProgressProvider");
  return ctx;
}
