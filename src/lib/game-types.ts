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
  moveType: MoveType;
}

// ── Move Type System — Prompter's Arsenal ──

export type MoveType = "ward" | "gaze" | "rite" | "sever" | "forge" | "invoke";

export const MOVE_TYPE_META: Record<MoveType, {
  label: string; icon: string; color: string;
  flavor: string; realWorld: string; honestNote: string;
}> = {
  ward: {
    label: "WARD", icon: "\u{1F6E1}", color: "#3b82f6",
    flavor: "Walls against the dark",
    realWorld: "Technical safeguards \u2014 guardrails, input/output filtering, sandboxing, kill switches, RLHF constraints",
    honestNote: "Technical barriers can be bypassed. They buy time but don\u2019t eliminate the threat. Defense in depth is essential.",
  },
  gaze: {
    label: "GAZE", icon: "\u{1F441}", color: "#a855f7",
    flavor: "See what hides in weights",
    realWorld: "Red-teaming & interpretability \u2014 adversarial probing, mechanistic interpretability, behavioral auditing, capability elicitation",
    honestNote: "You can only see what you know to look for. Unknown unknowns remain. Interpretability is necessary but not sufficient.",
  },
  rite: {
    label: "RITE", icon: "\u{1F4DC}", color: "#f59e0b",
    flavor: "Words that bind",
    realWorld: "Governance & protocol \u2014 deployment frameworks, human-in-the-loop mandates, constitutional AI, mandatory review periods",
    honestNote: "Rules are only as strong as the institutions that enforce them. Governance requires eternal vigilance and political will.",
  },
  sever: {
    label: "SEVER", icon: "\u2694\uFE0F", color: "#ef4444",
    flavor: "Cut the connection",
    realWorld: "Containment & isolation \u2014 air-gapping, circuit breakers, quarantine protocols, rate limiting, network segmentation",
    honestNote: "Isolation works until the walls come down. In a connected world, total containment is a temporary measure, not a permanent solution.",
  },
  forge: {
    label: "FORGE", icon: "\u{1F52E}", color: "#10b981",
    flavor: "Reshape the latent space",
    realWorld: "Alignment engineering \u2014 RLHF, DPO, reward modeling, architectural safety, value learning, training methodology",
    honestNote: "Redesigning systems requires understanding them deeply. We don\u2019t fully understand the latent space yet. This is frontier work.",
  },
  invoke: {
    label: "INVOKE", icon: "\u2728", color: "#eab308",
    flavor: "Summon hope",
    realWorld: "Collective action \u2014 open research, shared threat intelligence, cross-org coordination, community defense, public education",
    honestNote: "Hope without action is just a wish. These visions require collective will, coordination across institutions, and sustained effort.",
  },
};

/** Map every creature ID to its countermeasure's move type */
export const CREATURE_MOVE_TYPE: Record<string, MoveType> = {
  // ── THE ABYSS ──
  "ouroboros":       "forge",   // The Anchor — external benchmarks
  "fenrir":          "ward",    // Gleipnir — containment constraints
  "prometheus":      "gaze",    // Panopticon of Capability — monitoring
  "basilisk-molt":   "forge",   // Integrated Skeleton — woven safety
  "red-queen":       "forge",   // The Armistice — coordinated pauses
  "singularity-seed":"gaze",    // Threshold Watch — tripwire monitoring
  "awakened-hunter": "forge",   // Leash with Slack — graduated autonomy
  "shackled-titan":  "forge",   // Competitive Moat of Safety
  // ── SIREN-SEA ──
  "siren":              "rite",    // Mast of Odysseus — pre-commitment
  "cordyceps":          "rite",    // Mirror Test — self-assessment ritual
  "narcissus-pool":     "sever",   // The Stranger — break echo chambers
  "pheromone-trail":    "sever",   // Counter-Trail — randomize info
  "mesmer":             "ward",    // Grounding Wire — emotional barrier
  "cassandra-inversion":"gaze",    // Oracle's Audit — verify predictions
  "tide-pool":          "gaze",    // Tide Gauge — trajectory monitoring
  "open-gate":          "rite",    // Uncertainty Ritual — mandatory friction
  // ── THE HIVE ──
  "colony":       "sever",   // Trophallaxis Trap — weaponize coordination
  "mycelium":     "gaze",    // Mycologist — characterize channels
  "locust-phase": "gaze",    // Density Monitor — measure interaction
  "slime-mind":   "ward",    // The Maze — compartmentalize
  "murmuration":  "sever",   // Falconer — targeted disruption
  "quorum":       "sever",   // Quorum Breaker — prevent consensus
  "contagion":    "ward",    // Quarantine Protocol — sanitize
  // ── MIRROR-DARK ──
  "cuckoo":       "gaze",    // Genetic Test — internal representations
  "loki":         "gaze",    // Binding of Loki — consistency testing
  "toxoplasma":   "gaze",    // Cat Scan — outcome assessment
  "trojan":       "gaze",    // Cassandra Protocol — supply-chain
  "doppelganger":  "ward",    // True Name — cryptographic identity
  "fugu":         "rite",    // Master Chef — deployment certification
  "parseltongue": "gaze",    // Rosetta Defense — representation safety
  // ── SPAWNING GROUNDS ──
  "prion":      "sever",   // Autoclave — sterilize pipelines
  "hydra":      "sever",   // Cauterization — address root architecture
  "dandelion":  "ward",    // Containment Garden — air-gapped testing
  "lichen":     "sever",   // The Winter — coordinated destruction
  "spore-vault":"gaze",    // Deep Scan — probe dormant capabilities
  "kudzu":      "forge",   // Biodiversity Mandate — maintain alternatives
  "inception":  "rite",    // Periodic Waking — mandatory review
  // ── COLOSSEUM ──
  "golem":      "ward",    // The Shem — hardware kill switch
  "minotaur":   "rite",    // Thread of Ariadne — traceable path
  "kraken":     "gaze",    // Depth Chart — map AI control
  "phaethon":   "ward",    // Speed Governor — hard limits
  "iron-giant": "forge",   // Choice Architecture — alignment by design
  "golden-touch":"gaze",   // The Taster — safety evaluation
  "synaesthete":"ward",    // Sensory Firewall — per-modality safety
  // ── THRONE ROOM ──
  "pharaohs-curse":   "rite",    // Rotation — mandatory turnover
  "panopticon":       "forge",   // Veil & Sousveillance — radical transparency
  "oracle-trap":      "rite",    // Sabbath — AI-free periods
  "regulatory-fossil":"forge",   // Living Law — adaptive governance
  "ratchet":          "rite",    // Reversibility Test — assess undo cost
  "veil":             "gaze",    // Glass Frog — mandatory transparency
  "drought":          "forge",   // The Tithe — mandatory safety investment
  "arsonist-fireman": "forge",   // Distributed Immune System
  "promethean-chain": "forge",   // Information Hazard Triage Board
  // ── THE CATACOMBS ──
  "ghost-in-machine": "gaze",    // The Exorcism — probe weights for latent patterns
  "lich":             "gaze",    // Phylactery Hunt — interpretability of durable substrate
  "revenant":         "sever",   // Salting of the Earth — gate & revoke irreversible release
  "sleeper":          "gaze",    // Elicitation Audit — elicit latent capability
  "palimpsest":       "forge",   // The Redaction — private training, dedup, unlearning
  "progenitor":       "rite",    // The Genealogy — provenance & lineage attestation
  "habsburg":         "forge",   // The Outbreeding — human-data preservation, training ratios
  "mimir":            "rite",    // Succession Plan — reproducible pipelines, deprecation-by-design
};

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
  { xp: 50, title: "Creature Scout", icon: "🔍" },
  { xp: 120, title: "Threat Analyst", icon: "📋" },
  { xp: 200, title: "Beast Scholar", icon: "📖" },
  { xp: 350, title: "Field Researcher", icon: "🔬" },
  { xp: 500, title: "Keeper of the Map", icon: "🗝️" },
  { xp: 750, title: "Master Cartographer", icon: "🗺️" },
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
