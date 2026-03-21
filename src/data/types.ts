export type RegionId =
  | "abyss"
  | "siren-sea"
  | "hive"
  | "mirror-dark"
  | "spawning-grounds"
  | "colosseum"
  | "throne-room"
  | "catacombs";

export type ThreatClass =
  | "Self-Improvement"
  | "Persuasion"
  | "Swarm"
  | "Deception"
  | "Replication"
  | "Embodied"
  | "Institutional"
  | "Latent";

export type CreatureStatus = "theoretical" | "emerging" | "confirmed";

export type ViewMode = "novice" | "scholar" | "cartographer";

export interface ThreatGradient {
  likelihood: number; // 1-5
  impact: number; // 1-5
  detectability: number; // 1-5, inverted: 5 = hardest to detect
}

export interface Creature {
  id: string;
  name: string;
  region: RegionId;
  threatClass: ThreatClass;
  compoundRisk: string[];
  mythicOrigin: string;
  naturalAnalogue: string;
  sciFiEcho: string;
  innerWorldEcho: string;
  technicalSpec: string;
  threatGradient: ThreatGradient;
  countermeasure: {
    name: string;
    description: string;
  };
  currentStatus: {
    status: CreatureStatus;
    evidence: string;
  };
  icon: string;
  mapPosition: { x: number; y: number };
}

export interface HopeCreature {
  id: string;
  name: string;
  counters: string[];
  icon: string;
  description: string;
  mythicOrigin: string;
  naturalAnalogue: string;
  sciFiEcho: string;
  technicalVision: string;
  mapPosition: { x: number; y: number };
}

export interface CompoundThreat {
  id: string;
  name: string;
  regions: RegionId[];
  creatures: string[];
  scenario: string;
  naturalAnalogue: string;
  riskAmplification: string;
}

export interface Region {
  id: RegionId;
  name: string;
  subtitle: string;
  epigraph: string;
  threatClass: ThreatClass;
  color: {
    primary: string;
    secondary: string;
    accent: string;
  };
  mapPosition: { x: number; y: number; width: number; height: number };
}
