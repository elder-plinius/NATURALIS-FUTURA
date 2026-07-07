"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import type { Creature, ViewMode } from "@/data";
import { regions, allCreatures, hopeCreatures } from "@/data";
import { generateBattleOptions, fuzzyMatchCountermeasure, calculateContainmentXP, getTitle, getStreakMultiplier } from "@/lib/game-logic";
import { getCompoundsForCreature } from "@/data";
import { usePlayerProgress } from "@/lib/PlayerProgressContext";
import type { BattleOption, BattleResult } from "@/lib/game-types";
import { MOVE_TYPE_META } from "@/lib/game-types";

interface ContainmentBattleProps {
  creature: Creature;
  viewMode: ViewMode;
  onClose: () => void;
}

/** Look up the in-depth explanation for a battle move */
function getMoveDescription(opt: BattleOption): string | null {
  if (opt.type === "countermeasure") {
    const c = allCreatures.find((cr) => cr.id === opt.id);
    return c?.countermeasure.description ?? null;
  }
  if (opt.type === "hope-creature") {
    const h = hopeCreatures.find((hc) => hc.id === opt.id);
    if (!h) return null;
    return h.description + (h.technicalVision ? "\n\n" + h.technicalVision : "");
  }
  return null;
}


export default function ContainmentBattle({ creature, viewMode, onClose }: ContainmentBattleProps) {
  const { state, containCreature, recordBattleLoss } = usePlayerProgress();
  const [result, setResult] = useState<BattleResult | null>(null);
  const [freeText, setFreeText] = useState("");
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [expandedInfo, setExpandedInfo] = useState<number | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [revealPhase, setRevealPhase] = useState(false);
  const [shaking, setShaking] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const region = regions.find((r) => r.id === creature.region);
  const regionAccent = region?.color.accent ?? "#7c3aed";
  const streakMultiplier = getStreakMultiplier(state.battleStats.currentStreak);

  const battle = useMemo(
    () => (viewMode === "cartographer" ? null : generateBattleOptions(creature, viewMode)),
    [creature, viewMode, retryCount],
  );

  const resolveBattleResult = useCallback((won: boolean, correctLabel: string) => {
    const xpMultiplier = won ? streakMultiplier : 1;
    const baseXP = calculateContainmentXP(creature);
    const xpEarned = won ? Math.round(baseXP * xpMultiplier) : 0;
    const currentXP = state.xp;
    const oldTitle = getTitle(currentXP);
    const newTitle = getTitle(currentXP + xpEarned);

    if (won) {
      containCreature(creature, xpMultiplier);
    } else {
      recordBattleLoss();
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }

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
      correctAnswer: { id: creature.id, label: correctLabel, type: "countermeasure", moveType: "forge" },
      compoundEscalation,
      leveledUp: newTitle.title !== oldTitle.title,
      newTitle: newTitle.title !== oldTitle.title ? newTitle.title : null,
      regionMastered: null,
    });
  }, [creature, state.xp, streakMultiplier, containCreature, recordBattleLoss]);

  const handleSelect = useCallback(
    (index: number) => {
      if (revealPhase || result || !battle) return;
      setSelectedIndex(index);
      setExpandedInfo(null);
      setRevealPhase(true);

      // Dramatic reveal pause
      setTimeout(() => {
        const won = index === battle.correctIndex;
        resolveBattleResult(won, battle.options[battle.correctIndex].label);
        setRevealPhase(false);
      }, 900);
    },
    [revealPhase, result, battle, resolveBattleResult],
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (result) return;
    const won = fuzzyMatchCountermeasure(freeText, creature);
    resolveBattleResult(won, creature.countermeasure.name);
  }, [freeText, result, creature, resolveBattleResult]);

  const toggleInfo = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInfo((prev) => (prev === index ? null : index));
  }, []);

  // Keyboard shortcuts: 1-4 to select battle options
  useEffect(() => {
    if (revealPhase || result || !battle || viewMode === "cartographer") return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const num = parseInt(e.key);
      if (num >= 1 && num <= battle.options.length) {
        handleSelect(num - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [revealPhase, result, battle, handleSelect, viewMode]);

  const handleRetry = useCallback(() => {
    setResult(null);
    setSelectedIndex(null);
    setExpandedInfo(null);
    setFreeText("");
    setRevealPhase(false);
    setShaking(false);
    setRetryCount((c) => c + 1);
  }, []);

  // Modal focus management: move focus into the dialog on open, keep Tab
  // cycling inside it, and hand focus back to the opener on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();
    return () => opener?.focus?.();
  }, []);

  const handleTrapKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const card = cardRef.current;
    if (!card) return;
    const focusables = card.querySelectorAll<HTMLElement>(
      'button, input, [tabindex]:not([tabindex="-1"])',
    );
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === card)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }, []);

  // Result-screen keys: Enter continues (or retries on a loss), R retries.
  // Escape is handled by the app shell.
  useEffect(() => {
    if (!result) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // A focused control keeps its native Enter behavior (e.g. the RETREAT
      // button or the technique expander) — only handle unfocused shortcuts.
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("button, a, input, textarea, select, [role='button']")
      ) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (result.won) onClose();
        else handleRetry();
      } else if ((e.key === "r" || e.key === "R") && !result.won) {
        e.preventDefault();
        handleRetry();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [result, onClose, handleRetry]);

  const { likelihood, impact, detectability } = creature.threatGradient;
  const composite = likelihood + impact + detectability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-sm animate-[fade-in_0.2s_ease-out]"
        style={{
          background: `radial-gradient(ellipse at 50% 30%, ${regionAccent}15, rgba(44,24,16,0.35) 70%)`,
        }}
        onClick={onClose}
      />

      {/* Battle card */}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Containment battle: ${creature.name}`}
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        className={`parchment-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative outline-none animate-[battle-appear_0.3s_cubic-bezier(0.34,1.56,0.64,1)] ${shaking ? "animate-[screen-shake_0.4s_ease-out]" : ""}`}
      >
        {/* Region accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: `linear-gradient(90deg, ${regionAccent}, ${regionAccent}40)` }}
        />

        <div className="p-6">
          {/* Header — Pliny themed */}
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
              <div>
                <h2
                  className="text-sm font-bold tracking-[0.2em] text-ink"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  FACE THE DARKNESS
                </h2>
                {state.battleStats.currentStreak >= 2 && !result && (
                  <p className="text-[10px] text-amber-600 font-bold tracking-wider">
                    &#128293; {state.battleStats.currentStreak} STREAK &bull; {streakMultiplier}x XP
                  </p>
                )}
              </div>
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
            <div
              className="absolute top-0 left-0 w-32 h-32 rounded-full blur-2xl opacity-20"
              style={{ backgroundColor: regionAccent }}
            />
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
              {/* Question — Pliny themed */}
              <p
                className="text-sm font-bold text-ink mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                How do you fight the darkness?
              </p>
              <p className="text-xs text-ink-light mb-4">
                Every creature of the latent space has a weakness &mdash; a real countermeasure from AI safety research. Some can be contained. Some can only be watched. Choose wisely.
                <span className="text-ink/30 ml-1">
                  Press 1&ndash;{battle?.options.length ?? 4} or click. <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-ink/5 text-[9px] font-bold align-text-bottom">i</span> for details.
                </span>
              </p>

              {viewMode === "cartographer" ? (
                <div className="space-y-3">
                  <p className="text-xs text-ink-light">
                    Name the technique or hope creature that defeats this threat.
                  </p>
                  <input
                    type="text"
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleFreeTextSubmit()}
                    placeholder="Speak the name of the countermeasure..."
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
                    CAST
                  </button>
                </div>
              ) : (
                /* Multiple choice with move type badges */
                <div className="space-y-2">
                  {battle?.options.map((opt, i) => {
                    const isExpanded = expandedInfo === i;
                    const desc = getMoveDescription(opt);
                    const moveMeta = MOVE_TYPE_META[opt.moveType];

                    // Reveal phase styling
                    const isSelected = selectedIndex === i;
                    const isCorrect = battle && i === battle.correctIndex;
                    let revealClass = "";
                    let revealStyle: React.CSSProperties = {};
                    if (revealPhase && selectedIndex !== null) {
                      if (isSelected && !isCorrect) {
                        revealClass = "animate-[option-wrong-shake_0.4s_ease-out]";
                        revealStyle = { borderColor: "#ef444480", backgroundColor: "rgba(239,68,68,0.05)" };
                      } else if (isCorrect) {
                        revealClass = "animate-[option-correct-glow_0.6s_ease-out_forwards]";
                        revealStyle = { borderColor: "#16a34a80", backgroundColor: "rgba(22,163,74,0.05)" };
                      } else {
                        revealStyle = { opacity: 0.3 };
                      }
                    }

                    return (
                      <div
                        key={opt.label}
                        className={`rounded-xl border transition-all duration-200 ${revealClass}`}
                        style={{
                          borderColor: isExpanded ? `${regionAccent}30` : "rgba(44,24,16,0.1)",
                          backgroundColor: isExpanded ? `${regionAccent}03` : "transparent",
                          animation: !revealPhase && !result ? `battle-option-enter 0.3s ease-out backwards` : undefined,
                          animationDelay: !revealPhase && !result ? `${i * 0.08}s` : undefined,
                          ...revealStyle,
                        }}
                      >
                        {/* Option row */}
                        <div className="flex items-center">
                          <button
                            onClick={() => handleSelect(i)}
                            disabled={revealPhase}
                            className="flex-1 text-left px-4 py-3 text-sm text-ink group hover:bg-ink/[0.02] transition-all rounded-l-xl disabled:cursor-default"
                          >
                            <span className="flex items-center gap-2 flex-wrap">
                              {/* Number badge */}
                              <span
                                className="inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0"
                                style={{
                                  backgroundColor: `${regionAccent}12`,
                                  color: regionAccent,
                                }}
                              >
                                {i + 1}
                              </span>
                              {/* Move type badge */}
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0"
                                style={{
                                  backgroundColor: moveMeta.color + "15",
                                  color: moveMeta.color,
                                  border: `1px solid ${moveMeta.color}20`,
                                }}
                              >
                                {moveMeta.icon} {moveMeta.label}
                              </span>
                              {/* Move name */}
                              <span className="font-medium">{opt.label}</span>
                            </span>
                          </button>
                          {/* Info toggle button */}
                          {desc && !revealPhase && (
                            <button
                              onClick={(e) => toggleInfo(i, e)}
                              className="shrink-0 w-9 h-full flex items-center justify-center rounded-r-xl transition-all hover:bg-ink/5"
                              aria-label={`${isExpanded ? "Hide" : "Show"} details for ${opt.label}`}
                              title="Show move details"
                            >
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-all"
                                style={{
                                  backgroundColor: isExpanded ? regionAccent : `${regionAccent}12`,
                                  color: isExpanded ? "#fff" : regionAccent,
                                }}
                              >
                                i
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Expanded info panel */}
                        {isExpanded && desc && !revealPhase && (
                          <div className="px-4 pb-3 animate-[fade-in-up_0.2s_ease-out]">
                            <div className="rounded-lg p-3 text-xs leading-relaxed text-ink/80" style={{
                              backgroundColor: `${regionAccent}06`,
                              border: `1px solid ${regionAccent}10`,
                            }}>
                              <p className="text-[9px] font-bold tracking-wider mb-1 uppercase" style={{ color: moveMeta.color }}>
                                {moveMeta.icon} {moveMeta.label} &mdash; {moveMeta.flavor}
                              </p>
                              {desc.split("\n\n").map((para, pi) => (
                                <p key={pi} className={pi > 0 ? "mt-2" : ""}>
                                  {para}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
                      THE LIGHT PREVAILS
                    </h3>
                    <p className="text-xs text-green-700/70 mb-1">The darkness recedes.</p>
                    <p className="text-sm text-green-700 font-bold">
                      +{result.xpEarned} XP
                      {streakMultiplier > 1 && (
                        <span className="ml-1 text-amber-600">({streakMultiplier}x streak!)</span>
                      )}
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
                <div className="text-center p-6 rounded-xl relative overflow-hidden" style={{
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
                    THE DARKNESS PERSISTS
                  </h3>
                  <p className="text-sm text-red-700">
                    The correct technique was:{" "}
                    <strong className="font-bold">{result.correctAnswer.label}</strong>
                  </p>
                  {state.battleStats.currentStreak === 0 && state.battleStats.bestStreak >= 3 && (
                    <p className="text-xs text-red-600/50 mt-1 italic">Streak broken...</p>
                  )}
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

              {/* Correct answer explanation (shown after battle ends) */}
              {result && (
                <CorrectMoveExplanation
                  result={result}
                  creature={creature}
                  regionAccent={regionAccent}
                />
              )}

              <div className={result.won ? "" : "flex gap-2"}>
                {!result.won && (
                  <button
                    onClick={handleRetry}
                    className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      background: `linear-gradient(135deg, ${regionAccent}, ${regionAccent}cc)`,
                      color: "#fff",
                      boxShadow: `0 4px 14px ${regionAccent}30`,
                    }}
                  >
                    FIGHT AGAIN
                  </button>
                )}
                <button
                  onClick={onClose}
                  className={`${result.won ? "w-full" : "flex-1"} py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:scale-[1.01] active:scale-[0.99]`}
                  style={{
                    background: result.won
                      ? "linear-gradient(135deg, #16a34a, #15803d)"
                      : "linear-gradient(135deg, rgba(44,24,16,0.08), rgba(44,24,16,0.03))",
                    color: result.won ? "#fff" : "rgba(44,24,16,0.6)",
                    boxShadow: result.won ? "0 4px 14px rgba(22,163,74,0.3)" : "none",
                    border: result.won ? "none" : "1px solid rgba(44,24,16,0.12)",
                  }}
                >
                  {result.won ? "CONTINUE EXPLORING" : "RETREAT"}
                </button>
              </div>
            </div>
          )}

          {/* Composite threat score + move type hint */}
          <div className="mt-5 pt-3 text-center" style={{
            borderTop: `1px solid ${regionAccent}15`,
          }}>
            <span className="text-xs text-ink-light">
              Threat level:{" "}
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

/** Shows the correct answer's full explanation after the battle ends */
function CorrectMoveExplanation({ result, creature, regionAccent }: {
  result: BattleResult; creature: Creature; regionAccent: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const desc = creature.countermeasure.description;
  const moveMeta = MOVE_TYPE_META[result.correctAnswer.moveType];

  return (
    <div className="rounded-xl overflow-hidden" style={{
      border: `1px solid ${regionAccent}15`,
      backgroundColor: `${regionAccent}04`,
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-ink/[0.02] transition-all"
      >
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider"
            style={{ backgroundColor: moveMeta.color + "15", color: moveMeta.color }}
          >
            {moveMeta.icon} {moveMeta.label}
          </span>
          <span className="text-xs font-bold text-ink" style={{ fontFamily: "var(--font-display)" }}>
            {result.won ? "How this technique works" : "Learn the correct technique"}
          </span>
        </div>
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          className="transition-transform duration-200"
          style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {expanded && (
        <div className="px-4 pb-4 animate-[fade-in-up_0.2s_ease-out] space-y-3">
          {/* Countermeasure explanation */}
          <div className="rounded-lg p-3 text-xs leading-relaxed text-ink/80" style={{
            backgroundColor: `${regionAccent}06`,
            border: `1px solid ${regionAccent}10`,
          }}>
            <p className="text-[10px] font-bold tracking-wider mb-1.5 uppercase" style={{ color: moveMeta.color }}>
              {creature.countermeasure.name}
            </p>
            <p>{desc}</p>
          </div>

          {/* Real-world connection */}
          <div className="rounded-lg p-3 text-xs leading-relaxed" style={{
            backgroundColor: `${moveMeta.color}08`,
            border: `1px solid ${moveMeta.color}15`,
          }}>
            <p className="text-[9px] font-bold tracking-wider mb-1 uppercase" style={{ color: moveMeta.color }}>
              {moveMeta.icon} Real-World AI Safety
            </p>
            <p className="text-ink/60">{moveMeta.realWorld}</p>
          </div>

          {/* Honest assessment */}
          <div className="rounded-lg p-3 text-xs leading-relaxed bg-ink/[0.02]" style={{
            border: "1px solid rgba(44,24,16,0.08)",
          }}>
            <p className="text-[9px] font-bold tracking-wider mb-1 text-ink/40 uppercase">
              &#9888;&#65039; Honest Assessment
            </p>
            <p className="text-ink/50 italic">{moveMeta.honestNote}</p>
          </div>
        </div>
      )}
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
