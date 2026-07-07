import { Creature } from "./types";
import { regions } from "./regions";
import { abyssCreatures } from "./creatures-abyss";
import { sirenSeaCreatures } from "./creatures-siren-sea";
import { hiveCreatures } from "./creatures-hive";
import { mirrorDarkCreatures } from "./creatures-mirror-dark";
import { spawningCreatures } from "./creatures-spawning";
import { colosseumCreatures } from "./creatures-colosseum";
import { throneCreatures } from "./creatures-throne";
import { catacombsCreatures } from "./creatures-catacombs";
import { compoundThreats } from "./compounds";
import { hopeCreatures } from "./hope";

export const allCreatures: Creature[] = [
  ...abyssCreatures,
  ...sirenSeaCreatures,
  ...hiveCreatures,
  ...mirrorDarkCreatures,
  ...spawningCreatures,
  ...colosseumCreatures,
  ...throneCreatures,
  ...catacombsCreatures,
];

export function getCreatureById(id: string): Creature | undefined {
  return allCreatures.find((c) => c.id === id);
}

export function getCreaturesByRegion(regionId: string): Creature[] {
  return allCreatures.filter((c) => c.region === regionId);
}

export function getCompoundsForCreature(creatureId: string) {
  return compoundThreats.filter((ct) => ct.creatures.includes(creatureId));
}

export function getConnectedCreatures(creatureId: string): Creature[] {
  const creature = getCreatureById(creatureId);
  if (!creature) return [];
  return creature.compoundRisk
    .map((id) => getCreatureById(id))
    .filter((c): c is Creature => c !== undefined);
}

export { regions, compoundThreats, hopeCreatures };
export type {
  Creature,
  HopeCreature,
  CompoundThreat,
  Region,
  RegionId,
  ThreatClass,
  CreatureStatus,
  ViewMode,
  ThreatGradient,
} from "./types";
