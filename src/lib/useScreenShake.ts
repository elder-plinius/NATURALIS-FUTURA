"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { settings, usePrefersReducedMotion } from "@/lib/settings";

/**
 * useScreenShake — impact feedback for the viewport.
 *
 * Returns a CSS transform to spread on a wrapper element plus a `fire()` to
 * kick it. The offset is noise-driven and decays exponentially, which reads as
 * an impact; a fixed sine reads as a wobble.
 *
 * Silently does nothing when the player has turned shake off or the OS asks
 * for reduced motion, so call sites never need to check.
 */
export interface ScreenShake {
  fire: (intensity?: number) => void;
  transform: string;
}

export function useScreenShake(): ScreenShake {
  const [transform, setTransform] = useState("none");
  const amp = useRef(0);
  const raf = useRef(0);
  const running = useRef(false);
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const tick = useCallback(() => {
    amp.current *= 0.88;
    if (amp.current < 0.35) {
      amp.current = 0;
      running.current = false;
      setTransform("none");
      return;
    }
    const a = amp.current;
    const dx = (Math.random() * 2 - 1) * a;
    const dy = (Math.random() * 2 - 1) * a;
    const rot = (Math.random() * 2 - 1) * a * 0.06;
    setTransform(`translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rot.toFixed(3)}deg)`);
    raf.current = requestAnimationFrame(tick);
  }, []);

  const fire = useCallback((intensity = 0.5) => {
    if (reducedRef.current || !settings.get().shake) return;
    amp.current = Math.max(amp.current, 4 + intensity * 16);
    if (!running.current) {
      running.current = true;
      raf.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  return { fire, transform };
}
