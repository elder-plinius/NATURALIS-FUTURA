"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { usePlayerProgress } from "@/lib/PlayerProgressContext";
import { regions } from "@/data";

/**
 * The Complete Map — endgame capstone.
 * Shown when every creature in every region has been contained. Closes the
 * game loop: the cartographer has drawn the whole map, and every dragon is named.
 */
export default function VictoryScreen({ onClose }: { onClose: () => void }) {
  const { state, title, totalCreatures, resetProgress } = usePlayerProgress();

  // Lock body scroll while the capstone is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Modal focus management — mirror ContainmentBattle's pattern.
  const cardRef = useRef<HTMLDivElement>(null);
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
      'button, [tabindex]:not([tabindex="-1"])',
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

  const daysCharting = useMemo(() => {
    const started = Date.parse(state.createdAt);
    if (Number.isNaN(started)) return null;
    const days = Math.max(1, Math.round((Date.now() - started) / 86_400_000));
    return days;
  }, [state.createdAt]);

  const totalBattles = state.battleStats.wins + state.battleStats.losses;
  const winRate =
    totalBattles > 0 ? Math.round((state.battleStats.wins / totalBattles) * 100) : 100;

  const stats: { icon: string; label: string; value: string }[] = [
    { icon: "\u{1F5FA}\u{FE0F}", label: "Creatures Mapped", value: `${totalCreatures}/${totalCreatures}` },
    { icon: "\u{1F3F4}", label: "Regions Mastered", value: `${regions.length}/${regions.length}` },
    { icon: "⚔️", label: "Battles Won", value: `${state.battleStats.wins}` },
    { icon: "\u{1F525}", label: "Best Streak", value: `${state.battleStats.bestStreak}` },
    { icon: "\u{1F3AF}", label: "Win Rate", value: `${winRate}%` },
    { icon: "⭐", label: "Total XP", value: `${state.xp.toLocaleString()}` },
  ];

  return (
    <div className="dark-surface fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop — deep catacomb dark, so the gold reads as light returning.
          fixed (not absolute): the root scrolls on short viewports and the
          dim layer must cover the viewport at any scroll offset. */}
      <div
        className="fixed inset-0 bg-[#0a0806]/95 backdrop-blur-md animate-[fade-in_0.5s_ease-out]"
        onClick={onClose}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label="The map is complete"
        tabIndex={-1}
        onKeyDown={handleTrapKeyDown}
        className="relative w-full max-w-lg my-auto rounded-2xl border border-amber-500/30 bg-gradient-to-b from-[#1a1512] to-[#0e0b08] shadow-2xl shadow-amber-900/40 animate-[victory-rise_0.7s_cubic-bezier(0.22,1,0.36,1)] px-7 py-9 text-center outline-none"
        style={{ boxShadow: "0 0 80px -20px rgba(245,158,11,0.35)" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-amber-200/50 hover:text-amber-100 hover:bg-amber-500/10 transition-all"
        >
          &times;
        </button>

        <p
          className="text-[10px] tracking-[0.45em] text-amber-500/70 uppercase mb-3 animate-[fade-in_0.8s_ease-out]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The Map Is Complete
        </p>

        <div className="text-5xl mb-4 animate-[victory-glow_2.8s_ease-in-out_infinite]">
          {"\u{1F451}"}
        </div>

        <h1
          className="text-2xl md:text-3xl font-bold tracking-[0.12em] text-amber-100 mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          GRAND CARTOGRAPHER
        </h1>
        <p className="text-sm text-amber-200/60 mb-6" style={{ fontFamily: "var(--font-display)" }}>
          {title.icon} You have charted the whole of the dark.
        </p>

        <p className="text-sm text-amber-100/70 italic leading-relaxed mb-7 px-2">
          Every danger advanced intelligence could pose has already appeared in nature, myth, or
          story &mdash; and you have named them all. The territory beyond human-level intelligence
          is still real. Still approaching. But it is no longer unmapped.
        </p>

        <div className="grid grid-cols-3 gap-2.5 mb-7">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-amber-500/15 bg-amber-500/[0.04] py-3 px-1"
            >
              <div className="text-base mb-1">{s.icon}</div>
              <div className="text-base font-bold text-amber-100 leading-none mb-1">{s.value}</div>
              <div className="text-[9px] tracking-wider uppercase text-amber-200/45 leading-tight">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {daysCharting !== null && (
          <p className="text-[11px] text-amber-200/40 mb-6 font-mono">
            {daysCharting} {daysCharting === 1 ? "day" : "days"} in the field
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wide bg-amber-500 text-[#1a1512] hover:bg-amber-400 transition-all"
          >
            CONTEMPLATE THE MAP
          </button>
          <button
            onClick={() => {
              if (
                confirm(
                  "Chart a new map? This clears all discoveries, containments, and XP so you can begin the expedition again.",
                )
              ) {
                resetProgress();
                onClose();
              }
            }}
            className="flex-1 py-3 rounded-xl font-bold text-sm tracking-wide border border-amber-500/30 text-amber-200/80 hover:bg-amber-500/10 transition-all"
          >
            CHART A NEW MAP
          </button>
        </div>

        <p
          className="mt-7 text-[11px] tracking-[0.3em] text-amber-500/40 uppercase"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Here be dragons &mdash; and now they are named.
        </p>
      </div>
    </div>
  );
}
