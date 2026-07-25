/**
 * validate-submission.ts — rules for a community-proposed creature.
 *
 * These checks previously lived in `POST /api/submissions`, which nothing in
 * the UI ever called. Moving them here makes them run where they are actually
 * useful — in the submission form, before the reader hits send — and lets the
 * site build as a static export with no server behind it.
 *
 * If a real submissions backend is added later, import this module from the
 * route handler so both sides validate identically.
 */

export const VALID_REGIONS = [
  "abyss",
  "siren-sea",
  "hive",
  "mirror-dark",
  "spawning-grounds",
  "colosseum",
  "throne-room",
  "catacombs",
] as const;

export interface SubmissionDraft {
  proposedName: string;
  description: string;
  suggestedRegion: string;
  estimatedLikelihood: number;
  estimatedImpact: number;
  evidenceLinks?: string[];
}

/** Keeps only syntactically valid URLs — the rest are dropped, not rejected. */
export function sanitizeEvidenceLinks(links: string[] | undefined): string[] {
  return (links ?? []).filter((link) => {
    try { new URL(link); return true; } catch { return false; }
  });
}

/** Returns a reader-facing message, or null when the draft is acceptable. */
export function validateSubmission(d: SubmissionDraft): string | null {
  if (!d.proposedName || d.proposedName.trim().length < 2) {
    return "A creature needs a name — at least two characters.";
  }
  if (!d.description || d.description.trim().length < 20) {
    return "Describe the threat in at least 20 characters, so a cartographer can place it.";
  }
  if (!VALID_REGIONS.includes(d.suggestedRegion as (typeof VALID_REGIONS)[number])) {
    return `Choose a territory: ${VALID_REGIONS.join(", ")}.`;
  }
  if (typeof d.estimatedLikelihood !== "number" || d.estimatedLikelihood < 1 || d.estimatedLikelihood > 5) {
    return "Likelihood must be rated 1 to 5.";
  }
  if (typeof d.estimatedImpact !== "number" || d.estimatedImpact < 1 || d.estimatedImpact > 5) {
    return "Impact must be rated 1 to 5.";
  }
  return null;
}
