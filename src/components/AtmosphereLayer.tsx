"use client";

import { useEffect, useRef } from "react";

/**
 * AtmosphereLayer — the lit air of the dungeon, drawn on canvas.
 *
 * CSS gradients can place a pool of light, but they cannot put anything *in*
 * it. This layer adds what makes a space feel occupied: embers rising off the
 * torch, dust that only catches the light when it drifts close enough, haze
 * that moves, and a flame flicker built from incommensurable sines rather than
 * a looping keyframe (which the eye reads as a loop within seconds).
 *
 * Two canvases, because one cannot do both jobs:
 *
 *   shadow  — normal blending. Paints darkness over the DOM world. A canvas
 *             composites internally first, so this is the only way to actually
 *             *subtract* light from what is underneath.
 *   glow    — mix-blend-mode: screen. Paints the flame, embers and haze so
 *             they ADD to the world (and punch back through the shadow pass).
 *
 * Both are driven by one animation loop. Pointer-transparent; decorative only.
 */

export type Quality = "high" | "medium" | "low";

interface Props {
  /** Torch position as viewport percentages (0-100), from the camera. */
  torchX: number;
  torchY: number;
  /** Region accent, used to tint the haze. */
  tint: string;
  quality: Quality;
  /** Extra flame agitation, 0-1 — encounters push this up. */
  agitation?: number;
}

interface Particle {
  x: number; y: number;      // viewport px
  vx: number; vy: number;
  life: number; maxLife: number;
  size: number;
  kind: "ember" | "mote";
}

const COUNTS: Record<Quality, { embers: number; motes: number; fog: number }> = {
  high: { embers: 30, motes: 55, fog: 5 },
  medium: { embers: 16, motes: 26, fog: 3 },
  low: { embers: 0, motes: 0, fog: 0 },
};

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return [176, 138, 62];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

export default function AtmosphereLayer({ torchX, torchY, tint, quality, agitation = 0 }: Props) {
  const shadowRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLCanvasElement>(null);
  // Live values read by the loop, so prop changes never restart it.
  const live = useRef({ torchX, torchY, tint, quality, agitation });
  live.current = { torchX, torchY, tint, quality, agitation };

  useEffect(() => {
    const shadow = shadowRef.current, glow = glowRef.current;
    if (!shadow || !glow) return;
    const sx = shadow.getContext("2d"), gx = glow.getContext("2d");
    if (!sx || !gx) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let w = 0, h = 0;
    const resize = () => {
      const r = shadow.getBoundingClientRect();
      w = r.width; h = r.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const [c, ctx] of [[shadow, sx], [glow, gx]] as const) {
        c.width = Math.max(1, Math.floor(w * dpr));
        c.height = Math.max(1, Math.floor(h * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(shadow);

    const particles: Particle[] = [];
    const fog = Array.from({ length: 8 }, () => ({
      x: Math.random(), y: Math.random(),
      r: 0.2 + Math.random() * 0.3,
      drift: 0.005 + Math.random() * 0.013,
      phase: Math.random() * Math.PI * 2,
    }));

    const spawn = (kind: "ember" | "mote", tx: number, ty: number): Particle => {
      if (kind === "ember") {
        // Embers are born at the flame and rise.
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * 24;
        return {
          x: tx + Math.cos(a) * d, y: ty + Math.sin(a) * d * 0.5,
          vx: (Math.random() - 0.5) * 9, vy: -13 - Math.random() * 24,
          life: 0, maxLife: 1.2 + Math.random() * 1.8,
          size: 0.8 + Math.random() * 1.4, kind,
        };
      }
      // Motes hang in the air anywhere on screen.
      return {
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
        life: 0, maxLife: 5 + Math.random() * 9,
        size: 0.6 + Math.random() * 1.1, kind,
      };
    };

    let raf = 0;
    let last = performance.now();
    let t = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      const { torchX: px, torchY: py, tint: tc, quality: q, agitation: ag } = live.current;
      const counts = COUNTS[q];
      const tx = (px / 100) * w;
      const ty = (py / 100) * h;
      const still = q === "low" || reduced;

      const flicker = still
        ? 1
        : 1 + (Math.sin(t * 7.3) * 0.03 + Math.sin(t * 13.1 + 1.7) * 0.02 + Math.sin(t * 23.7 + 0.4) * 0.012)
            * (1 + ag * 2.5);

      // ══ SHADOW PASS — the darkness the torch has to push back ══
      sx.clearRect(0, 0, w, h);
      const r = Math.min(w, h) * 0.5 * flicker;
      const dark = sx.createRadialGradient(tx, ty, r * 0.18, tx, ty, r * 1.45);
      dark.addColorStop(0, "rgba(6,4,2,0)");
      dark.addColorStop(0.42, "rgba(6,4,2,0.34)");
      dark.addColorStop(0.72, "rgba(5,3,2,0.72)");
      dark.addColorStop(1, "rgba(4,2,1,0.93)");
      sx.fillStyle = dark;
      sx.fillRect(0, 0, w, h);

      // Corner vignette, faintly tinted by the territory.
      const [vr, vg, vb] = hexToRgb(tc);
      const vig = sx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.38, w / 2, h / 2, Math.max(w, h) * 0.8);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, `rgba(${(vr * 0.16) | 0},${(vg * 0.14) | 0},${(vb * 0.14) | 0},0.5)`);
      sx.fillStyle = vig;
      sx.fillRect(0, 0, w, h);

      // ══ GLOW PASS — everything that emits ══
      gx.clearRect(0, 0, w, h);

      // The flame itself.
      const warm = gx.createRadialGradient(tx, ty, 0, tx, ty, r * 0.7);
      warm.addColorStop(0, `rgba(255,190,105,${0.3 * flicker})`);
      warm.addColorStop(0.35, "rgba(210,140,60,0.1)");
      warm.addColorStop(1, "rgba(0,0,0,0)");
      gx.fillStyle = warm;
      gx.fillRect(0, 0, w, h);

      if (still) return;

      // Haze — slow tinted blobs, only where the light reaches.
      gx.globalCompositeOperation = "lighter";
      for (let i = 0; i < counts.fog; i++) {
        const f = fog[i];
        const fx = (((f.x + t * f.drift) % 1.4) - 0.2) * w;
        const fy = (f.y + Math.sin(t * 0.09 + f.phase) * 0.04) * h;
        const fr = f.r * Math.min(w, h);
        const lit = Math.max(0.12, 1 - Math.hypot(fx - tx, fy - ty) / (r * 1.3));
        const g = gx.createRadialGradient(fx, fy, 0, fx, fy, fr);
        g.addColorStop(0, `rgba(${vr},${vg},${vb},${0.05 * lit})`);
        g.addColorStop(1, `rgba(${vr},${vg},${vb},0)`);
        gx.fillStyle = g;
        gx.beginPath();
        gx.arc(fx, fy, fr, 0, Math.PI * 2);
        gx.fill();
      }

      // Particles.
      let embers = 0, motes = 0;
      for (const p of particles) (p.kind === "ember" ? embers++ : motes++);
      if (embers < counts.embers) particles.push(spawn("ember", tx, ty));
      if (motes < counts.motes) particles.push(spawn("mote", tx, ty));

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life += dt;
        if (p.life > p.maxLife || p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) {
          particles.splice(i, 1);
          continue;
        }
        if (p.kind === "ember") {
          // Buoyancy plus a lateral wander, as hot air does.
          p.vy -= 7 * dt;
          p.vx += Math.sin(t * 3 + p.life * 5) * 9 * dt;
        } else {
          p.vx += Math.sin(t * 0.7 + p.y * 0.01) * 2.2 * dt;
          p.vy += Math.cos(t * 0.5 + p.x * 0.01) * 2.2 * dt;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        const fade = 1 - p.life / p.maxLife;
        // Only what the torch reaches is visible — this is the whole trick.
        const lit = Math.max(0, 1 - Math.hypot(p.x - tx, p.y - ty) / r);

        if (p.kind === "ember") {
          const a = fade * fade * 0.9 * (0.4 + lit * 0.6);
          gx.fillStyle = `rgba(255,${170 + ((fade * 60) | 0)},${60 + ((fade * 70) | 0)},${a})`;
          gx.beginPath();
          gx.arc(p.x, p.y, p.size * (0.6 + fade * 0.6), 0, Math.PI * 2);
          gx.fill();
        } else {
          const a = Math.sin((p.life / p.maxLife) * Math.PI) * 0.6 * lit * lit;
          if (a > 0.004) {
            gx.fillStyle = `rgba(255,240,205,${a})`;
            gx.beginPath();
            gx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            gx.fill();
          }
        }
      }
      gx.globalCompositeOperation = "source-over";
    };

    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <>
      <canvas ref={shadowRef} aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 21 }} />
      <canvas ref={glowRef} aria-hidden
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 22, mixBlendMode: "screen" }} />
    </>
  );
}
