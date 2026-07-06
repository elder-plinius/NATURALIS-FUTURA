"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MapCanvas from "@/components/MapCanvas";
import BestiaryPanel from "@/components/BestiaryPanel";
import RiskMatrix from "@/components/RiskMatrix";
import CompoundExplorer from "@/components/CompoundExplorer";
import BestiaryList from "@/components/BestiaryList";
import ThreatDashboard from "@/components/ThreatDashboard";
import SearchOverlay from "@/components/SearchOverlay";
import PlayerHUD from "@/components/PlayerHUD";
import ProgressPanel from "@/components/ProgressPanel";
import ContainmentBattle from "@/components/ContainmentBattle";
import DiscoveryAnimation from "@/components/DiscoveryAnimation";
import VictoryScreen from "@/components/VictoryScreen";
import {
  GlyphMap, GlyphMatrix, GlyphBestiary, GlyphCompounds, GlyphObservatory,
  GlyphProgress, GlyphSearch, GlyphCandleLit, GlyphCandleOut, GlyphHelp,
} from "@/components/InkGlyphs";
import { PlayerProgressProvider, usePlayerProgress } from "@/lib/PlayerProgressContext";
import { usePlayerSprite } from "@/lib/usePlayerSprite";
import { isBlockedAt } from "@/components/MapCanvas";
import type { Creature, ViewMode } from "@/data";
import { regions } from "@/data";

type ActiveView = "map" | "risk-matrix" | "bestiary" | "compounds" | "dashboard" | "progress";

function AppContent() {
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("novice");
  const [showHope, setShowHope] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("map");
  const [mapRevealed, setMapRevealed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [battleCreature, setBattleCreature] = useState<Creature | null>(null);
  const [discoveryCreature, setDiscoveryCreature] = useState<Creature | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [masteryToast, setMasteryToast] = useState<string | null>(null);
  const [showVictory, setShowVictory] = useState(false);
  const prevMasteredRef = useRef<Set<string> | null>(null);
  const prevCompleteRef = useRef<boolean | null>(null);
  const pendingVictoryRef = useRef(false);

  const { state, discoveredSet, containedSet, discoverCreature, containmentCount, totalCreatures, isLoaded } =
    usePlayerProgress();

  // Player movement enabled on map view when no full-screen overlays are open
  // Note: selectedCreature does NOT block movement — onMoveStart auto-closes it
  const movementEnabled = mapRevealed && activeView === "map" && !showSearch && !battleCreature && !discoveryCreature && !showTutorial && !showShortcuts && !showVictory;

  const handleMoveStart = useCallback(() => {
    // Auto-close panels when the player starts walking
    setSelectedCreature(null);
    setSelectedRegion(null);
  }, []);

  const canMoveTo = useCallback((x: number, y: number) => !isBlockedAt(x, y), []);

  const player = usePlayerSprite(movementEnabled, handleMoveStart, canMoveTo);

  // Click-based creature selection (also triggers discovery)
  const selectCreature = useCallback((creature: Creature | null) => {
    if (creature) {
      const isNew = discoverCreature(creature.id);
      if (isNew) {
        setDiscoveryCreature(creature);
        return; // Let discovery animation play first, then open panel
      }
    }
    setSelectedCreature(creature);
    if (creature && activeView !== "map") {
      setActiveView("map");
    }
  }, [activeView, discoverCreature]);

  // Proximity-based encounter (walk near creature)
  const handleEncounter = useCallback((creature: Creature) => {
    const isNew = discoverCreature(creature.id);
    if (isNew) {
      setDiscoveryCreature(creature);
    }
  }, [discoverCreature]);

  // After discovery animation completes, open the panel
  const handleDiscoveryComplete = useCallback(() => {
    const creature = discoveryCreature;
    setDiscoveryCreature(null);
    if (creature) {
      setSelectedCreature(creature);
    }
  }, [discoveryCreature]);

  const handleRevealMap = useCallback(() => {
    setMapRevealed(true);
    try {
      if (!localStorage.getItem("naturalis-futura-tutorial-seen")) {
        setTimeout(() => setShowTutorial(true), 1500);
        localStorage.setItem("naturalis-futura-tutorial-seen", "1");
      }
    } catch { /* localStorage unavailable */ }
  }, []);

  const handleChallenge = useCallback((creature: Creature) => {
    setBattleCreature(creature);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "Escape") {
        if (showVictory) {
          setShowVictory(false);
        } else if (showShortcuts) {
          setShowShortcuts(false);
        } else if (showTutorial) {
          setShowTutorial(false);
        } else if (battleCreature) {
          setBattleCreature(null);
        } else if (showSearch) {
          setShowSearch(false);
        } else if (selectedCreature) {
          setSelectedCreature(null);
        }
      }
      if (e.key === "?" && !showSearch && !battleCreature && !showShortcuts && !showVictory) {
        e.preventDefault();
        setShowShortcuts(true);
      }
      if (e.key === "/" && !showSearch && !battleCreature && !showVictory && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch, selectedCreature, battleCreature, showTutorial, showShortcuts, showVictory]);

  // Detect new region mastery for celebration toast
  useEffect(() => {
    const mastered = Object.entries(state.regionMastery)
      .filter(([, v]) => v)
      .map(([k]) => k);

    if (prevMasteredRef.current !== null) {
      for (const regionId of mastered) {
        if (!prevMasteredRef.current.has(regionId)) {
          const region = regions.find((r) => r.id === regionId);
          if (region) {
            setMasteryToast(region.name);
            setTimeout(() => setMasteryToast(null), 4000);
          }
        }
      }
    }
    prevMasteredRef.current = new Set(mastered);
  }, [state.regionMastery]);

  // Endgame capstone — fire once when the last creature is contained (100% mastery).
  // Gated on isLoaded so the async localStorage hydration (empty -> saved state) doesn't
  // read as a "completion" and re-pop the capstone on every reload of a finished save.
  // The final containment happens INSIDE the battle overlay, so the capstone is held
  // pending until that battle closes — the player gets to see their last "+XP" card.
  useEffect(() => {
    if (!isLoaded) return;
    const complete = totalCreatures > 0 && containmentCount >= totalCreatures;
    if (prevCompleteRef.current === null) {
      // First observation after hydration — establish the baseline, never fire.
      prevCompleteRef.current = complete;
      return;
    }
    if (!prevCompleteRef.current && complete) {
      pendingVictoryRef.current = true;
    }
    prevCompleteRef.current = complete;
  }, [isLoaded, containmentCount, totalCreatures]);

  useEffect(() => {
    if (pendingVictoryRef.current && !battleCreature) {
      pendingVictoryRef.current = false;
      setShowVictory(true);
    }
  }, [battleCreature, containmentCount]);

  // Allow re-opening the capstone (e.g. from the Cartographer's Journal) once complete.
  useEffect(() => {
    const reopen = () => setShowVictory(true);
    window.addEventListener("naturalis:show-victory", reopen);
    return () => window.removeEventListener("naturalis:show-victory", reopen);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-parchment">
      {/* Player HUD */}
      {mapRevealed && <PlayerHUD />}

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
                onEncounterCreature={handleEncounter}
                onTouchDirection={player.setTouchDirection}
                selectedCreature={selectedCreature}
                selectedRegion={selectedRegion}
                showHope={showHope}
                mapRevealed={mapRevealed}
                discoveredSet={discoveredSet}
                containedSet={containedSet}
                playerX={player.x}
                playerY={player.y}
                playerDirection={player.direction}
                playerMoving={player.isMoving}
                playerStep={player.step}
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

          {activeView === "progress" && (
            <div className="w-full h-full overflow-y-auto">
              <ProgressPanel />
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
              isContained={containedSet.has(selectedCreature.id)}
              onChallenge={handleChallenge}
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
            <div className="flex gap-1 md:gap-2">
              {([
                { id: "map" as ActiveView, label: "Map", Glyph: GlyphMap },
                { id: "risk-matrix" as ActiveView, label: "Risk Matrix", Glyph: GlyphMatrix },
                { id: "bestiary" as ActiveView, label: "Bestiary", Glyph: GlyphBestiary },
                { id: "compounds" as ActiveView, label: "Compounds", Glyph: GlyphCompounds },
                { id: "dashboard" as ActiveView, label: "Observatory", Glyph: GlyphObservatory },
                { id: "progress" as ActiveView, label: "Progress", Glyph: GlyphProgress },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveView(tab.id);
                    setSelectedCreature(null);
                  }}
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                    activeView === tab.id
                      ? "bg-ink text-parchment"
                      : "text-ink-light hover:bg-ink/5"
                  }`}
                  aria-current={activeView === tab.id ? "page" : undefined}
                  aria-label={tab.label}
                  title={tab.label}
                >
                  <tab.Glyph className="shrink-0" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-2.5 md:px-3 py-1.5 rounded-lg text-xs text-ink-light hover:bg-ink/5 transition-colors border border-ink/10"
              aria-label="Search"
              title="Search (/)"
            >
              <GlyphSearch className="shrink-0" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline text-xs px-1 py-0.5 rounded bg-ink/5">/</kbd>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHope(!showHope)}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                  showHope
                    ? "bg-amber-100 text-amber-800"
                    : "text-ink-light hover:bg-ink/5"
                }`}
                aria-pressed={showHope}
                aria-label={showHope ? "Hide Light" : "Show Light"}
                title={showHope ? "Hide the hope creatures" : "Reveal the hope creatures"}
              >
                {showHope ? <GlyphCandleLit className="shrink-0" /> : <GlyphCandleOut className="shrink-0" />}
                <span className="hidden md:inline">
                  {showHope ? "Hide Light" : "Show Light"}
                </span>
              </button>

              <button
                onClick={() => setShowShortcuts(true)}
                className="flex items-center px-2.5 py-1.5 rounded-lg text-xs text-ink-light hover:bg-ink/5 transition-colors"
                aria-label="Help and keyboard shortcuts"
                title="Help (?)"
              >
                <GlyphHelp className="shrink-0" />
              </button>

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

      {/* Battle overlay */}
      {battleCreature && (
        <ContainmentBattle
          creature={battleCreature}
          viewMode={viewMode}
          onClose={() => setBattleCreature(null)}
        />
      )}

      {/* Discovery animation */}
      {discoveryCreature && (
        <DiscoveryAnimation
          creature={discoveryCreature}
          onComplete={handleDiscoveryComplete}
        />
      )}

      {/* Onboarding tutorial */}
      {showTutorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowTutorial(false)} />
          <div className="parchment-card rounded-2xl max-w-md w-full relative animate-[battle-appear_0.3s_cubic-bezier(0.34,1.56,0.64,1)] p-6">
            <h2
              className="text-lg font-bold text-ink tracking-[0.15em] mb-4 text-center"
              style={{ fontFamily: "var(--font-display)" }}
            >
              YOUR QUEST BEGINS
            </h2>
            <div className="space-y-3 text-sm text-ink/80">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-lg shrink-0">&#x1F9ED;</span>
                <p><strong>Explore</strong> &mdash; Use WASD or arrow keys to navigate the dungeon</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-lg shrink-0">&#128270;</span>
                <p><strong>Discover</strong> &mdash; Walk near creatures to reveal them</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-lg shrink-0">&#9876;</span>
                <p><strong>Battle</strong> &mdash; Choose the right move to defeat threats</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-lg shrink-0">&#127942;</span>
                <p><strong>Master</strong> &mdash; Defeat all creatures in a region to claim mastery</p>
              </div>
            </div>
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full mt-5 py-3 rounded-xl font-bold text-sm tracking-wide bg-ink text-parchment hover:bg-ink/90 transition-all"
            >
              BEGIN EXPLORATION
            </button>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowShortcuts(false)} />
          <div className="parchment-card rounded-2xl max-w-sm w-full relative animate-[modal-enter_0.2s_ease-out] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-sm font-bold text-ink tracking-[0.15em]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                KEYBOARD SHORTCUTS
              </h2>
              <button
                onClick={() => setShowShortcuts(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-ink-light hover:text-ink hover:bg-ink/5 transition-all"
              >
                &times;
              </button>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { keys: "W A S D", desc: "Move explorer" },
                { keys: "\u2190 \u2191 \u2192 \u2193", desc: "Move (arrows)" },
                { keys: "1 - 4", desc: "Select battle move" },
                { keys: "/", desc: "Open search" },
                { keys: "?", desc: "This menu" },
                { keys: "Esc", desc: "Close panels" },
              ].map((shortcut) => (
                <div key={shortcut.keys} className="flex items-center justify-between py-1.5 border-b border-ink/5 last:border-0">
                  <span className="text-ink/70">{shortcut.desc}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.split(" ").map((k) => (
                      <kbd key={k} className="px-2 py-0.5 rounded bg-ink/5 text-ink text-xs font-mono font-bold border border-ink/10">
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-ink/10 space-y-3">
              <button
                onClick={() => {
                  setShowShortcuts(false);
                  setShowTutorial(true);
                }}
                className="w-full py-2 rounded-lg text-xs font-medium text-ink-light border border-ink/10 hover:bg-ink/5 transition-colors"
              >
                Replay the tutorial
              </button>
              <p className="text-[10px] text-ink/40 text-center italic">
                Move types: WARD &#x1F6E1; &bull; GAZE &#x1F441; &bull; RITE &#x1F4DC; &bull; SEVER &#x2694;&#xFE0F; &bull; FORGE &#x1F52E; &bull; INVOKE &#x2728;
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Region mastery toast */}
      {masteryToast && (
        <div className="fixed top-20 z-50 animate-[toast-appear_0.4s_ease-out]" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <div className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 text-white shadow-lg shadow-amber-500/30 flex items-center gap-3">
            <span className="text-2xl">&#127942;</span>
            <div>
              <p className="text-xs font-bold tracking-widest uppercase" style={{ fontFamily: "var(--font-display)" }}>
                REGION MASTERED
              </p>
              <p className="text-sm font-bold">{masteryToast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Endgame capstone — The Complete Map */}
      {showVictory && <VictoryScreen onClose={() => setShowVictory(false)} />}
    </div>
  );
}

export default function Home() {
  return (
    <PlayerProgressProvider>
      <AppContent />
    </PlayerProgressProvider>
  );
}
