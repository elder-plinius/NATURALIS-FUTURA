"use client";

import { useState, useMemo, useCallback } from "react";
import type { Creature, ViewMode } from "@/data";
import { regions } from "@/data";
import { generateBattleOptions, resolveBattle, fuzzyMatchCountermeasure, calculateContainmentXP, getTitle } from "@/lib/game-logic";
import { getCompoundsForCreature } from "@/data";
import { usePlayerProgress } from "@/lib/PlayerProgressContext";
import type { BattleResult } from "@/lib/game-types";

interface ContainmentBattleProps {
  creature: Creature;
  viewMode: ViewMode;
  onClose: () => void;
}

export default function ContainmentBattle({ creature, viewMode, onClose }: ContainmentBattleProps) {
  const { state, containCreature, recordBattleLoss } = usePlayerProgress();
  const [result, setResult] = useState<BattleResult | null>(null);
  const [freeText, setFreeText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const region = regions.find((r) => r.id === creature.region);
  const regionAccent = region?.color.accent ?? "#7c3aed";

  const battle = useMemo(
    () => (viewMode === "cartographer" ? null : generateBattleOptions(creature, viewMode)),
    [creature, viewMode],
  );

  // Shared battle resolution logic
  const resolveBattleResult = useCallback((won: boolean, correctLabel: string) => {
    const xpEarned = won ? calculateContainmentXP(creature) : 0;
    const currentXP = state.xp; // Snapshot current XP before update
    const oldTitle = getTitle(currentXP);
    const newTitle = getTitle(currentXP + xpEarned);

    if (won) {
      containCreature(creature);
    } else {
      recordBattleLoss();
    }

    // Build compound escalation for wrong answers
    let compoundEscalation: BattleResult["compoundEscalation"] = undefined;
    if (!won) {
      const compounds = getCompoundsForCreature(creature.id);
      if (compounds.length > 0) {
        const compound = compounds[Math.floor(Math.random() * compounds.length)];
        compoundEscalation = { name: compound.name, scenario: compound.scenario };
      }
    }

    setResult({
      won,
      xpEarned,
      correctAnswer: { id: creature.id, label: correctLabel, type: "countermeasure" },
      compoundEscalation,
      leveledUp: newTitle.title !== oldTitle.title,
      newTitle: newTitle.title !== oldTitle.title ? newTitle.title : null,
      regionMastered: null,
    });
  }, [creature, state.xp, containCreature, recordBattleLoss]);

  const handleSelect = useCallback(
    (index: number) => {
      if (result || !battle) return;
      setSelectedIndex(index);
      const won = index === battle.correctIndex;
      resolveBattleResult(won, battle.options[battle.correctIndex].label);
    },
    [result, battle, resolveBattleResult],
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (result) return;
    const won = fuzzyMatchCountermeasure(freeText, creature);
    resolveBattleResult(won, creature.countermeasure.name);
  }, [freeText, result, creature, resolveBattleResult]);

  const { likelihood, impact, detectability } = creature.threatGradient;
  const composite = likelihood + impact + detectability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with region-colored tint */}
      <div
        className="absolute inset-0 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${regionAccent}15, rgba(44,24,16,0.35) 70%)`,
        }}
        onClick={onClose}
      />

      {/* Battle card */}
      <div className="parchment-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-[battle-appear_0.3s_cubic-bezier(0.34,1.56,0.64,1)]">
        {/* Region accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${regionAccent}, ${regionAccent}40)` }}
        />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${regionAccent}20, ${regionAccent}08)`,
                  border: `1px solid ${regionAccent}30`,
                }}
              >
                <span className="text-sm">&#9876;</span>
              </div>
              <h2
                className="text-sm font-bold tracking-[0.2em] text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                CONTAINMENT CHALLENGE
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-light hover:text-ink hover:bg-ink/5 transition-all text-lg"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          {/* Creature showcase */}
          <div
            className="flex items-center gap-4 mb-5 p-4 rounded-xl relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${regionAccent}08, ${regionAccent}03)`,
              border: `1px solid ${regionAccent}15`,
            }}
          >
            {/* Ambient glow */}
            <div
              className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: regionAccent }}
            />

            {/* Creature sprite */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center relative shrink-0"
              style={{
                background: `linear-gradient(135deg, ${regionAccent}15, ${regionAccent}05)`,
                border: `2px solid ${regionAccent}30`,
                boxShadow: `0 0 20px ${regionAccent}15`,
              }}
            >
              <span className="text-4xl">{creature.icon}</span>
            </div>
            <div className="relative z-10">
              <h3
                className="text-lg font-bold text-ink"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {creature.name}
              </h3>
              <p className="text-xs text-ink-light flex items-center gap-2">
                <span style={{ color: regionAccent }} className="font-bold">{region?.name}</span>
                <span className="text-ink/20">&bull;</span>
                <span>{creature.threatClass}</span>
              </p>
            </div>
          </div>

          {/* Threat gradient display */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <GradientStat label="Likelihood" value={likelihood} color={regionAccent} />
            <GradientStat label="Impact" value={impact} color="#ef4444" />
            <GradientStat label="Stealth" value={detectability} color="#6366f1" />
          </div>

          {!result ? (
            <>
              {/* Question */}
              <p
                className="text-sm font-bold text-ink mb-4"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How do you contain this threat?
              </p>

              {viewMode === "cartographer" ? (
                /* Free text input */
                <div className="space-y-3">
                  <p className="text-xs text-ink-light">
                    Name the countermeasure or hope creature that contains this threat.
                  </p>
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFreeTextSubmit()}
                    placeholder="Enter the countermeasure name..."
                    className="w-full px-4 py-3 rounded-xl border bg-parchment text-ink text-sm focus:outline-none transition-all"
                    style={{
                      borderColor: `${regionAccent}30`,
                      boxShadow: `0 0 0 3px ${regionAccent}08`,
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleFreeTextSubmit}
                    disabled={freeText.trim().length === 0}
                    className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all disabled:opacity-30"
                    style={{
                      background: `linear-gradient(135deg, ${regionAccent}, ${regionAccent}cc)`,
                      color: "#fff",
                      boxShadow: `0 4px 14px ${regionAccent}30`,
                    }}
                  >
                    SUBMIT ANSWER
                  </button>
                </div>
              ) : (
                /* Multiple choice */
                <div className="space-y-2">
                  {battle?.options.map((opt, i) => (
                    <button
                      key={opt.label}
                      onClick={() => handleSelect(i)}
                      className="w-full text-left px-4 py-3 rounded-xl border transition-all duration-200 text-sm text-ink group hover:scale-[1.01] active:scale-[0.99]"
                      style={{
                        borderColor: "rgba(44,24,16,0.1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = `${regionAccent}40`;
                        e.currentTarget.style.backgroundColor = `${regionAccent}05`;
                        e.currentTarget.style.boxShadow = `0 2px 8px ${regionAccent}10`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "rgba(44,24,16,0.1)";
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-6 h-6 rounded-lg mr-2 text-xs font-bold"
                        style={{
                          backgroundColor: `${regionAccent}12`,
                          color: regionAccent,
                        }}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt.label}
                      {opt.type === "hope-creature" && (
                        <span className="ml-2 text-xs text-amber-600 font-semibold">(Hope)</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Result */
            <div className="space-y-4">
              {result.won ? (
                <div
                  className="text-center p-6 rounded-xl relative overflow-hidden animate-[containment-glow_0.6s_ease-out]"
                  style={{
                    background: `linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.03))`,
                    border: "1px solid rgba(22,163,74,0.2)",
                  }}
                >
                  {/* Success glow */}
                  <div className="absolute inset-0 animate-[containment-ring_1s_ease-out_forwards]" style={{
                    background: "radial-gradient(circle, rgba(22,163,74,0.15) 0%, transparent 60%)",
                  }} />
                  <div className="relative z-10">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-green-600 flex items-center justify-center shadow-lg animate-[discovery-burst_0.5s_cubic-bezier(0.34,1.56,0.64,1)]" style={{
                      boxShadow: "0 0 30px rgba(22,163,74,0.4)",
                    }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-white">
                        <path d="M6 14L12 20L22 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <h3
                      className="text-xl font-bold text-green-800 mb-1"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      CONTAINED
                    </h3>
                    <p className="text-sm text-green-700 font-bold">
                      +{result.xpEarned} XP
                    </p>
                    {result.leveledUp && result.newTitle && (
                      <div className="mt-3 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-300 inline-flex items-center gap-1.5">
                        <span>&#11088;</span>
                        <span className="text-sm font-bold text-amber-800">
                          New title: {result.newTitle}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 rounded-xl relative overflow-hidden animate-[battle-shake_0.4s_ease-out]" style={{
                  background: "linear-gradient(135deg, rgba(239,68,68,0.06), rgba(239,68,68,0.02))",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}>
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center border-2 border-red-200">
                    <span className="text-3xl">&#128165;</span>
                  </div>
                  <h3
                    className="text-xl font-bold text-red-800 mb-2"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    THREAT ESCALATED
                  </h3>
                  <p className="text-sm text-red-700">
                    The countermeasure was:{" "}
                    <strong className="font-bold">{result.correctAnswer.label}</strong>
                  </p>
                </div>
              )}

              {/* Compound escalation on failure */}
              {result.compoundEscalation && (
                <div className="p-4 rounded-xl" style={{
                  background: `linear-gradient(135deg, rgba(239,68,68,0.05), rgba(239,68,68,0.02))`,
                  border: "1px solid rgba(239,68,68,0.12)",
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm">&#9888;&#65039;</span>
                    <h4
                      className="text-xs font-bold tracking-widest text-red-800"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {result.compoundEscalation.name}
                    </h4>
                  </div>
                  <p className="text-xs text-ink leading-relaxed">
                    {result.compoundEscalation.scenario.slice(0, 250)}...
                  </p>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: result.won
                    ? `linear-gradient(135deg, #16a34a, #15803d)`
                    : `linear-gradient(135deg, ${regionAccent}, ${regionAccent}cc)`,
                  color: "#fff",
                  boxShadow: result.won
                    ? "0 4px 14px rgba(22,163,74,0.3)"
                    : `0 4px 14px ${regionAccent}30`,
                }}
              >
                {result.won ? "CONTINUE EXPLORING" : "TRY AGAIN LATER"}
              </button>
            </div>
          )}

          {/* Composite threat score */}
          <div className="mt-5 pt-3 text-center" style={{
            borderTop: `1px solid ${regionAccent}15`,
          }}>
            <span className="text-xs text-ink-light">
              Composite threat:{" "}
              <strong
                className="font-mono"
                style={{ color: composite >= 12 ? "#ef4444" : composite >= 8 ? regionAccent : "#6b7280" }}
              >
                {composite}/15
              </strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function GradientStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-3 rounded-xl bg-ink/[0.02] border border-ink/5 text-center">
      <div className="flex gap-1 justify-center mb-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-3 h-3 rounded-md transition-all"
            style={{
              backgroundColor: i <= value ? color : "rgba(44,24,16,0.06)",
              boxShadow: i <= value ? `0 0 6px ${color}30` : "none",
            }}
          />
        ))}
      </div>
      <div className="text-xs text-ink-light font-medium">{label}</div>
    </div>
  );
}
