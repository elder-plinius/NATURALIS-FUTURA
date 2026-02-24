"use client";

import { useState, useCallback, useEffect } from "react";
import MapCanvas from "@/components/MapCanvas";
import BestiaryPanel from "@/components/BestiaryPanel";
import RiskMatrix from "@/components/RiskMatrix";
import CompoundExplorer from "@/components/CompoundExplorer";
import BestiaryList from "@/components/BestiaryList";
import ThreatDashboard from "@/components/ThreatDashboard";
import SearchOverlay from "@/components/SearchOverlay";
import type { Creature, ViewMode } from "@/data";

type ActiveView = "map" | "risk-matrix" | "bestiary" | "compounds" | "dashboard";

export default function Home() {
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("novice");
  const [showHope, setShowHope] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("map");
  const [mapRevealed, setMapRevealed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const selectCreature = useCallback((creature: Creature | null) => {
    setSelectedCreature(creature);
    if (creature && activeView !== "map") {
      setActiveView("map");
    }
  }, [activeView]);

  const handleRevealMap = useCallback(() => {
    setMapRevealed(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showSearch) {
          setShowSearch(false);
        } else if (selectedCreature) {
          setSelectedCreature(null);
        }
      }
      if (e.key === "/" && !showSearch && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, selectedCreature]);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-parchment">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Map / Active view */}
        <div
          className={`flex-1 overflow-hidden ${selectedCreature && activeView === "map" ? "hidden md:block" : ""}`}
        >
          {activeView === "map" && (
            <div
              className="w-full h-full relative"
              onClick={() => {
                if (!mapRevealed) handleRevealMap();
              }}
            >
              <MapCanvas
                onSelectCreature={(c) => selectCreature(c)}
                onSelectRegion={(id) => {
                  setSelectedRegion(id);
                  setSelectedCreature(null);
                }}
                selectedCreature={selectedCreature}
                selectedRegion={selectedRegion}
                showHope={showHope}
                mapRevealed={mapRevealed}
              />
            </div>
          )}

          {activeView === "risk-matrix" && (
            <div className="w-full h-full overflow-y-auto">
              <RiskMatrix
                onSelectCreature={(c) => selectCreature(c)}
                filterStatus={filterStatus}
              />
            </div>
          )}

          {activeView === "compounds" && (
            <div className="w-full h-full overflow-y-auto">
              <CompoundExplorer
                onSelectCreature={(c) => selectCreature(c)}
              />
            </div>
          )}

          {activeView === "bestiary" && (
            <div className="w-full h-full overflow-y-auto">
              <BestiaryList
                onSelectCreature={(c) => selectCreature(c)}
              />
            </div>
          )}

          {activeView === "dashboard" && (
            <div className="w-full h-full overflow-y-auto">
              <ThreatDashboard
                onSelectCreature={(c) => selectCreature(c)}
              />
            </div>
          )}
        </div>

        {/* Bestiary side panel */}
        {selectedCreature && (
          <div className="w-full md:w-[420px] lg:w-[480px] shrink-0 h-full overflow-hidden">
            <BestiaryPanel
              creature={selectedCreature}
              viewMode={viewMode}
              onClose={() => setSelectedCreature(null)}
              onSelectCreature={(c) => selectCreature(c)}
              onSetViewMode={setViewMode}
            />
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      {mapRevealed && (
        <nav
          className="shrink-0 border-t border-ink/10 bg-parchment/95 backdrop-blur-sm px-4 py-2"
          role="navigation"
          aria-label="Main navigation"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">
            {/* Left: view switchers */}
            <div className="flex gap-1 md:gap-2">
              {([
                { id: "map" as ActiveView, label: "Map", icon: "🗺️" },
                { id: "risk-matrix" as ActiveView, label: "Risk Matrix", icon: "📊" },
                { id: "bestiary" as ActiveView, label: "Bestiary", icon: "📖" },
                { id: "compounds" as ActiveView, label: "Compounds", icon: "⚡" },
                { id: "dashboard" as ActiveView, label: "Observatory", icon: "📡" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveView(tab.id);
                    setSelectedCreature(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    activeView === tab.id
                      ? "bg-ink text-parchment"
                      : "text-ink-light hover:bg-ink/5"
                  }`}
                  aria-current={activeView === tab.id ? "page" : undefined}
                >
                  <span className="hidden md:inline">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Center: search */}
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ink-light hover:bg-ink/5 transition-colors border border-ink/10"
            >
              <span>&#x1F50D;</span>
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline text-xs px-1 py-0.5 rounded bg-ink/5">
                /
              </kbd>
            </button>

            {/* Right: controls */}
            <div className="flex items-center gap-2">
              {/* Hope toggle */}
              <button
                onClick={() => setShowHope(!showHope)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  showHope
                    ? "bg-amber-100 text-amber-800"
                    : "text-ink-light hover:bg-ink/5"
                }`}
                aria-pressed={showHope}
              >
                <span>{showHope ? "☀️" : "🌑"}</span>
                <span className="hidden md:inline">
                  {showHope ? "Hide Light" : "Show Light"}
                </span>
              </button>

              {/* View mode */}
              <div className="hidden md:flex items-center gap-1 text-xs text-ink-light">
                {(["novice", "scholar", "cartographer"] as ViewMode[]).map(
                  (mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`px-2 py-1 rounded transition-colors ${
                        viewMode === mode
                          ? "bg-ink/10 text-ink font-medium"
                          : "hover:bg-ink/5"
                      }`}
                    >
                      {mode.charAt(0).toUpperCase() + mode.slice(1)}
                    </button>
                  ),
                )}
              </div>

              {/* Status filter for risk matrix */}
              {activeView === "risk-matrix" && (
                <div className="hidden md:flex items-center gap-1 text-xs">
                  {[null, "confirmed", "emerging", "theoretical"].map((status) => (
                    <button
                      key={status ?? "all"}
                      onClick={() => setFilterStatus(status)}
                      className={`px-2 py-1 rounded transition-colors ${
                        filterStatus === status
                          ? "bg-ink/10 text-ink font-medium"
                          : "text-ink-light hover:bg-ink/5"
                      }`}
                    >
                      {status ?? "All"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      )}

      {/* Search overlay */}
      {showSearch && (
        <SearchOverlay
          onSelectCreature={(c) => {
            selectCreature(c);
            setActiveView("map");
          }}
          onClose={() => setShowSearch(false)}
        />
      )}
    </div>
  );
}
