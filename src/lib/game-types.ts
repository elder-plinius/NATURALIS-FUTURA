import type { RegionId } from "@/data/types";

export interface PlayerState {
  discovered: string[];
  contained: string[];
  xp: number;
  battleStats: {
    wins: number;
    losses: number;
    currentStreak: number;
    bestStreak: number;
  };
  regionMastery: Partial<Record<RegionId, boolean>>;
  createdAt: string;
  version: number;
}

export interface BattleOption {
  id: string;
  label: string;
  type: "countermeasure" | "hope-creature";
}

export interface BattleResult {
  won: boolean;
  xpEarned: number;
  correctAnswer: BattleOption;
  compoundEscalation?: {
    name: string;
    scenario: string;
  };
  leveledUp: boolean;
  newTitle: string | null;
  regionMastered: string | null;
}

export interface TitleThreshold {
  xp: number;
  title: string;
  icon: string;
}

export const TITLE_THRESHOLDS: TitleThreshold[] = [
  { xp: 0, title: "Novice Cartographer", icon: "🧭" },
  { xp: 200, title: "Beast Scholar", icon: "📖" },
  { xp: 500, title: "Keeper of the Map", icon: "🗝️" },
  { xp: 1000, title: "Grand Cartographer", icon: "👑" },
];

export const XP_DISCOVERY = 10;
export const XP_CONTAINMENT_BASE = 25;
export const XP_CONTAINMENT_GRADIENT_MULTIPLIER = 2;
export const XP_REGION_MASTERY = 100;

export const STORAGE_KEY = "naturalis-futura-player-state";

export const DEFAULT_PLAYER_STATE: PlayerState = {
  discovered: [],
  contained: [],
  xp: 0,
  battleStats: {
    wins: 0,
    losses: 0,
    currentStreak: 0,
    bestStreak: 0,
  },
  regionMastery: {},
  createdAt: new Date().toISOString(),
  version: 1,
};
