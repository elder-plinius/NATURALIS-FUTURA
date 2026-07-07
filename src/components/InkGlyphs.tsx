"use client";

/**
 * Ink-line glyphs for shell chrome — single-weight SVG line work in
 * currentColor, replacing full-color emoji in nav and controls.
 * Creature icons remain emoji: they are the specimens, not the chrome.
 */

interface GlyphProps {
  className?: string;
}

const base = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true as const,
};

export function GlyphMap({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M1.5 3.5 L5.5 2 L10.5 3.5 L14.5 2 V12.5 L10.5 14 L5.5 12.5 L1.5 14 Z" />
      <path d="M5.5 2 V12.5 M10.5 3.5 V14" opacity="0.55" />
    </svg>
  );
}

export function GlyphMatrix({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2.5 1.5 V13.5 H14.5" />
      <circle cx="6" cy="10" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none" opacity="0.75" />
      <circle cx="12.5" cy="4" r="1.7" fill="currentColor" stroke="none" opacity="0.5" />
    </svg>
  );
}

export function GlyphBestiary({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 3.5 C6.5 2 4 2 2 2.8 V13 C4 12.2 6.5 12.2 8 13.5 C9.5 12.2 12 12.2 14 13 V2.8 C12 2 9.5 2 8 3.5 Z" />
      <path d="M8 3.5 V13.5" opacity="0.55" />
    </svg>
  );
}

export function GlyphCompounds({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="4" cy="4" r="2" />
      <circle cx="12" cy="5.5" r="2" />
      <circle cx="7.5" cy="12" r="2" />
      <path d="M5.8 4.6 L10.1 5.2 M5 5.8 L6.8 10.2 M11 7.2 L8.7 10.6" opacity="0.7" />
    </svg>
  );
}

export function GlyphObservatory({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 13.5 L12.5 3 M12.5 3 L14 4.5 M12.5 3 L11 1.5" />
      <path d="M5.5 10 L8 13.5 M8 13.5 H3" opacity="0.7" />
      <circle cx="13.2" cy="3.7" r="0.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function GlyphProgress({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 2 H11 V6.5 C11 8.5 9.5 10 8 10 C6.5 10 5 8.5 5 6.5 Z" />
      <path d="M5 3.5 H2.8 C2.8 6 4 7.2 5 7.4 M11 3.5 H13.2 C13.2 6 12 7.2 11 7.4" opacity="0.7" />
      <path d="M8 10 V12 M5.5 13.7 H10.5 M8 12 L8 12 C7 12 6 12.7 5.5 13.7 M8 12 C9 12 10 12.7 10.5 13.7" />
    </svg>
  );
}

export function GlyphSearch({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="6.7" cy="6.7" r="4.2" />
      <path d="M9.9 9.9 L14 14" />
    </svg>
  );
}

export function GlyphCandleLit({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M8 1.2 C9.2 2.6 9.5 3.6 8 5 C6.5 3.6 6.8 2.6 8 1.2 Z" fill="currentColor" stroke="none" opacity="0.85" />
      <path d="M6.2 6.5 H9.8 V14 H6.2 Z" />
      <path d="M8 6.5 V5.2" opacity="0.7" />
    </svg>
  );
}

export function GlyphCandleOut({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6.2 6.5 H9.8 V14 H6.2 Z" />
      <path d="M8 6.5 V5.2" opacity="0.7" />
      <path d="M7 2 C8 3 8.6 3.2 9.6 2.6" opacity="0.5" />
    </svg>
  );
}

export function GlyphHelp({ className }: GlyphProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="8" cy="8" r="6.3" />
      <path d="M6.2 6.2 C6.2 5 7 4.3 8 4.3 C9 4.3 9.8 5 9.8 6 C9.8 7.4 8 7.4 8 9" />
      <circle cx="8" cy="11.3" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}
