import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/submissions
 *
 * Receives community-submitted threat creature proposals.
 * In production, this would persist to a database and trigger
 * the cartographer review pipeline.
 *
 * For now, validates and echoes back the submission.
 */

interface SubmissionBody {
  proposedName: string;
  description: string;
  mythicParallel?: string;
  naturalAnalogue?: string;
  evidenceLinks?: string[];
  suggestedRegion: string;
  suggestedThreatClass: string;
  estimatedLikelihood: number;
  estimatedImpact: number;
  submitterHandle?: string;
}

const VALID_REGIONS = [
  "abyss",
  "siren-sea",
  "hive",
  "mirror-dark",
  "spawning-grounds",
  "colosseum",
  "throne-room",
];

export async function POST(request: NextRequest) {
  try {
    const body: SubmissionBody = await request.json();

    // Validate required fields
    if (!body.proposedName || body.proposedName.trim().length < 2) {
      return NextResponse.json(
        { error: "proposedName is required (min 2 characters)" },
        { status: 400 },
      );
    }

    if (!body.description || body.description.trim().length < 20) {
      return NextResponse.json(
        { error: "description is required (min 20 characters)" },
        { status: 400 },
      );
    }

    if (!VALID_REGIONS.includes(body.suggestedRegion)) {
      return NextResponse.json(
        { error: `suggestedRegion must be one of: ${VALID_REGIONS.join(", ")}` },
        { status: 400 },
      );
    }

    if (
      typeof body.estimatedLikelihood !== "number" ||
      body.estimatedLikelihood < 1 ||
      body.estimatedLikelihood > 5
    ) {
      return NextResponse.json(
        { error: "estimatedLikelihood must be 1-5" },
        { status: 400 },
      );
    }

    if (
      typeof body.estimatedImpact !== "number" ||
      body.estimatedImpact < 1 ||
      body.estimatedImpact > 5
    ) {
      return NextResponse.json(
        { error: "estimatedImpact must be 1-5" },
        { status: 400 },
      );
    }

    // Sanitize evidence links
    const evidenceLinks = (body.evidenceLinks ?? []).filter(
      (link) => {
        try {
          new URL(link);
          return true;
        } catch {
          return false;
        }
      },
    );

    const submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      proposedName: body.proposedName.trim(),
      description: body.description.trim(),
      mythicParallel: body.mythicParallel?.trim() || undefined,
      naturalAnalogue: body.naturalAnalogue?.trim() || undefined,
      evidenceLinks,
      suggestedRegion: body.suggestedRegion,
      suggestedThreatClass: body.suggestedThreatClass,
      estimatedLikelihood: body.estimatedLikelihood,
      estimatedImpact: body.estimatedImpact,
      submitterHandle: body.submitterHandle?.trim() || undefined,
      status: "pending",
      votes: 0,
    };

    // In production: save to DB, notify cartographers, etc.
    // For now, return success with the created submission

    return NextResponse.json(
      {
        success: true,
        submission,
        message:
          "Submission received. The cartographers will review your sighting.",
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "NATURALIS FUTURA Submission Portal",
    endpoints: {
      "POST /api/submissions": "Submit a new creature proposal",
    },
    schema: {
      proposedName: "string (required)",
      description: "string (required, min 20 chars)",
      mythicParallel: "string (optional)",
      naturalAnalogue: "string (optional)",
      evidenceLinks: "string[] (optional, valid URLs)",
      suggestedRegion: `one of: ${VALID_REGIONS.join(", ")}`,
      suggestedThreatClass: "string (required)",
      estimatedLikelihood: "number 1-5 (required)",
      estimatedImpact: "number 1-5 (required)",
      submitterHandle: "string (optional)",
    },
  });
}
