"use client";

/**
 * Ink-toned status seal — one shared badge system for creature status,
 * drawn in iron-gall pigments instead of SaaS pastel chips.
 */
const SEAL_PIGMENTS: Record<string, { ink: string; pulse: boolean }> = {
  confirmed: { ink: "#7f1d1d", pulse: true },
  emerging: { ink: "#92400e", pulse: false },
  theoretical: { ink: "#57534e", pulse: false },
};

export default function StatusSeal({ status }: { status: string }) {
  const pigment = SEAL_PIGMENTS[status] ?? SEAL_PIGMENTS.theoretical;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase shrink-0"
      style={{
        color: pigment.ink,
        border: `1px solid ${pigment.ink}59`,
        backgroundColor: `${pigment.ink}0a`,
        fontFamily: "var(--font-display)",
      }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${pigment.pulse ? "animate-pulse" : ""}`}
        style={{ backgroundColor: pigment.ink }}
      />
      {status}
    </span>
  );
}
