"use client";

import { useState, useMemo } from "react";
import { allCreatures, Creature } from "@/data";

interface SearchOverlayProps {
  onSelectCreature: (creature: Creature) => void;
  onClose: () => void;
}

export default function SearchOverlay({
  onSelectCreature,
  onClose,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return allCreatures.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.id.includes(q) ||
        c.mythicOrigin.toLowerCase().includes(q) ||
        c.naturalAnalogue.toLowerCase().includes(q) ||
        c.sciFiEcho.toLowerCase().includes(q) ||
        c.technicalSpec.toLowerCase().includes(q) ||
        c.countermeasure.name.toLowerCase().includes(q) ||
        c.threatClass.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-sm flex items-start justify-center pt-[15vh]">
      <div className="w-full max-w-xl mx-4 parchment-card rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-ink/10">
          <div className="flex items-center gap-3">
            <span className="text-ink-light">&#x1F50D;</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, myth, species, author, or technical term..."
              className="flex-1 bg-transparent text-ink placeholder:text-ink-light/50 outline-none text-sm"
              autoFocus
            />
            <button
              onClick={onClose}
              className="text-ink-light hover:text-ink text-sm"
            >
              ESC
            </button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto">
            {results.map((creature) => (
              <button
                key={creature.id}
                onClick={() => {
                  onSelectCreature(creature);
                  onClose();
                }}
                className="w-full text-left px-4 py-3 hover:bg-ink/5 transition-colors border-b border-ink/5 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{creature.icon}</span>
                  <div>
                    <div className="text-sm font-bold text-ink">
                      {creature.name}
                    </div>
                    <div className="text-xs text-ink-light">
                      {creature.threatClass} — {creature.currentStatus.status}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && (
          <div className="p-8 text-center text-sm text-ink-light">
            No creatures found. The fog is thick here.
          </div>
        )}

        {query.length < 2 && (
          <div className="p-8 text-center text-sm text-ink-light">
            Type at least 2 characters to search the bestiary.
          </div>
        )}
      </div>
    </div>
  );
}
