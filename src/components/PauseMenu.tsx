"use client";

import { useEffect, useState } from "react";
import { audio } from "@/lib/audio";
import { settings, useSettings } from "@/lib/settings";
import type { Quality } from "@/components/AtmosphereLayer";

/**
 * PauseMenu — the options screen, reached with Escape.
 *
 * Deliberately plain in structure: the game's own parchment vocabulary carries
 * the styling. Audio and graphics both persist to localStorage, so a returning
 * player keeps their settings.
 */

export default function PauseMenu({ onClose }: { onClose: () => void }) {
  const gfx = useSettings();
  // The audio store is a plain observable, not React state — mirror it locally.
  const [, force] = useState(0);
  useEffect(() => audio.subscribe(() => force((n) => n + 1)), []);
  const prefs = audio.prefs;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog" aria-modal="true" aria-label="Options"
    >
      <div className="w-full max-w-md rounded-lg border border-amber-900/40 bg-[#f1e7cd] p-6 shadow-2xl dark:bg-[#1c1710]">
        <h2 className="mb-1 text-center font-serif text-lg tracking-[0.28em] text-[#251a0e] dark:text-amber-100">
          PAVSA
        </h2>
        <p className="mb-5 text-center text-[11px] italic text-[#6b573b] dark:text-amber-200/50">
          The dungeon waits.
        </p>

        <Section title="Sound">
          <Toggle
            label="Muted" value={prefs.muted}
            onChange={(v) => { audio.unlock(); audio.setMuted(v); }}
          />
          <Slider
            label="Ambience" value={prefs.music} disabled={prefs.muted}
            onChange={(v) => { audio.unlock(); audio.setMusic(v); }}
          />
          <Slider
            label="Effects" value={prefs.sfx} disabled={prefs.muted}
            onChange={(v) => { audio.unlock(); audio.setSfx(v); audio.sfx("select"); }}
          />
        </Section>

        <Section title="Display">
          <Choice
            label="Atmosphere"
            value={gfx.quality}
            options={[["high", "High"], ["medium", "Medium"], ["low", "Off"]]}
            onChange={(v) => settings.set({ quality: v as Quality })}
          />
          <Toggle label="Camera shake" value={gfx.shake} onChange={(v) => settings.set({ shake: v })} />
          <Toggle label="On-screen hints" value={gfx.hints} onChange={(v) => settings.set({ hints: v })} />
        </Section>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded border border-[#251a0e] bg-[#251a0e] px-4 py-2.5 font-serif text-xs tracking-[0.2em] text-[#f1e7cd] transition hover:opacity-85"
        >
          RESUME
        </button>
        <p className="mt-3 text-center text-[10px] text-[#8a7352]">
          Esc to close · WASD to move · Shift to sprint · ? for all keys
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <h3 className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[#8a7352]">{title}</h3>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-[13px] text-[#251a0e] dark:text-amber-100/90">
      <span>{label}</span>
      <button
        type="button" role="switch" aria-checked={value} aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-5 w-9 shrink-0 rounded-full border transition ${
          value ? "border-amber-700 bg-amber-700/80" : "border-[#8a7352]/50 bg-[#8a7352]/20"
        }`}
      >
        <span className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-[#f1e7cd] transition-all ${value ? "left-[18px]" : "left-0.5"}`} />
      </button>
    </label>
  );
}

function Slider({ label, value, onChange, disabled }: {
  label: string; value: number; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <label className={`flex items-center justify-between gap-3 text-[13px] text-[#251a0e] dark:text-amber-100/90 ${disabled ? "opacity-40" : ""}`}>
      <span className="shrink-0">{label}</span>
      <input
        type="range" min={0} max={1} step={0.05} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1 w-40 cursor-pointer appearance-none rounded bg-[#8a7352]/35 accent-amber-700"
        aria-label={label}
      />
    </label>
  );
}

function Choice({ label, value, options, onChange }: {
  label: string; value: string; options: [string, string][]; onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-[13px] text-[#251a0e] dark:text-amber-100/90">
      <span>{label}</span>
      <div className="flex overflow-hidden rounded border border-[#8a7352]/50">
        {options.map(([v, name]) => (
          <button
            key={v} onClick={() => onChange(v)}
            className={`px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition ${
              value === v ? "bg-[#251a0e] text-[#f1e7cd]" : "text-[#6b573b] hover:bg-[#8a7352]/15"
            }`}
          >
            {name}
          </button>
        ))}
      </div>
    </div>
  );
}
