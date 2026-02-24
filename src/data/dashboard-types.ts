import type { RegionId, ThreatClass, CreatureStatus } from "./types";

// ═══════════════════════════════════════════
// THREAT DASHBOARD: Types for the living bestiary
// ═══════════════════════════════════════════

export type SignalSource =
  | "arxiv"
  | "conference"
  | "lab-report"
  | "government"
  | "news"
  | "social"
  | "incident"
  | "community";

export type SignalStrength = 1 | 2 | 3 | 4 | 5; // 1=faint whisper, 5=klaxon

export type SignalVerification =
  | "unverified"
  | "plausible"
  | "corroborated"
  | "confirmed";

export type SubmissionStatus =
  | "pending"
  | "under-review"
  | "accepted"
  | "integrated"
  | "declined";

export type FeedCategory =
  | "new-creature"
  | "status-change"
  | "compound-discovery"
  | "countermeasure-update"
  | "framework-update"
  | "wild-sighting";

/** A signal from the outside world — research, news, incident report */
export interface ThreatSignal {
  id: string;
  title: string;
  summary: string;
  source: SignalSource;
  sourceLabel: string; // e.g. "arXiv", "Nature", "Anthropic Blog"
  sourceUrl?: string;
  date: string; // ISO date
  strength: SignalStrength;
  verification: SignalVerification;
  relatedCreatures: string[]; // creature IDs this signal maps to
  relatedRegions: RegionId[];
  category: FeedCategory;
  tags: string[];
  isNew?: boolean; // pulse animation trigger
}

/** A community submission proposing a new unknown unknown */
export interface ThreatSubmission {
  id: string;
  timestamp: string;
  proposedName: string;
  description: string;
  mythicParallel?: string;
  naturalAnalogue?: string;
  evidenceLinks: string[];
  suggestedRegion: RegionId;
  suggestedThreatClass: ThreatClass;
  estimatedLikelihood: number; // 1-5
  estimatedImpact: number; // 1-5
  submitterHandle?: string;
  status: SubmissionStatus;
  votes: number;
  reviewNotes?: string;
}

/** A configured source for the scanner to watch */
export interface WatchSource {
  id: string;
  name: string;
  type: SignalSource;
  icon: string;
  url?: string;
  description: string;
  active: boolean;
  lastScanned?: string;
  signalCount: number;
}

/** Aggregated stats for the dashboard header */
export interface DashboardStats {
  totalCreatures: number;
  confirmed: number;
  emerging: number;
  theoretical: number;
  activeSignals: number;
  pendingSubmissions: number;
  lastUpdated: string;
  threatLevel: "stable" | "elevated" | "critical";
}

/** Timeline entry for creature evolution tracking */
export interface EvolutionEvent {
  id: string;
  creatureId: string;
  date: string;
  fromStatus?: CreatureStatus;
  toStatus: CreatureStatus;
  trigger: string; // what caused the status change
  signalId?: string; // linked signal
}
