"use client";

import { useState, useMemo, useCallback } from "react";
import type { Creature, ViewMode } from "@/data";
import { regions } from "@/data";
import { generateBattleOptions, resolveBattle, fuzzyMatchCountermeasure, getTitle } from "@/lib/game-logic";
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

  const battle = useMemo(
    () => (viewMode === "cartographer" ? null : generateBattleOptions(creature, viewMode)),
    [creature, viewMode],
  );

  const handleSelect = useCallback(
    (index: number) => {
      if (result || !battle) return;
      setSelectedIndex(index);

      const battleResult = resolveBattle(creature, index, battle.correctIndex, battle.options, state.xp);

      if (battleResult.won) {
        containCreature(creature);
      } else {
        recordBattleLoss();
      }

      setResult(battleResult);
    },
    [result, battle, creature, state.xp, containCreature, recordBattleLoss],
  );

  const handleFreeTextSubmit = useCallback(() => {
    if (result) return;
    const won = fuzzyMatchCountermeasure(freeText, creature);
    const xpEarned = won ? containCreature(creature) : 0;
    if (!won) recordBattleLoss();

    const oldTitle = getTitle(state.xp);
    const newTitle = getTitle(state.xp + xpEarned);

    setResult({
      won,
      xpEarned,
      correctAnswer: { id: creature.id, label: creature.countermeasure.name, type: "countermeasure" },
      compoundEscalation: undefined,
      leveledUp: newTitle.title !== oldTitle.title,
      newTitle: newTitle.title !== oldTitle.title ? newTitle.title : null,
      regionMastered: null,
    });
  }, [freeText, result, creature, state.xp, containCreature, recordBattleLoss]);

  const { likelihood, impact, detectability } = creature.threatGradient;
  const composite = likelihood + impact + detectability;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <div className="parchment-card rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-sm font-bold tracking-widest text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CONTAINMENT CHALLENGE
          </h2>
          <button
            onClick={onClose}
            className="text-ink-light hover:text-ink transition-colors text-lg"
            aria-label="Close"
          >
            &times;
          </button>
        </div>

        {/* Creature card */}
        <div className="flex items-center gap-4 mb-4 p-4 rounded-xl bg-ink/[0.03] border border-ink/10">
          <span className="text-5xl">{creature.icon}</span>
          <div>
            <h3 className="text-lg font-bold text-ink">{creature.name}</h3>
            <p className="text-xs text-ink-light">
              {region?.name} &middot; {creature.threatClass}
            </p>
          </div>
        </div>

        {/* Threat gradient */}
        <div className="grid grid-cols-3 gap-2 mb-6 text-center">
          <GradientStat label="Likelihood" value={likelihood} />
          <GradientStat label="Impact" value={impact} />
          <GradientStat label="Stealth" value={detectability} />
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
                  className="w-full px-4 py-3 rounded-xl border border-ink/20 bg-parchment text-ink text-sm focus:outline-none focus:ring-2 focus:ring-abyss-accent/40"
                  autoFocus
                />
                <button
                  onClick={handleFreeTextSubmit}
                  disabled={freeText.trim().length === 0}
                  className="w-full py-3 rounded-xl bg-ink text-parchment font-bold text-sm tracking-wide transition-opacity disabled:opacity-40"
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
                    className="w-full text-left px-4 py-3 rounded-xl border border-ink/15 hover:border-ink/30 hover:bg-ink/[0.03] transition-all text-sm text-ink"
                  >
                    <span className="text-ink-light mr-2 font-mono text-xs">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt.label}
                    {opt.type === "hope-creature" && (
                      <span className="ml-2 text-xs text-amber-600">(Hope)</span>
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
              <div className="text-center p-4 rounded-xl bg-green-50 border border-green-200">
                <div className="text-4xl mb-2">🛡️</div>
                <h3 className="text-lg font-bold text-green-800 mb-1">CONTAINED</h3>
                <p className="text-sm text-green-700">
                  +{result.xpEarned} XP earned
                </p>
                {result.leveledUp && result.newTitle && (
                  <p className="text-sm font-bold text-amber-700 mt-2">
                    Title earned: {result.newTitle}!
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center p-4 rounded-xl bg-red-50 border border-red-200">
                <div className="text-4xl mb-2">💥</div>
                <h3 className="text-lg font-bold text-red-800 mb-1">THREAT ESCALATED</h3>
                <p className="text-sm text-red-700">
                  Correct answer: <strong>{result.correctAnswer.label}</strong>
                </p>
              </div>
            )}

            {/* Compound escalation on failure */}
            {result.compoundEscalation && (
              <div className="p-4 rounded-xl bg-ink/[0.03] border border-ink/10">
                <h4
                  className="text-xs font-bold tracking-widest text-red-800 mb-2"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  COMPOUND THREAT: {result.compoundEscalation.name}
                </h4>
                <p className="text-xs text-ink leading-relaxed">
                  {result.compoundEscalation.scenario.slice(0, 200)}...
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-ink text-parchment font-bold text-sm tracking-wide"
            >
              {result.won ? "CONTINUE EXPLORING" : "TRY AGAIN LATER"}
            </button>
          </div>
        )}

        {/* Composite threat score */}
        <div className="mt-4 pt-3 border-t border-ink/10 text-center">
          <span className="text-xs text-ink-light">
            Composite threat: <strong className="text-ink">{composite}/15</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

function GradientStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-2 rounded-lg bg-ink/[0.03]">
      <div className="flex gap-0.5 justify-center mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-sm ${i <= value ? "bg-red-500/80" : "bg-ink/10"}`}
          />
        ))}
      </div>
      <div className="text-xs text-ink-light">{label}</div>
    </div>
  );
}
