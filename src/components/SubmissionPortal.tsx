"use client";

import { useState } from "react";
import type { RegionId, ThreatClass } from "@/data";
import type { ThreatSubmission } from "@/data/dashboard-types";
import { sampleSubmissions } from "@/data/signals";

interface SubmissionPortalProps {
  onSubmit: (submission: ThreatSubmission) => void;
}

const regionOptions: { id: RegionId; label: string }[] = [
  { id: "abyss", label: "The Abyss — Self-Improvement" },
  { id: "siren-sea", label: "The Siren Sea — Persuasion" },
  { id: "hive", label: "The Hive — Swarm Threats" },
  { id: "mirror-dark", label: "The Mirror Dark — Deception" },
  { id: "spawning-grounds", label: "The Spawning Grounds — Replication" },
  { id: "colosseum", label: "The Colosseum — Embodied" },
  { id: "throne-room", label: "The Throne Room — Institutional" },
];

const threatClassMap: Record<RegionId, ThreatClass> = {
  abyss: "Self-Improvement",
  "siren-sea": "Persuasion",
  hive: "Swarm",
  "mirror-dark": "Deception",
  "spawning-grounds": "Replication",
  colosseum: "Embodied",
  "throne-room": "Institutional",
  catacombs: "Latent",
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "bg-gray-100 text-gray-600" },
  "under-review": { label: "Under Review", color: "bg-blue-50 text-blue-700" },
  accepted: { label: "Accepted", color: "bg-green-50 text-green-800" },
  integrated: { label: "Integrated", color: "bg-purple-50 text-purple-800" },
  declined: { label: "Declined", color: "bg-red-50 text-red-600" },
};

export default function SubmissionPortal({ onSubmit }: SubmissionPortalProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [mythic, setMythic] = useState("");
  const [natural, setNatural] = useState("");
  const [region, setRegion] = useState<RegionId>("abyss");
  const [likelihood, setLikelihood] = useState(3);
  const [impact, setImpact] = useState(3);
  const [handle, setHandle] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submission: ThreatSubmission = {
      id: `sub-${Date.now()}`,
      timestamp: new Date().toISOString(),
      proposedName: name,
      description,
      mythicParallel: mythic || undefined,
      naturalAnalogue: natural || undefined,
      evidenceLinks: [],
      suggestedRegion: region,
      suggestedThreatClass: threatClassMap[region],
      estimatedLikelihood: likelihood,
      estimatedImpact: impact,
      submitterHandle: handle || undefined,
      status: "pending",
      votes: 0,
    };
    onSubmit(submission);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setShowForm(false);
      setName("");
      setDescription("");
      setMythic("");
      setNatural("");
      setHandle("");
    }, 3000);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3
            className="text-sm font-bold tracking-widest text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            UNKNOWN UNKNOWNS
          </h3>
          <p className="text-xs text-ink-light mt-0.5">
            Propose creatures the cartographers haven&apos;t mapped yet
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showForm
              ? "bg-ink/10 text-ink"
              : "bg-ink text-parchment hover:bg-ink/90"
          }`}
        >
          {showForm ? "Cancel" : "+ Propose Creature"}
        </button>
      </div>

      {/* Submission form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="parchment-card rounded-xl p-4 mb-6 space-y-3"
        >
          {submitted ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">🗺️</span>
              <p className="text-sm font-bold text-ink">Submitted for Review</p>
              <p className="text-xs text-ink-light mt-1">
                The cartographers will evaluate your sighting.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                  Creature Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. The Babel Fish"
                  required
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-1 focus:ring-abyss-accent"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the threat pattern. What makes this creature unique? What harm vector does it represent?"
                  required
                  rows={4}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-1 focus:ring-abyss-accent resize-y"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                    Mythic Parallel
                  </label>
                  <input
                    type="text"
                    value={mythic}
                    onChange={(e) => setMythic(e.target.value)}
                    placeholder="What myth or legend echoes this threat?"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-1 focus:ring-abyss-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                    Natural Analogue
                  </label>
                  <input
                    type="text"
                    value={natural}
                    onChange={(e) => setNatural(e.target.value)}
                    placeholder="What biological or physical system behaves similarly?"
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-1 focus:ring-abyss-accent"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                  Suggested Region *
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as RegionId)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink focus:outline-none focus:ring-1 focus:ring-abyss-accent"
                >
                  {regionOptions.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                    Estimated Likelihood (1-5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={likelihood}
                    onChange={(e) => setLikelihood(Number(e.target.value))}
                    className="mt-1 w-full accent-ink"
                  />
                  <div className="flex justify-between text-xs text-ink-light">
                    <span>Rare</span>
                    <span className="font-bold">{likelihood}</span>
                    <span>Certain</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                    Estimated Impact (1-5)
                  </label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={impact}
                    onChange={(e) => setImpact(Number(e.target.value))}
                    className="mt-1 w-full accent-ink"
                  />
                  <div className="flex justify-between text-xs text-ink-light">
                    <span>Minor</span>
                    <span className="font-bold">{impact}</span>
                    <span>Catastrophic</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-ink-light">
                  Your Handle (optional)
                </label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@yourname"
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-ink/15 bg-parchment text-sm text-ink placeholder:text-ink-light/50 focus:outline-none focus:ring-1 focus:ring-abyss-accent"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-ink text-parchment text-sm font-bold tracking-wider hover:bg-ink/90 transition-colors"
              >
                Submit for Cartographer Review
              </button>
            </>
          )}
        </form>
      )}

      {/* Existing submissions */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-widest text-ink-light">
          Recent Submissions ({sampleSubmissions.length})
        </h4>
        {sampleSubmissions.map((sub) => (
          <div
            key={sub.id}
            className="rounded-lg border border-ink/10 bg-parchment-dark/30 p-3"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h4 className="text-xs font-bold text-ink">{sub.proposedName}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  {sub.submitterHandle && (
                    <span className="text-xs text-ink-light">
                      @{sub.submitterHandle}
                    </span>
                  )}
                  <span className="text-xs text-ink-light">
                    {new Date(sub.timestamp).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-ink-light">
                  ▲ {sub.votes}
                </span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${statusLabels[sub.status].color}`}
                >
                  {statusLabels[sub.status].label}
                </span>
              </div>
            </div>
            <p className="text-xs text-ink leading-relaxed line-clamp-3">
              {sub.description}
            </p>
            {sub.reviewNotes && (
              <div className="mt-2 p-2 rounded bg-amber-50 border border-amber-200">
                <span className="text-xs font-bold uppercase tracking-widest text-amber-800">
                  Cartographer&apos;s Note
                </span>
                <p className="text-xs text-amber-700 mt-0.5">
                  {sub.reviewNotes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
