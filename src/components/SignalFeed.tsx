"use client";

import { useState } from "react";
import { getCreatureById } from "@/data";
import type { ThreatSignal, SignalSource, SignalVerification } from "@/data/dashboard-types";

interface SignalFeedProps {
  signals: ThreatSignal[];
  onSelectCreature: (creatureId: string) => void;
}

const sourceIcons: Record<SignalSource, string> = {
  arxiv: "📄",
  conference: "🎓",
  "lab-report": "🔬",
  government: "🏛️",
  news: "📰",
  social: "💬",
  incident: "⚠️",
  community: "🌐",
};

// Iron-gall pigments — one ink per verification tier, matching StatusSeal.
const verificationInks: Record<SignalVerification, string> = {
  unverified: "#57534e",
  plausible: "#334e68",
  corroborated: "#92400e",
  confirmed: "#14532d",
};

const strengthBars = (strength: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <div
      key={i}
      className={`w-1 rounded-full transition-all ${
        i < strength
          ? strength >= 4
            ? "bg-red-500 h-full"
            : strength >= 3
              ? "bg-amber-500 h-full"
              : "bg-green-600 h-full"
          : "bg-ink/10 h-full"
      }`}
    />
  ));
};

export default function SignalFeed({ signals, onSelectCreature }: SignalFeedProps) {
  const [sourceFilter, setSourceFilter] = useState<SignalSource | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered =
    sourceFilter === "all"
      ? signals
      : signals.filter((s) => s.source === sourceFilter);

  // Sort by date descending, new signals first
  const sorted = [...filtered].sort((a, b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const sources: (SignalSource | "all")[] = [
    "all",
    "lab-report",
    "arxiv",
    "conference",
    "government",
    "incident",
    "social",
    "community",
  ];

  return (
    <div>
      {/* Source filter bar */}
      <div className="flex flex-wrap gap-1 mb-4">
        {sources.map((src) => (
          <button
            key={src}
            onClick={() => setSourceFilter(src)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              sourceFilter === src
                ? "bg-ink text-parchment"
                : "text-ink-light hover:bg-ink/5"
            }`}
          >
            {src !== "all" && <span>{sourceIcons[src]}</span>}
            <span>
              {src === "all" ? "All" : src.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </button>
        ))}
      </div>

      {/* Signal count */}
      <p className="text-xs text-ink-light mb-3">
        {sorted.length} signal{sorted.length !== 1 ? "s" : ""}
        {sourceFilter !== "all" ? ` from ${sourceFilter.replace("-", " ")}` : ""}
      </p>

      {/* Signal list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {sorted.map((signal) => {
          const isExpanded = expanded === signal.id;
          return (
            <div
              key={signal.id}
              className={`rounded-lg border transition-all ${
                signal.isNew
                  ? "border-amber-300 bg-amber-50/50 signal-new"
                  : "border-ink/10 bg-parchment-dark/30"
              }`}
            >
              <button
                onClick={() => setExpanded(isExpanded ? null : signal.id)}
                className="w-full text-left p-3"
              >
                <div className="flex items-start gap-2">
                  {/* Source icon */}
                  <span className="text-sm mt-0.5 shrink-0">
                    {sourceIcons[signal.source]}
                  </span>

                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-ink leading-snug">
                        {signal.isNew && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5 -mt-0.5 signal-pulse" />
                        )}
                        {signal.title}
                      </h4>
                      {/* Strength bars */}
                      <div className="flex gap-0.5 h-3 shrink-0">
                        {strengthBars(signal.strength)}
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-ink-light">
                        {signal.sourceLabel}
                      </span>
                      <span className="text-xs text-ink-light">
                        {new Date(signal.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold tracking-[0.12em] uppercase"
                        style={{
                          color: verificationInks[signal.verification],
                          border: `1px solid ${verificationInks[signal.verification]}59`,
                          backgroundColor: `${verificationInks[signal.verification]}0a`,
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        {signal.verification}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded content */}
              {isExpanded && (
                <div className="px-3 pb-3 pt-0 border-t border-ink/5 mt-1">
                  <p className="text-xs text-ink leading-relaxed mt-2">
                    {signal.summary}
                  </p>

                  {/* Related creatures */}
                  {signal.relatedCreatures.length > 0 && (
                    <div className="mt-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-ink-light">
                        Creatures affected
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {signal.relatedCreatures.map((cid) => {
                          const creature = getCreatureById(cid);
                          if (!creature) return null;
                          return (
                            <button
                              key={cid}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectCreature(cid);
                              }}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-ink/5 hover:bg-ink/10 transition-colors text-xs"
                            >
                              <span>{creature.icon}</span>
                              <span className="font-medium">{creature.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {signal.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {signal.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-1.5 py-0.5 rounded bg-ink/5 text-ink-light"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Source link */}
                  {signal.sourceUrl && (
                    <a
                      href={signal.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-abyss-accent hover:underline"
                    >
                      View source ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
