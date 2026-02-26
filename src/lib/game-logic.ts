import type { Creature, ViewMode } from "@/data/types";
import { getCreaturesByRegion, hopeCreatures, allCreatures, getCompoundsForCreature } from "@/data";
import type { BattleOption, BattleResult, TitleThreshold, MoveType } from "./game-types";
import {
  TITLE_THRESHOLDS,
  XP_DISCOVERY,
  XP_CONTAINMENT_BASE,
  XP_CONTAINMENT_GRADIENT_MULTIPLIER,
  XP_REGION_MASTERY,
  CREATURE_MOVE_TYPE,
} from "./game-types";

// ── Title & Level ──

export function getTitle(xp: number): TitleThreshold {
  let current = TITLE_THRESHOLDS[0];
  for (const t of TITLE_THRESHOLDS) {
    if (xp >= t.xp) current = t;
  }
  return current;
}

export function getNextTitle(xp: number): TitleThreshold | null {
  for (const t of TITLE_THRESHOLDS) {
    if (xp < t.xp) return t;
  }
  return null;
}

// ── Progress ──

export function getRegionProgress(regionId: string, discovered: Set<string>): number {
  const creatures = getCreaturesByRegion(regionId);
  if (creatures.length === 0) return 0;
  const found = creatures.filter((c) => discovered.has(c.id)).length;
  return Math.round((found / creatures.length) * 100);
}

export function checkRegionMastery(regionId: string, contained: Set<string>): boolean {
  const creatures = getCreaturesByRegion(regionId);
  return creatures.length > 0 && creatures.every((c) => contained.has(c.id));
}

export function getOverallDiscovery(discovered: Set<string>): number {
  return Math.round((discovered.size / allCreatures.length) * 100);
}

export function getOverallContainment(contained: Set<string>): number {
  return Math.round((contained.size / allCreatures.length) * 100);
}

// ── XP ──

export function calculateContainmentXP(creature: Creature): number {
  const { likelihood, impact, detectability } = creature.threatGradient;
  return XP_CONTAINMENT_BASE + (likelihood + impact + detectability) * XP_CONTAINMENT_GRADIENT_MULTIPLIER;
}

/** Streak-based XP multiplier — reward consecutive victories */
export function getStreakMultiplier(currentStreak: number): number {
  if (currentStreak >= 5) return 2.0;
  if (currentStreak >= 3) return 1.5;
  if (currentStreak >= 2) return 1.25;
  return 1.0;
}

/** Get the move type for a creature's countermeasure */
export function getMoveTypeForCreature(creatureId: string): MoveType {
  return CREATURE_MOVE_TYPE[creatureId] ?? "forge";
}

// ── Battle Answer Generation ──

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getHopeCreatureFor(creatureId: string) {
  return hopeCreatures.find((h) => h.counters.includes(creatureId)) ?? null;
}

export function generateBattleOptions(
  creature: Creature,
  viewMode: ViewMode,
): { options: BattleOption[]; correctIndex: number } {
  // Determine correct answer
  const hopeMatch = getHopeCreatureFor(creature.id);
  const useHope = hopeMatch && Math.random() > 0.5;

  const correctAnswer: BattleOption = useHope
    ? { id: hopeMatch!.id, label: hopeMatch!.name, type: "hope-creature", moveType: "invoke" }
    : { id: creature.id, label: creature.countermeasure.name, type: "countermeasure", moveType: getMoveTypeForCreature(creature.id) };

  const optionCount = viewMode === "novice" ? 3 : 4;

  // Build wrong answer pool
  const wrongPool: BattleOption[] = [];

  // Add other creatures' countermeasures
  for (const c of allCreatures) {
    if (c.id === creature.id) continue;
    if (c.countermeasure.name === correctAnswer.label) continue;
    wrongPool.push({
      id: c.id,
      label: c.countermeasure.name,
      type: "countermeasure",
      moveType: getMoveTypeForCreature(c.id),
    });
  }

  // Add non-matching hope creatures
  for (const h of hopeCreatures) {
    if (h.id === correctAnswer.id) continue;
    if (h.counters.includes(creature.id)) continue;
    wrongPool.push({
      id: h.id,
      label: h.name,
      type: "hope-creature",
      moveType: "invoke" as MoveType,
    });
  }

  const wrongAnswers = shuffle(wrongPool).slice(0, optionCount - 1);
  const options = shuffle([correctAnswer, ...wrongAnswers]);
  const correctIndex = options.findIndex((o) => o.label === correctAnswer.label);

  return { options, correctIndex };
}

// ── Battle Resolution ──

export function resolveBattle(
  creature: Creature,
  selectedIndex: number,
  correctIndex: number,
  options: BattleOption[],
  currentXP: number,
): BattleResult {
  const won = selectedIndex === correctIndex;
  const xpEarned = won ? calculateContainmentXP(creature) : 0;
  const newXP = currentXP + xpEarned;

  const oldTitle = getTitle(currentXP);
  const newTitle = getTitle(newXP);
  const leveledUp = newTitle.title !== oldTitle.title;

  // Get compound escalation for wrong answers
  let compoundEscalation: BattleResult["compoundEscalation"] = undefined;
  if (!won) {
    const compounds = getCompoundsForCreature(creature.id);
    if (compounds.length > 0) {
      const compound = compounds[Math.floor(Math.random() * compounds.length)];
      compoundEscalation = {
        name: compound.name,
        scenario: compound.scenario,
      };
    }
  }

  return {
    won,
    xpEarned,
    correctAnswer: options[correctIndex],
    compoundEscalation,
    leveledUp,
    newTitle: leveledUp ? newTitle.title : null,
    regionMastered: null, // Caller checks this after updating state
  };
}

// ── Cartographer Free-Text Matching ──

export function fuzzyMatchCountermeasure(input: string, creature: Creature): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/^the\s+/, "").trim();
  const normalInput = normalize(input);
  const correctName = normalize(creature.countermeasure.name);

  if (normalInput === correctName) return true;
  if (correctName.includes(normalInput) && normalInput.length >= 3) return true;
  if (normalInput.includes(correctName)) return true;

  // Check hope creature match
  const hope = getHopeCreatureFor(creature.id);
  if (hope) {
    const hopeName = normalize(hope.name);
    if (normalInput === hopeName) return true;
    if (hopeName.includes(normalInput) && normalInput.length >= 3) return true;
  }

  return false;
}
