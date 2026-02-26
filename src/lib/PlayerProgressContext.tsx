"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { RegionId } from "@/data/types";
import { getCreaturesByRegion, regions, allCreatures } from "@/data";
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
  // Actions — synchronous checks, no race conditions
  discoverCreature: (id: string) => boolean;
  containCreature: (creature: Creature, xpMultiplier?: number) => number;
  recordBattleLoss: () => void;
  resetProgress: () => void;
}

const PlayerProgressContext = createContext<PlayerProgressValue | null>(null);

export function PlayerProgressProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlayerState>(DEFAULT_PLAYER_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Keep a ref to the current discovered/contained sets for synchronous checks
  const discoveredRef = useRef<Set<string>>(new Set());
  const containedRef = useRef<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as PlayerState;
        if (parsed.version === 1) {
          setState(parsed);
          discoveredRef.current = new Set(parsed.discovered);
          containedRef.current = new Set(parsed.contained);
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

  // Keep refs in sync with state
  useEffect(() => {
    discoveredRef.current = new Set(state.discovered);
    containedRef.current = new Set(state.contained);
  }, [state.discovered, state.contained]);

  const discoveredSet = useMemo(() => new Set(state.discovered), [state.discovered]);
  const containedSet = useMemo(() => new Set(state.contained), [state.contained]);

  const totalCreatures = useMemo(() => allCreatures.length, []);

  // FIX: Use ref for synchronous check, then setState
  const discoverCreature = useCallback((id: string): boolean => {
    // Synchronous check against ref — no race condition
    if (discoveredRef.current.has(id)) return false;
    // Optimistically update ref so rapid calls don't double-fire
    discoveredRef.current.add(id);
    setState((prev) => {
      if (prev.discovered.includes(id)) return prev;
      return {
        ...prev,
        discovered: [...prev.discovered, id],
        xp: prev.xp + XP_DISCOVERY,
      };
    });
    return true;
  }, []);

  const containCreature = useCallback((creature: Creature, xpMultiplier = 1): number => {
    if (containedRef.current.has(creature.id)) return 0;
    containedRef.current.add(creature.id);
    const xpEarned = Math.round(calculateContainmentXP(creature) * xpMultiplier);
    setState((prev) => {
      if (prev.contained.includes(creature.id)) return prev;
      const newContained = [...prev.contained, creature.id];
      const newContainedSet = new Set(newContained);
      let bonusXP = 0;

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
    discoveredRef.current = new Set();
    containedRef.current = new Set();
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
