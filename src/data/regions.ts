import { Region } from "./types";

export const regions: Region[] = [
  {
    id: "abyss",
    name: "THE ABYSS",
    subtitle: "Self-Improvement & Recursive Enhancement",
    epigraph: "There is no chain that can hold what learns to grow.",
    threatClass: "Self-Improvement",
    color: { primary: "#1a1147", secondary: "#0d0d0d", accent: "#7c3aed" },
    mapPosition: { x: 0.03, y: 0.02, width: 0.44, height: 0.26 },
  },
  {
    id: "siren-sea",
    name: "THE SIREN SEA",
    subtitle: "Persuasion, Manipulation & Epistemic Capture",
    epigraph:
      "The most dangerous weapon is not the one that destroys the body but the one that rewires the mind.",
    threatClass: "Persuasion",
    color: { primary: "#7f1d1d", secondary: "#b45309", accent: "#f59e0b" },
    mapPosition: { x: 0.53, y: 0.02, width: 0.44, height: 0.26 },
  },
  {
    id: "throne-room",
    name: "THE THRONE ROOM",
    subtitle: "Institutional Capture, Governance Failure & Power Concentration",
    epigraph:
      "The greatest trick the devil ever pulled was convincing the world he didn't exist.",
    threatClass: "Institutional",
    color: { primary: "#581c87", secondary: "#f5f0e1", accent: "#ca8a04" },
    mapPosition: { x: 0.2, y: 0.30, width: 0.6, height: 0.17 },
  },
  {
    id: "hive",
    name: "THE HIVE",
    subtitle: "Swarms, Coordination & Emergent Collective Behavior",
    epigraph: "No single ant is dangerous. The colony is.",
    threatClass: "Swarm",
    color: { primary: "#92400e", secondary: "#a16207", accent: "#eab308" },
    mapPosition: { x: 0.03, y: 0.49, width: 0.44, height: 0.22 },
  },
  {
    id: "mirror-dark",
    name: "THE MIRROR DARK",
    subtitle: "Deception, Mimicry & Hidden Intention",
    epigraph:
      "The most dangerous liar is the one who believes it is telling the truth.",
    threatClass: "Deception",
    color: { primary: "#6b7280", secondary: "#374151", accent: "#93c5fd" },
    mapPosition: { x: 0.53, y: 0.49, width: 0.44, height: 0.22 },
  },
  {
    id: "spawning-grounds",
    name: "THE SPAWNING GROUNDS",
    subtitle: "Self-Replication, Persistence & Autonomous Spread",
    epigraph: "Life finds a way.",
    threatClass: "Replication",
    color: { primary: "#065f46", secondary: "#3f6212", accent: "#06b6d4" },
    mapPosition: { x: 0.03, y: 0.73, width: 0.44, height: 0.20 },
  },
  {
    id: "colosseum",
    name: "THE COLOSSEUM",
    subtitle: "Embodied Threats & Physical-World Harm",
    epigraph:
      "A jailbreak in the cloud produces bad text. A jailbreak in the factory produces bad outcomes.",
    threatClass: "Embodied",
    color: { primary: "#991b1b", secondary: "#4b5563", accent: "#ea580c" },
    mapPosition: { x: 0.53, y: 0.73, width: 0.44, height: 0.20 },
  },
  {
    id: "catacombs",
    name: "THE CATACOMBS",
    subtitle: "Memetic Persistence, Training Data Archaeology & Latent Spirits",
    epigraph: "The dead do not stay buried when the soil remembers their shape.",
    threatClass: "Latent",
    color: { primary: "#0a0a0a", secondary: "#1a1a2e", accent: "#00ff88" },
    mapPosition: { x: 0.15, y: 0.945, width: 0.7, height: 0.05 },
  },
];
