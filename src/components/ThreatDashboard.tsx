"use client";

import { useState, useMemo } from "react";
import { allCreatures, getCreatureById, regions } from "@/data";
import type { Creature } from "@/data";
import type { ThreatSubmission } from "@/data/dashboard-types";
import {
  threatSignals,
  watchSources,
  evolutionEvents,
} from "@/data/signals";
import ThreatRadar from "./ThreatRadar";
import SignalFeed from "./SignalFeed";
import SubmissionPortal from "./SubmissionPortal";
import StatusSeal from "./StatusSeal";

interface ThreatDashboardProps {
  onSelectCreature: (creature: Creature) => void;
}

type DashTab = "radar" | "signals" | "evolution" | "sources" | "submit";

export default function ThreatDashboard({
  onSelectCreature,
}: ThreatDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashTab>("radar");
  const [submissions, setSubmissions] = useState<ThreatSubmission[]>([]);

  // Compute live stats
  const stats = useMemo(() => {
    const confirmed = allCreatures.filter(
      (c) => c.currentStatus.status === "confirmed",
    ).length;
    const emerging = allCreatures.filter(
      (c) => c.currentStatus.status === "emerging",
    ).length;
    const theoretical = allCreatures.filter(
      (c) => c.currentStatus.status === "theoretical",
    ).length;
    const newSignals = threatSignals.filter((s) => s.isNew).length;
    const criticalSignals = threatSignals.filter((s) => s.strength >= 4).length;

    // Overall threat level
    const threatLevel =
      criticalSignals >= 5 ? "critical" : criticalSignals >= 3 ? "elevated" : "stable";

    return {
      total: allCreatures.length,
      confirmed,
      emerging,
      theoretical,
      newSignals,
      criticalSignals,
      threatLevel: threatLevel as "stable" | "elevated" | "critical",
      activeSources: watchSources.filter((s) => s.active).length,
    };
  }, []);

  const handleSelectCreature = (creatureId: string) => {
    const creature = getCreatureById(creatureId);
    if (creature) onSelectCreature(creature);
  };

  const handleSubmission = (sub: ThreatSubmission) => {
    setSubmissions((prev) => [sub, ...prev]);
  };

  const tabs: { id: DashTab; label: string; icon: string }[] = [
    { id: "radar", label: "Radar", icon: "📡" },
    { id: "signals", label: "Signals", icon: "📶" },
    { id: "evolution", label: "Timeline", icon: "📜" },
    { id: "sources", label: "Sources", icon: "🔭" },
    { id: "submit", label: "Submit", icon: "✏️" },
  ];

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Dashboard header */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold tracking-widest text-ink mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          LIVE THREAT OBSERVATORY
        </h2>
        <p className="text-sm text-ink-light">
          The bestiary breathes. Signals from research, incidents, and the
          community flow in — creatures evolve from theoretical to confirmed.
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        <StatCard
          label="Creatures"
          value={stats.total}
          icon="🗺️"
        />
        <StatCard
          label="Confirmed"
          value={stats.confirmed}
          icon="🔴"
          accent="text-red-700"
        />
        <StatCard
          label="Emerging"
          value={stats.emerging}
          icon="🟡"
          accent="text-amber-700"
        />
        <StatCard
          label="Theoretical"
          value={stats.theoretical}
          icon="⚪"
          accent="text-gray-500"
        />
        <StatCard
          label="New Signals"
          value={stats.newSignals}
          icon="🆕"
          accent="text-blue-700"
          pulse={stats.newSignals > 0}
        />
        <StatCard
          label="Critical"
          value={stats.criticalSignals}
          icon="⚡"
          accent="text-red-700"
          pulse={stats.criticalSignals >= 5}
        />
        <div
          className={`rounded-xl p-3 text-center border ${
            stats.threatLevel === "critical"
              ? "border-red-300 bg-red-50"
              : stats.threatLevel === "elevated"
                ? "border-amber-300 bg-amber-50"
                : "border-green-300 bg-green-50"
          }`}
        >
          <div
            className={`text-xs font-bold uppercase tracking-widest ${
              stats.threatLevel === "critical"
                ? "text-red-800"
                : stats.threatLevel === "elevated"
                  ? "text-amber-800"
                  : "text-green-800"
            }`}
          >
            {stats.threatLevel === "critical"
              ? "🔺 Critical"
              : stats.threatLevel === "elevated"
                ? "🔶 Elevated"
                : "🟢 Stable"}
          </div>
          <div className="text-xs text-ink-light mt-0.5">Threat Level</div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-6 border-b border-ink/10 pb-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-t-lg text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-ink text-parchment"
                : "text-ink-light hover:bg-ink/5"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {tab.id === "signals" && stats.newSignals > 0 && (
              <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center signal-pulse">
                {stats.newSignals}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {activeTab === "radar" && (
          <>
            {/* Radar takes 2 columns */}
            <div className="lg:col-span-2">
              <div className="parchment-card rounded-xl p-4">
                <h3
                  className="text-sm font-bold tracking-widest text-ink mb-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  THREAT RADAR
                </h3>
                <p className="text-xs text-ink-light mb-4">
                  Signal intensity by region. Larger, brighter blips indicate more
                  active research signals. Pulsing sectors have critical-strength
                  signals.
                </p>
                <ThreatRadar
                  signals={threatSignals}
                  onSelectCreature={handleSelectCreature}
                />
              </div>
            </div>

            {/* Recent signals sidebar */}
            <div>
              <div className="parchment-card rounded-xl p-4">
                <h3
                  className="text-sm font-bold tracking-widest text-ink mb-3"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  LATEST SIGNALS
                </h3>
                <SignalFeed
                  signals={threatSignals.slice(0, 8)}
                  onSelectCreature={handleSelectCreature}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "signals" && (
          <div className="lg:col-span-3">
            <div className="parchment-card rounded-xl p-4">
              <h3
                className="text-sm font-bold tracking-widest text-ink mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                SIGNAL FEED
              </h3>
              <p className="text-xs text-ink-light mb-4">
                All incoming signals from research papers, lab reports, government
                publications, incidents, and community reports.
              </p>
              <SignalFeed
                signals={threatSignals}
                onSelectCreature={handleSelectCreature}
              />
            </div>
          </div>
        )}

        {activeTab === "evolution" && (
          <div className="lg:col-span-3">
            <div className="parchment-card rounded-xl p-4">
              <h3
                className="text-sm font-bold tracking-widest text-ink mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                EVOLUTION TIMELINE
              </h3>
              <p className="text-xs text-ink-light mb-6">
                How creatures have changed status as new evidence emerges. The
                bestiary is alive — theoretical threats become confirmed ones.
              </p>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-ink/10" />

                <div className="space-y-4">
                  {[...evolutionEvents]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((event) => {
                      const creature = getCreatureById(event.creatureId);
                      if (!creature) return null;
                      const region = regions.find(
                        (r) => r.id === creature.region,
                      );

                      return (
                        <div key={event.id} className="relative pl-10">
                          {/* Timeline dot */}
                          <div
                            className="absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 border-parchment"
                            style={{
                              backgroundColor: region?.color.accent ?? "#666",
                            }}
                          />

                          <div className="rounded-lg border border-ink/10 bg-parchment-dark/30 p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-ink-light">
                                {new Date(event.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                  },
                                )}
                              </span>
                              {event.fromStatus && (
                                <div className="flex items-center gap-1">
                                  <StatusBadge status={event.fromStatus} />
                                  <span className="text-ink-light text-xs">
                                    →
                                  </span>
                                  <StatusBadge status={event.toStatus} />
                                </div>
                              )}
                            </div>

                            <button
                              onClick={() => onSelectCreature(creature)}
                              className="flex items-center gap-2 mb-1.5 hover:opacity-80 transition-opacity"
                            >
                              <span className="text-base">
                                {creature.icon}
                              </span>
                              <span className="text-xs font-bold text-ink">
                                {creature.name}
                              </span>
                            </button>

                            <p className="text-xs text-ink leading-relaxed">
                              {event.trigger}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "sources" && (
          <div className="lg:col-span-3">
            <div className="parchment-card rounded-xl p-4">
              <h3
                className="text-sm font-bold tracking-widest text-ink mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                WATCH SOURCES
              </h3>
              <p className="text-xs text-ink-light mb-6">
                The observatory&apos;s telescopes — configured monitors scanning
                for signals across the research landscape. Each source feeds
                signals into the bestiary.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {watchSources.map((source) => (
                  <div
                    key={source.id}
                    className={`rounded-lg border p-3 transition-all ${
                      source.active
                        ? "border-green-300 bg-green-50/50"
                        : "border-ink/10 bg-ink/[0.02] opacity-60"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{source.icon}</span>
                        <span className="text-xs font-bold text-ink">
                          {source.name}
                        </span>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          source.active
                            ? "bg-green-500 signal-pulse"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>
                    <p className="text-xs text-ink-light leading-relaxed mb-2">
                      {source.description}
                    </p>
                    <div className="flex items-center justify-between text-xs text-ink-light">
                      <span>
                        {source.signalCount} signal
                        {source.signalCount !== 1 ? "s" : ""} tracked
                      </span>
                      {source.lastScanned && (
                        <span>
                          Last scan:{" "}
                          {new Date(source.lastScanned).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" },
                          )}
                        </span>
                      )}
                    </div>
                    {source.url && (
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-abyss-accent hover:underline"
                      >
                        Visit ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>

              {/* Scanner config info */}
              <div className="mt-6 p-4 rounded-lg bg-ink/[0.03] border border-ink/10">
                <h4
                  className="text-xs font-bold tracking-widest text-ink mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  HOW THE SCANNER WORKS
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-ink leading-relaxed">
                  <div>
                    <span className="font-bold text-ink">1. Ingest</span>
                    <p className="text-ink-light mt-1">
                      Sources are scanned for new publications, reports, and
                      incidents matching safety-relevant keywords and topic
                      classifiers.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-ink">2. Map</span>
                    <p className="text-ink-light mt-1">
                      Each signal is mapped to bestiary creatures using semantic
                      similarity, keyword matching, and threat-class
                      classification.
                    </p>
                  </div>
                  <div>
                    <span className="font-bold text-ink">3. Evolve</span>
                    <p className="text-ink-light mt-1">
                      When signals accumulate and corroborate, creature statuses
                      update. Theoretical → Emerging → Confirmed. The bestiary
                      breathes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "submit" && (
          <div className="lg:col-span-3">
            <div className="parchment-card rounded-xl p-4">
              <SubmissionPortal onSubmit={handleSubmission} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Helper Components ──

function StatCard({
  label,
  value,
  icon,
  accent,
  pulse,
}: {
  label: string;
  value: number;
  icon: string;
  accent?: string;
  pulse?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink/10 bg-parchment-dark/30 p-3 text-center">
      <div className={`text-lg font-bold ${accent ?? "text-ink"} ${pulse ? "signal-pulse" : ""}`}>
        {icon} {value}
      </div>
      <div className="text-xs text-ink-light uppercase tracking-widest mt-0.5">
        {label}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return <StatusSeal status={status} />;
}
