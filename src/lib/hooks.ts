"use client";

import { useState, useCallback } from "react";
import { ViewMode, Creature } from "@/data";

export function useMapState() {
  const [selectedCreature, setSelectedCreature] = useState<Creature | null>(
    null,
  );
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("novice");
  const [showHope, setShowHope] = useState(false);
  const [activeView, setActiveView] = useState<
    "map" | "risk-matrix" | "bestiary" | "compounds"
  >("map");
  const [mapRevealed, setMapRevealed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const selectCreature = useCallback((creature: Creature | null) => {
    setSelectedCreature(creature);
  }, []);

  const selectRegion = useCallback((regionId: string | null) => {
    setSelectedRegion(regionId);
    setSelectedCreature(null);
  }, []);

  const revealMap = useCallback(() => {
    setMapRevealed(true);
  }, []);

  return {
    selectedCreature,
    selectedRegion,
    viewMode,
    showHope,
    activeView,
    mapRevealed,
    searchQuery,
    selectCreature,
    selectRegion,
    setViewMode,
    setShowHope,
    setActiveView,
    revealMap,
    setSearchQuery,
  };
}
