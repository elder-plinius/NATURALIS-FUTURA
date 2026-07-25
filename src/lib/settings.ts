"use client";

import { useEffect, useState } from "react";
import type { Quality } from "@/components/AtmosphereLayer";

/**
 * settings.ts — player-facing options, persisted to localStorage.
 *
 * Deliberately tiny: a plain observable object plus a hook, rather than a
 * context provider, so any component can read settings without the whole tree
 * re-rendering when one slider moves.
 */

export interface Settings {
  quality: Quality;
  /** Camera shake on impacts. Off by default for anyone who finds it nauseating. */
  shake: boolean;
  /** Show the on-screen movement hints. */
  hints: boolean;
}

const KEY = "nf-settings-v1";
const DEFAULTS: Settings = { quality: "high", shake: true, hints: true };

function load(): Settings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch { /* fall through to defaults */ }
  return { ...DEFAULTS };
}

let current: Settings = load();
const listeners = new Set<() => void>();

export const settings = {
  get(): Settings { return current; },
  set(patch: Partial<Settings>) {
    current = { ...current, ...patch };
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch { /* private mode */ }
    listeners.forEach((f) => f());
  },
  subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
};

/** Re-reads on every change. Safe during SSR: starts from defaults, syncs on mount. */
export function useSettings(): Settings {
  const [s, setS] = useState<Settings>(DEFAULTS);
  useEffect(() => {
    setS(settings.get());
    return settings.subscribe(() => setS(settings.get()));
  }, []);
  return s;
}

/** Honours the OS-level reduced-motion preference as a hard override. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}
