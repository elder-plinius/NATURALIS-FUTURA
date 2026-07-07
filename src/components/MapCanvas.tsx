"use client";

import { useEffect, useRef, useMemo, useState } from "react";
import { regions, allCreatures, hopeCreatures, getCreaturesByRegion } from "@/data";
import type { Creature, Region } from "@/data";
import type { Direction } from "@/lib/usePlayerSprite";

// ── World configuration ──
const WORLD_SCALE = 9;
const ENCOUNTER_DISTANCE = 0.012;
const HINT_DISTANCE = ENCOUNTER_DISTANCE * 3;
const TORCH_RADIUS = 0.05; // creatures within this range are dimly visible even if undiscovered

// ── Obstacle types ──
export type ObstacleType = "wall" | "hedge" | "ruin" | "water" | "rock";

export interface Obstacle {
  x: number; y: number; w: number; h: number;
  type: ObstacleType;
}

// ── OBSTACLE DATA ──
export const WORLD_OBSTACLES: Obstacle[] = [
  // ═══════════════════════════════════════════════════════
  // BORDER WALLS — region boundaries with passage gaps
  // ═══════════════════════════════════════════════════════

  // ─── Row 1↔2: Abyss/Siren ↔ Throne Room (y ≈ 0.278) ───
  { x: 0.02, y: 0.278, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.18, y: 0.278, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.34, y: 0.278, w: 0.13, h: 0.005, type: "wall" },
  { x: 0.52, y: 0.278, w: 0.15, h: 0.005, type: "wall" },
  { x: 0.71, y: 0.278, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.85, y: 0.278, w: 0.13, h: 0.005, type: "wall" },

  // ─── Row 2↔3: Throne Room ↔ Hive/Mirror (y ≈ 0.471) ───
  { x: 0.02, y: 0.471, w: 0.16, h: 0.005, type: "wall" },
  { x: 0.22, y: 0.471, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.39, y: 0.471, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.52, y: 0.471, w: 0.19, h: 0.005, type: "wall" },
  { x: 0.75, y: 0.471, w: 0.23, h: 0.005, type: "wall" },

  // ─── Row 3↔4: Hive/Mirror ↔ Spawning/Colosseum (y ≈ 0.714) ───
  { x: 0.02, y: 0.714, w: 0.14, h: 0.005, type: "wall" },
  { x: 0.20, y: 0.714, w: 0.13, h: 0.005, type: "wall" },
  { x: 0.38, y: 0.714, w: 0.09, h: 0.005, type: "wall" },
  { x: 0.52, y: 0.714, w: 0.14, h: 0.005, type: "wall" },
  { x: 0.70, y: 0.714, w: 0.28, h: 0.005, type: "wall" },

  // ─── Row 4↔5: Spawning/Colosseum ↔ Catacombs (y ≈ 0.928) ───
  { x: 0.02, y: 0.928, w: 0.20, h: 0.005, type: "wall" },
  { x: 0.26, y: 0.928, w: 0.21, h: 0.005, type: "wall" },
  { x: 0.52, y: 0.928, w: 0.21, h: 0.005, type: "wall" },
  { x: 0.77, y: 0.928, w: 0.21, h: 0.005, type: "wall" },

  // ─── Vertical: Abyss | Siren-Sea ───
  { x: 0.479, y: 0.02, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.479, y: 0.14, w: 0.005, h: 0.138, type: "wall" },

  // ─── Vertical: Hive | Mirror-Dark ───
  { x: 0.479, y: 0.49, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.479, y: 0.60, w: 0.005, h: 0.114, type: "wall" },

  // ─── Vertical: Spawning | Colosseum ───
  { x: 0.479, y: 0.73, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.479, y: 0.83, w: 0.005, h: 0.098, type: "wall" },

  // ═══════════════════════════════════════════════════════
  // THE ABYSS — Dark labyrinth (x: 0.03-0.47, y: 0.02-0.27)
  // ═══════════════════════════════════════════════════════

  // Outer corridor L-shape
  { x: 0.06, y: 0.04, w: 0.005, h: 0.10, type: "wall" },
  { x: 0.06, y: 0.04, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.18, y: 0.04, w: 0.005, h: 0.06, type: "wall" },
  // Inner maze walls
  { x: 0.10, y: 0.10, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.20, y: 0.10, w: 0.005, h: 0.06, type: "wall" },
  // Deeper corridors
  { x: 0.25, y: 0.05, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.25, y: 0.13, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.35, y: 0.06, w: 0.005, h: 0.07, type: "wall" },
  { x: 0.35, y: 0.06, w: 0.08, h: 0.005, type: "wall" },
  // Inner chambers
  { x: 0.10, y: 0.17, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.30, y: 0.19, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.30, y: 0.19, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.40, y: 0.14, w: 0.005, h: 0.08, type: "wall" },
  // Abyss ruins
  { x: 0.14, y: 0.07, w: 0.012, h: 0.015, type: "ruin" },
  { x: 0.28, y: 0.22, w: 0.015, h: 0.012, type: "ruin" },
  { x: 0.42, y: 0.10, w: 0.012, h: 0.018, type: "ruin" },
  // Abyss rocks
  { x: 0.08, y: 0.24, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.38, y: 0.24, w: 0.010, h: 0.008, type: "rock" },
  // Abyss hedge
  { x: 0.03, y: 0.18, w: 0.04, h: 0.004, type: "hedge" },

  // ═══════════════════════════════════════════════════════
  // SIREN-SEA — Coastal labyrinth (x: 0.50-0.96, y: 0.02-0.27)
  // ═══════════════════════════════════════════════════════

  // Coastal walls
  { x: 0.55, y: 0.05, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.55, y: 0.05, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.65, y: 0.05, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.72, y: 0.04, w: 0.005, h: 0.10, type: "wall" },
  { x: 0.72, y: 0.04, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.84, y: 0.04, w: 0.005, h: 0.07, type: "wall" },
  // Inner passages
  { x: 0.58, y: 0.13, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.78, y: 0.12, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.78, y: 0.20, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.88, y: 0.12, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.55, y: 0.20, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.67, y: 0.15, w: 0.005, h: 0.10, type: "wall" },
  // Siren water pools
  { x: 0.62, y: 0.08, w: 0.025, h: 0.020, type: "water" },
  { x: 0.82, y: 0.16, w: 0.030, h: 0.020, type: "water" },
  { x: 0.92, y: 0.08, w: 0.025, h: 0.030, type: "water" },
  // Siren hedges
  { x: 0.52, y: 0.14, w: 0.004, h: 0.06, type: "hedge" },
  { x: 0.90, y: 0.22, w: 0.05, h: 0.004, type: "hedge" },
  // Siren rocks
  { x: 0.60, y: 0.23, w: 0.008, h: 0.010, type: "rock" },
  { x: 0.75, y: 0.07, w: 0.010, h: 0.008, type: "rock" },
  { x: 0.94, y: 0.24, w: 0.008, h: 0.008, type: "rock" },

  // ═══════════════════════════════════════════════════════
  // THRONE ROOM — Grand corridors (x: 0.03-0.96, y: 0.29-0.46)
  // ═══════════════════════════════════════════════════════

  // Grand hall pillared corridor
  { x: 0.30, y: 0.30, w: 0.005, h: 0.14, type: "wall" },
  { x: 0.66, y: 0.30, w: 0.005, h: 0.14, type: "wall" },
  // West wing
  { x: 0.10, y: 0.35, w: 0.18, h: 0.005, type: "wall" },
  { x: 0.10, y: 0.35, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.10, y: 0.43, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.06, y: 0.30, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.20, y: 0.40, w: 0.005, h: 0.06, type: "wall" },
  // East wing
  { x: 0.70, y: 0.35, w: 0.16, h: 0.005, type: "wall" },
  { x: 0.86, y: 0.35, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.78, y: 0.43, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.92, y: 0.30, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.76, y: 0.40, w: 0.005, h: 0.06, type: "wall" },
  // Throne approach corridor
  { x: 0.42, y: 0.33, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.54, y: 0.33, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.42, y: 0.42, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.54, y: 0.42, w: 0.005, h: 0.04, type: "wall" },
  // Throne pillar ruins
  { x: 0.36, y: 0.32, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.60, y: 0.32, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.36, y: 0.43, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.60, y: 0.43, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.48, y: 0.38, w: 0.015, h: 0.015, type: "ruin" },
  // Throne hedges
  { x: 0.14, y: 0.31, w: 0.06, h: 0.004, type: "hedge" },
  { x: 0.78, y: 0.31, w: 0.06, h: 0.004, type: "hedge" },

  // ═══════════════════════════════════════════════════════
  // THE HIVE — Dense organic maze (x: 0.03-0.47, y: 0.49-0.71)
  // ═══════════════════════════════════════════════════════

  // Top honeycomb structure
  { x: 0.08, y: 0.51, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.08, y: 0.51, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.18, y: 0.51, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.13, y: 0.57, w: 0.08, h: 0.005, type: "wall" },
  // Central hive
  { x: 0.24, y: 0.52, w: 0.005, h: 0.10, type: "wall" },
  { x: 0.24, y: 0.52, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.32, y: 0.52, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.28, y: 0.62, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.36, y: 0.58, w: 0.005, h: 0.08, type: "wall" },
  // Lower passages
  { x: 0.06, y: 0.63, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.06, y: 0.63, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.14, y: 0.63, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.10, y: 0.69, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.38, y: 0.66, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.42, y: 0.52, w: 0.005, h: 0.06, type: "wall" },
  // Hive hedges (organic barriers)
  { x: 0.16, y: 0.50, w: 0.004, h: 0.04, type: "hedge" },
  { x: 0.40, y: 0.62, w: 0.004, h: 0.05, type: "hedge" },
  { x: 0.20, y: 0.68, w: 0.05, h: 0.004, type: "hedge" },
  // Hive rocks
  { x: 0.04, y: 0.55, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.44, y: 0.69, w: 0.008, h: 0.010, type: "rock" },

  // ═══════════════════════════════════════════════════════
  // MIRROR-DARK — Symmetric halls (x: 0.50-0.96, y: 0.49-0.71)
  // ═══════════════════════════════════════════════════════

  // Symmetric left wing
  { x: 0.56, y: 0.51, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.56, y: 0.51, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.64, y: 0.51, w: 0.005, h: 0.04, type: "wall" },
  // Symmetric right wing (mirror)
  { x: 0.90, y: 0.51, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.82, y: 0.51, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.82, y: 0.51, w: 0.005, h: 0.04, type: "wall" },
  // Central mirror corridor
  { x: 0.70, y: 0.54, w: 0.005, h: 0.10, type: "wall" },
  { x: 0.76, y: 0.54, w: 0.005, h: 0.10, type: "wall" },
  // Lower mirror halls
  { x: 0.54, y: 0.64, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.80, y: 0.64, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.60, y: 0.64, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.86, y: 0.64, w: 0.005, h: 0.05, type: "wall" },
  // Mirror pools (reflecting surfaces)
  { x: 0.58, y: 0.56, w: 0.030, h: 0.020, type: "water" },
  { x: 0.86, y: 0.56, w: 0.030, h: 0.020, type: "water" },
  { x: 0.72, y: 0.66, w: 0.020, h: 0.025, type: "water" },
  // Mirror hedges
  { x: 0.52, y: 0.68, w: 0.05, h: 0.004, type: "hedge" },
  { x: 0.92, y: 0.68, w: 0.004, h: 0.04, type: "hedge" },
  // Mirror ruins
  { x: 0.66, y: 0.52, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.78, y: 0.52, w: 0.012, h: 0.012, type: "ruin" },

  // ═══════════════════════════════════════════════════════
  // SPAWNING GROUNDS — Natural caverns (x: 0.03-0.47, y: 0.73-0.92)
  // ═══════════════════════════════════════════════════════

  // Cave walls
  { x: 0.08, y: 0.75, w: 0.005, h: 0.08, type: "wall" },
  { x: 0.08, y: 0.75, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.22, y: 0.78, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.15, y: 0.84, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.32, y: 0.76, w: 0.005, h: 0.10, type: "wall" },
  { x: 0.32, y: 0.76, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.40, y: 0.82, w: 0.005, h: 0.06, type: "wall" },
  { x: 0.10, y: 0.89, w: 0.14, h: 0.005, type: "wall" },
  // Spawning pools
  { x: 0.12, y: 0.79, w: 0.040, h: 0.025, type: "water" },
  { x: 0.35, y: 0.88, w: 0.045, h: 0.020, type: "water" },
  { x: 0.25, y: 0.82, w: 0.025, h: 0.030, type: "water" },
  // Spawning rocks
  { x: 0.05, y: 0.86, w: 0.010, h: 0.012, type: "rock" },
  { x: 0.18, y: 0.76, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.28, y: 0.90, w: 0.010, h: 0.008, type: "rock" },
  { x: 0.44, y: 0.78, w: 0.008, h: 0.010, type: "rock" },
  // Spawning hedges
  { x: 0.06, y: 0.82, w: 0.004, h: 0.05, type: "hedge" },
  { x: 0.38, y: 0.86, w: 0.004, h: 0.04, type: "hedge" },

  // ═══════════════════════════════════════════════════════
  // COLOSSEUM — Arena structure (x: 0.50-0.96, y: 0.73-0.92)
  // ═══════════════════════════════════════════════════════

  // Arena outer north wall (gap in center)
  { x: 0.58, y: 0.76, w: 0.10, h: 0.005, type: "wall" },
  { x: 0.76, y: 0.76, w: 0.10, h: 0.005, type: "wall" },
  // Arena outer south wall (gap in center)
  { x: 0.58, y: 0.87, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.78, y: 0.87, w: 0.08, h: 0.005, type: "wall" },
  // Arena side walls (with entrance gaps)
  { x: 0.58, y: 0.76, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.58, y: 0.84, w: 0.005, h: 0.03, type: "wall" },
  { x: 0.86, y: 0.76, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.86, y: 0.85, w: 0.005, h: 0.02, type: "wall" },
  // Inner tier walls
  { x: 0.63, y: 0.79, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.81, y: 0.79, w: 0.005, h: 0.05, type: "wall" },
  { x: 0.66, y: 0.84, w: 0.12, h: 0.005, type: "wall" },
  // Outside arena
  { x: 0.52, y: 0.90, w: 0.12, h: 0.005, type: "wall" },
  { x: 0.82, y: 0.90, w: 0.12, h: 0.005, type: "wall" },
  // Colosseum pillar ruins
  { x: 0.65, y: 0.81, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.80, y: 0.81, w: 0.012, h: 0.012, type: "ruin" },
  { x: 0.73, y: 0.82, w: 0.015, h: 0.015, type: "ruin" },
  // Colosseum rocks
  { x: 0.54, y: 0.74, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.94, y: 0.90, w: 0.010, h: 0.008, type: "rock" },
  // Colosseum hedge
  { x: 0.52, y: 0.75, w: 0.004, h: 0.04, type: "hedge" },

  // ═══════════════════════════════════════════════════════
  // CATACOMBS — Dense underground maze (x: 0.03-0.96, y: 0.94-0.99)
  // ═══════════════════════════════════════════════════════

  // Dense maze corridors
  { x: 0.08, y: 0.95, w: 0.005, h: 0.03, type: "wall" },
  { x: 0.08, y: 0.95, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.20, y: 0.94, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.20, y: 0.96, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.32, y: 0.95, w: 0.005, h: 0.03, type: "wall" },
  { x: 0.38, y: 0.94, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.38, y: 0.94, w: 0.06, h: 0.005, type: "wall" },
  { x: 0.50, y: 0.95, w: 0.005, h: 0.03, type: "wall" },
  { x: 0.56, y: 0.94, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.64, y: 0.94, w: 0.005, h: 0.04, type: "wall" },
  { x: 0.70, y: 0.96, w: 0.08, h: 0.005, type: "wall" },
  { x: 0.82, y: 0.95, w: 0.005, h: 0.03, type: "wall" },
  { x: 0.88, y: 0.94, w: 0.005, h: 0.04, type: "wall" },
  // Catacomb ruins
  { x: 0.14, y: 0.97, w: 0.015, h: 0.012, type: "ruin" },
  { x: 0.45, y: 0.96, w: 0.012, h: 0.015, type: "ruin" },
  { x: 0.75, y: 0.97, w: 0.015, h: 0.012, type: "ruin" },
  // Catacomb rocks
  { x: 0.26, y: 0.97, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.60, y: 0.97, w: 0.008, h: 0.008, type: "rock" },
  { x: 0.92, y: 0.96, w: 0.010, h: 0.010, type: "rock" },
];

const PLAYER_RADIUS = 0.002;

export function isBlockedAt(px: number, py: number): boolean {
  for (const obs of WORLD_OBSTACLES) {
    if (
      px + PLAYER_RADIUS > obs.x &&
      px - PLAYER_RADIUS < obs.x + obs.w &&
      py + PLAYER_RADIUS > obs.y &&
      py - PLAYER_RADIUS < obs.y + obs.h
    ) return true;
  }
  return false;
}

// ── Props ──
interface MapCanvasProps {
  onSelectCreature: (creature: Creature) => void;
  onSelectRegion: (regionId: string) => void;
  onEncounterCreature?: (creature: Creature) => void;
  onTouchDirection?: (dir: Direction, held: boolean) => void;
  selectedCreature: Creature | null;
  selectedRegion: string | null;
  showHope: boolean;
  mapRevealed: boolean;
  discoveredSet?: Set<string>;
  containedSet?: Set<string>;
  playerX?: number;
  playerY?: number;
  playerDirection?: Direction;
  playerMoving?: boolean;
  playerStep?: number;
}

const REGION_COLORS: Record<string, { accent: string; glow: string }> = {
  abyss: { accent: "#7c3aed", glow: "124, 58, 237" },
  "siren-sea": { accent: "#f59e0b", glow: "245, 158, 11" },
  "throne-room": { accent: "#ca8a04", glow: "202, 138, 4" },
  hive: { accent: "#eab308", glow: "234, 179, 8" },
  "mirror-dark": { accent: "#93c5fd", glow: "147, 197, 253" },
  "spawning-grounds": { accent: "#06b6d4", glow: "6, 182, 212" },
  colosseum: { accent: "#ea580c", glow: "234, 88, 12" },
  catacombs: { accent: "#00ff88", glow: "0, 255, 136" },
};

// ── Obstacle visual styles ──
const OBS_STYLES: Record<ObstacleType, { bg: string; border: string; radius: string }> = {
  wall: { bg: "linear-gradient(135deg, #4a3f35, #3a3028, #4a3f35)", border: "1px solid #2a2218", radius: "1px" },
  hedge: { bg: "linear-gradient(135deg, #1a3a1a, #2a4a2a, #1a3a1a)", border: "1px solid #0a2a0a", radius: "3px" },
  ruin: { bg: "linear-gradient(145deg, #3a3530, #4a4540, #3a3530)", border: "1px dashed #2a2520", radius: "2px" },
  water: { bg: "linear-gradient(135deg, #1a3a5a, #2a4a6a, #1a3a5a)", border: "1px solid #0a2a4a", radius: "6px" },
  rock: { bg: "radial-gradient(ellipse, #3a3a3a, #2a2a2a)", border: "1px solid #1a1a1a", radius: "50%" },
};

// ── Player Sprite (explorer character) ──
function PlayerSprite({ direction, isMoving, step }: { direction: Direction; isMoving: boolean; step: number }) {
  const bobY = isMoving ? [0, -2, 0, -2][step] : 0;
  const leftLeg = isMoving ? [-3, 0, 3, 0][step] : 0;
  const rightLeg = isMoving ? [3, 0, -3, 0][step] : 0;
  const leftArm = isMoving ? [12, 0, -12, 0][step] : 0;
  const rightArm = isMoving ? [-12, 0, 12, 0][step] : 0;
  const facingLeft = direction === "left";
  const facingUp = direction === "up";

  return (
    <div style={{
      transform: `translateY(${bobY}px) scaleX(${facingLeft ? -1 : 1})`,
      transition: "transform 50ms linear",
    }}>
      <svg width="48" height="62" viewBox="0 0 28 36" className="drop-shadow-[0_2px_8px_rgba(255,200,100,0.6)]">
        {/* Torch glow around sprite */}
        <circle cx="14" cy="18" r="20" fill="url(#torchGlow)" opacity="0.3" />
        <defs>
          <radialGradient id="torchGlow">
            <stop offset="0%" stopColor="#ffcc66" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ffcc66" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Hat */}
        <ellipse cx="14" cy="6" rx="10" ry="5" fill="#8B4513" />
        <ellipse cx="14" cy="5" rx="7" ry="4" fill="#A0522D" />
        <rect x="7" y="4" width="14" height="2" rx="1" fill="#8B4513" />

        {/* Head */}
        <rect x="8" y="8" width="12" height="10" rx="3" fill="#F5D0A9" />
        {!facingUp && <>
          <circle cx="11" cy="13" r="1.2" fill="#2c1810" />
          <circle cx="17" cy="13" r="1.2" fill="#2c1810" />
          <ellipse cx="14" cy="16" rx="1.5" ry="0.5" fill="#C98B6A" />
        </>}

        {/* Explorer coat */}
        <rect x="6" y="18" width="16" height="10" rx="2" fill="#2E6B30" />
        <line x1="14" y1="18" x2="14" y2="28" stroke="#1B4D1D" strokeWidth="0.5" />
        <rect x="7" y="24" width="14" height="2" rx="1" fill="#8B4513" />
        <rect x="12.5" y="23.5" width="3" height="3" rx="1" fill="#CD853F" />

        {/* Arms */}
        <rect x="3" y="19" width="4" height="8" rx="2" fill="#2E6B30" transform={`rotate(${leftArm}, 5, 19)`} />
        <rect x="21" y="19" width="4" height="8" rx="2" fill="#2E6B30" transform={`rotate(${rightArm}, 23, 19)`} />

        {/* Legs */}
        <rect x="8" y="27" width="4" height="7" rx="2" fill="#5C3317" transform={`translate(${leftLeg}, 0)`} />
        <rect x="16" y="27" width="4" height="7" rx="2" fill="#5C3317" transform={`translate(${rightLeg}, 0)`} />

        {/* Boots */}
        <ellipse cx={10 + leftLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
        <ellipse cx={18 + rightLeg} cy="34" rx="3" ry="2" fill="#3B1E0E" />
      </svg>
    </div>
  );
}

// ── Creature Node ──
function CreatureNode({
  creature, onSelect, isSelected, isConnected, isDiscovered, isContained, isNearPlayer, distToPlayer,
}: {
  creature: Creature; onSelect: (c: Creature) => void; isSelected: boolean;
  isConnected: boolean; isDiscovered: boolean; isContained: boolean; isNearPlayer: boolean; distToPlayer: number;
}) {
  const regionColor = REGION_COLORS[creature.region] ?? { accent: "#7c3aed", glow: "124, 58, 237" };
  const composite = creature.threatGradient.likelihood + creature.threatGradient.impact + creature.threatGradient.detectability;

  // Dungeon crawler: undiscovered creatures far from player are invisible
  const inTorchRange = distToPlayer < TORCH_RADIUS;
  if (!isDiscovered && !inTorchRange) return null;

  const statusClass = isDiscovered
    ? creature.currentStatus.status === "confirmed" ? "status-alert" : creature.currentStatus.status === "emerging" ? "status-breathing" : ""
    : "";

  // Fade based on distance from player
  const distOpacity = isDiscovered ? 1 : Math.max(0.3, 1 - (distToPlayer / TORCH_RADIUS));

  return (
    <button
      onClick={() => onSelect(creature)}
      className={`absolute flex flex-col items-center cursor-pointer ${statusClass} ${isSelected ? "z-20" : "z-10"} group`}
      style={{
        left: `${creature.mapPosition.x * 100}%`,
        top: `${creature.mapPosition.y * 100}%`,
        transform: "translate(-50%, -50%)",
        opacity: distOpacity,
        transition: "opacity 0.3s ease",
      }}
      title={isDiscovered ? creature.name : "???"}
    >
      <div className={`relative flex items-center justify-center transition-all duration-200 ${isSelected ? "scale-[1.3]" : "group-hover:scale-110"}`}>
        {/* Status halo — pulsing ring for discovered creatures */}
        {isDiscovered && (
          <div className="absolute rounded-full animate-[halo-pulse_3s_ease-in-out_infinite] pointer-events-none"
            style={{
              width: "180%", height: "180%",
              border: `2px solid ${isContained ? "rgba(22,163,74,0.5)" : regionColor.accent + "50"}`,
            }} />
        )}
        {isNearPlayer && !isDiscovered && (
          <div className="absolute rounded-full animate-[threat-pulse_1.2s_ease-in-out_infinite]"
            style={{ width: "200%", height: "200%", background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.35) 0%, transparent 70%)` }} />
        )}
        <div
          className={`w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
            !isDiscovered ? isNearPlayer ? "border-2 border-dashed" : "border border-white/10 bg-white/5" : "border-2"
          } ${isConnected ? "ring-2 ring-amber-400 ring-offset-1 ring-offset-transparent" : ""}`}
          style={isDiscovered ? {
            borderColor: isContained ? "#16a34a" : regionColor.accent + "80",
            background: isContained
              ? "radial-gradient(circle, rgba(22,163,74,0.2), rgba(22,163,74,0.05))"
              : `radial-gradient(circle, rgba(${regionColor.glow}, 0.25), rgba(${regionColor.glow}, 0.05))`,
            boxShadow: isSelected
              ? `0 0 20px rgba(${regionColor.glow}, 0.6), 0 0 40px rgba(${regionColor.glow}, 0.3)`
              : `0 0 8px rgba(${regionColor.glow}, 0.3)`,
          } : isNearPlayer ? {
            borderColor: regionColor.accent + "50",
            background: `radial-gradient(circle, rgba(${regionColor.glow}, 0.15), transparent)`,
          } : undefined}
        >
          {isDiscovered && !isContained && (
            <div className="absolute -top-0.5 -right-0.5 flex gap-px">
              {[...Array(Math.min(5, Math.ceil(composite / 3)))].map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full" style={{
                  backgroundColor: composite >= 12 ? "#ef4444" : composite >= 8 ? "#f59e0b" : "#9ca3af",
                  boxShadow: `0 0 4px ${composite >= 12 ? "#ef4444" : "#f59e0b"}`,
                }} />
              ))}
            </div>
          )}
          <span className={`text-xl md:text-2xl ${!isDiscovered ? isNearPlayer ? "opacity-50 grayscale-[50%]" : "opacity-30 grayscale" : ""}`}>
            {isDiscovered ? creature.icon : isNearPlayer ? creature.icon : "?"}
          </span>
          {isContained && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-600 flex items-center justify-center shadow-sm">
              <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M2 5L4.5 7.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          )}
        </div>
      </div>
      <span
        className={`mt-0.5 text-[10px] font-bold whitespace-nowrap tracking-wide ${isDiscovered ? "text-amber-200" : isNearPlayer ? "text-white/40" : "text-white/15"}`}
        style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}
      >
        {isDiscovered ? creature.name.replace("THE ", "") : isNearPlayer ? "???" : ""}
      </span>
    </button>
  );
}

// ── Region Overlay ──
function RegionOverlay({ region, onSelect, isSelected, creatureCount }: {
  region: Region; onSelect: (id: string) => void; isSelected: boolean; creatureCount: number;
}) {
  return (
    <button
      onClick={() => onSelect(region.id)}
      className={`absolute rounded-xl transition-all duration-300 overflow-hidden ${isSelected ? "shadow-lg" : ""}`}
      style={{
        left: `${region.mapPosition.x * 100}%`, top: `${region.mapPosition.y * 100}%`,
        width: `${region.mapPosition.width * 100}%`, height: `${region.mapPosition.height * 100}%`,
        border: isSelected ? `2px solid ${region.color.accent}60` : `1px solid ${region.color.accent}15`,
        backgroundColor: region.color.primary + "15",
      }}
      aria-label={`${region.name} — ${creatureCount} creatures`}
    >
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${region.color.accent}, transparent 70%)` }} />
      <div className="absolute top-2 left-3 md:top-3 md:left-4">
        <h3 className="text-xs md:text-sm font-bold tracking-[0.2em] drop-shadow-lg"
          style={{ fontFamily: "var(--font-display)", color: region.color.accent }}>
          {region.name}
        </h3>
        <p className="text-[10px] text-white/30 mt-0.5">{region.subtitle}</p>
      </div>
    </button>
  );
}

// ── Compound Lines ──
function CompoundLines({ selectedCreature, creatures }: { selectedCreature: Creature | null; creatures: Creature[] }) {
  if (!selectedCreature) return null;
  const connected = creatures.filter((c) => selectedCreature.compoundRisk.includes(c.id));
  const rc = REGION_COLORS[selectedCreature.region] ?? { accent: "#f59e0b" };
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
      {connected.map((t) => (
        <line key={`${selectedCreature.id}-${t.id}`}
          x1={`${selectedCreature.mapPosition.x * 100}%`} y1={`${selectedCreature.mapPosition.y * 100}%`}
          x2={`${t.mapPosition.x * 100}%`} y2={`${t.mapPosition.y * 100}%`}
          className="compound-line" stroke={rc.accent} strokeWidth="1.5" opacity="0.5" />
      ))}
    </svg>
  );
}

// ── Touch D-pad — coarse-pointer devices only ──
function TouchDPad({ onDirection }: { onDirection: (dir: Direction, held: boolean) => void }) {
  // Each pointer holds its own direction, so a second thumb neither clobbers
  // the first nor halts movement when lifted — and two thumbs make diagonals.
  const pointerDirs = useRef<Map<number, Direction>>(new Map());
  const lastPointerAt = useRef(0);

  const pad = (dir: Direction, label: string, area: string) => (
    <button
      aria-label={`Move ${dir}`}
      className="w-12 h-12 rounded-lg flex items-center justify-center bg-black/45 border border-amber-200/20 text-amber-200/70 text-lg select-none active:bg-amber-500/25 active:border-amber-400/40 transition-colors"
      style={{ gridArea: area, touchAction: "none" }}
      onPointerDown={(e) => {
        e.preventDefault();
        lastPointerAt.current = Date.now();
        pointerDirs.current.set(e.pointerId, dir);
        onDirection(dir, true);
      }}
      onPointerUp={(e) => releasePointer(e.pointerId)}
      onPointerLeave={(e) => releasePointer(e.pointerId)}
      onPointerCancel={(e) => releasePointer(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        // Assistive-tech activation (VoiceOver/switch access sends a bare
        // click): nudge one step. Skip clicks that follow a real pointer tap.
        if (Date.now() - lastPointerAt.current < 500) return;
        onDirection(dir, true);
        setTimeout(() => onDirection(dir, false), 250);
      }}
    >
      {label}
    </button>
  );

  function releasePointer(pointerId: number) {
    lastPointerAt.current = Date.now();
    const dir = pointerDirs.current.get(pointerId);
    if (dir === undefined) return;
    pointerDirs.current.delete(pointerId);
    // Only release the direction if no other pointer still holds it.
    if (![...pointerDirs.current.values()].includes(dir)) {
      onDirection(dir, false);
    }
  }

  return (
    <div
      className="absolute bottom-4 left-4 z-30 hidden pointer-coarse:grid gap-1"
      style={{ gridTemplateAreas: `". up ." "left down right"` }}
    >
      {pad("up", "▲", "up")}
      {pad("left", "◀", "left")}
      {pad("down", "▼", "down")}
      {pad("right", "▶", "right")}
    </div>
  );
}

// ── Obstacle Renderer ──
function ObstacleNode({ obstacle }: { obstacle: Obstacle }) {
  const s = OBS_STYLES[obstacle.type];
  return (
    <div className="absolute pointer-events-none" style={{
      left: `${obstacle.x * 100}%`, top: `${obstacle.y * 100}%`,
      width: `${obstacle.w * 100}%`, height: `${obstacle.h * 100}%`,
      background: s.bg, border: s.border, borderRadius: s.radius,
      boxShadow: obstacle.type === "water"
        ? "inset 0 1px 4px rgba(100,180,255,0.2), 0 0 6px rgba(100,180,255,0.1)"
        : "0 1px 4px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      zIndex: obstacle.type === "wall" ? 8 : 6,
    }}>
      {obstacle.type === "wall" && (
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 8px, rgba(0,0,0,0.2) 8px, rgba(0,0,0,0.2) 9px),
                            repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.15) 5px, rgba(0,0,0,0.15) 6px)`,
        }} />
      )}
      {obstacle.type === "water" && (
        <div className="absolute inset-0 opacity-20 animate-[fog-drift_6s_ease-in-out_infinite_alternate]" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(200,230,255,0.3) 4px, rgba(200,230,255,0.3) 6px)`,
        }} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════
// ── Main Map Canvas ──
// ══════════════════════════════════════════
export default function MapCanvas({
  onSelectCreature, onSelectRegion, onEncounterCreature, onTouchDirection,
  selectedCreature, selectedRegion, showHope, mapRevealed,
  discoveredSet = new Set(), containedSet = new Set(),
  playerX = 0.5, playerY = 0.5,
  playerDirection = "down", playerMoving = false, playerStep = 0,
}: MapCanvasProps) {
  const connectedIds = selectedCreature?.compoundRisk ?? [];
  const lastEncountered = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState({ w: 1, h: 1 });
  const [regionBanner, setRegionBanner] = useState<Region | null>(null);
  const currentRegionRef = useRef<string | null>(null);
  const footprints = useRef<{x: number; y: number}[]>([]);
  const lastFootprint = useRef({x: playerX, y: playerY});

  // ── Measure viewport with ResizeObserver ──
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setViewport({ w: el.clientWidth, h: el.clientHeight });
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // ── Camera: pixel-based transform to center player ──
  const camera = useMemo(() => {
    const worldW = viewport.w * WORLD_SCALE;
    const worldH = viewport.h * WORLD_SCALE;
    const playerWorldX = playerX * worldW;
    const playerWorldY = playerY * worldH;

    // Center player in viewport
    let camX = viewport.w / 2 - playerWorldX;
    let camY = viewport.h / 2 - playerWorldY;

    // Clamp to world edges
    camX = Math.max(viewport.w - worldW, Math.min(0, camX));
    camY = Math.max(viewport.h - worldH, Math.min(0, camY));

    return {
      style: {
        transform: `translate3d(${Math.round(camX)}px, ${Math.round(camY)}px, 0)`,
        width: `${WORLD_SCALE * 100}%`,
        height: `${WORLD_SCALE * 100}%`,
        transition: playerMoving ? "transform 60ms linear" : "transform 200ms ease-out",
      },
      // Where the player actually sits on screen — the camera clamps at
      // world edges, so this is NOT always the viewport center. The torch
      // gradient follows these coordinates.
      torchX: viewport.w > 0 ? ((playerWorldX + camX) / viewport.w) * 100 : 50,
      torchY: viewport.h > 0 ? ((playerWorldY + camY) / viewport.h) * 100 : 50,
    };
  }, [playerX, playerY, playerMoving, viewport]);

  // ── Proximity encounters ──
  useEffect(() => {
    if (!mapRevealed || !onEncounterCreature) return;
    for (const creature of allCreatures) {
      if (discoveredSet.has(creature.id)) continue;
      const dx = playerX - creature.mapPosition.x;
      const dy = playerY - creature.mapPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < ENCOUNTER_DISTANCE && creature.id !== lastEncountered.current) {
        lastEncountered.current = creature.id;
        onEncounterCreature(creature);
        return;
      }
      if (dist > ENCOUNTER_DISTANCE * 2.5 && lastEncountered.current === creature.id) {
        lastEncountered.current = null;
      }
    }
  }, [playerX, playerY, mapRevealed, discoveredSet, onEncounterCreature]);

  // ── Near-player, distance map, and creature-sense compass bearing ──
  const { nearCreatures, creatureDistances, senseAngle } = useMemo(() => {
    const near = new Set<string>();
    const dists = new Map<string, number>();
    let nearestUndiscovered: Creature | null = null;
    let nearestDist = Infinity;
    for (const c of allCreatures) {
      const dx = playerX - c.mapPosition.x;
      const dy = playerY - c.mapPosition.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      dists.set(c.id, dist);
      if (!discoveredSet.has(c.id)) {
        if (dist < HINT_DISTANCE) near.add(c.id);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestUndiscovered = c;
        }
      }
    }
    // Bearing to the nearest undiscovered creature; the needle SVG points up,
    // so straight right = +90deg.
    const angle = nearestUndiscovered
      ? (Math.atan2(
          nearestUndiscovered.mapPosition.y - playerY,
          nearestUndiscovered.mapPosition.x - playerX,
        ) * 180) / Math.PI + 90
      : null;
    return { nearCreatures: near, creatureDistances: dists, senseAngle: angle };
  }, [playerX, playerY, discoveredSet]);

  // ── Footprint trail — drop breadcrumbs as player moves ──
  useEffect(() => {
    const dx = playerX - lastFootprint.current.x;
    const dy = playerY - lastFootprint.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0.004) {
      footprints.current = [...footprints.current.slice(-40), { x: playerX, y: playerY }];
      lastFootprint.current = { x: playerX, y: playerY };
    }
  }, [playerX, playerY]);

  // ── Region entry detection — show banner on crossing ──
  useEffect(() => {
    if (!mapRevealed) return;
    const region = regions.find(r =>
      playerX >= r.mapPosition.x &&
      playerX <= r.mapPosition.x + r.mapPosition.width &&
      playerY >= r.mapPosition.y &&
      playerY <= r.mapPosition.y + r.mapPosition.height
    );
    if (region && region.id !== currentRegionRef.current) {
      if (currentRegionRef.current !== null) {
        setRegionBanner(region);
        setTimeout(() => setRegionBanner(null), 3000);
      }
      currentRegionRef.current = region.id;
    }
  }, [playerX, playerY, mapRevealed]);

  return (
    <div ref={containerRef} className="dark-surface relative w-full h-full overflow-hidden bg-[#0e0c0a]">
      {/* ── WORLD CONTAINER — pixel-based camera ── */}
      <div className="absolute top-0 left-0 will-change-transform" style={camera.style}>
        {/* Dark dungeon floor */}
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse at 15% 15%, rgba(26, 17, 71, 0.15) 0%, transparent 40%),
            radial-gradient(ellipse at 85% 10%, rgba(127, 29, 29, 0.10) 0%, transparent 40%),
            radial-gradient(ellipse at 10% 55%, rgba(146, 64, 14, 0.10) 0%, transparent 40%),
            radial-gradient(ellipse at 90% 60%, rgba(107, 114, 128, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 35%, rgba(88, 28, 135, 0.08) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 80%, rgba(6, 95, 70, 0.08) 0%, transparent 40%),
            linear-gradient(145deg, #1a1714, #151210, #1a1714, #151210, #1a1714)
          `,
        }} />

        {/* Stone tile grid — prominent dungeon floor */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.08]" style={{
          backgroundImage: `
            linear-gradient(rgba(180,160,120,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,160,120,1) 1px, transparent 1px)
          `,
          backgroundSize: "1.11% 1.11%",
        }} />

        {/* Secondary smaller tiles for detail */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `
            linear-gradient(rgba(180,160,120,1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(180,160,120,1) 1px, transparent 1px)
          `,
          backgroundSize: "0.56% 0.56%",
        }} />

        {/* Regions */}
        {regions.map((region) => (
          <RegionOverlay key={region.id} region={region} onSelect={onSelectRegion}
            isSelected={selectedRegion === region.id}
            creatureCount={getCreaturesByRegion(region.id).length} />
        ))}

        {/* Obstacles */}
        {WORLD_OBSTACLES.map((obs, i) => (
          <ObstacleNode key={`obs-${i}`} obstacle={obs} />
        ))}

        {/* Compound lines */}
        <CompoundLines selectedCreature={selectedCreature} creatures={allCreatures} />

        {/* Creatures */}
        {allCreatures.map((creature) => (
          <CreatureNode key={creature.id} creature={creature}
            onSelect={onSelectCreature}
            isSelected={selectedCreature?.id === creature.id}
            isConnected={connectedIds.includes(creature.id)}
            isDiscovered={discoveredSet.has(creature.id)}
            isContained={containedSet.has(creature.id)}
            isNearPlayer={nearCreatures.has(creature.id)}
            distToPlayer={creatureDistances.get(creature.id) ?? 1} />
        ))}

        {/* Hope creatures */}
        {showHope && hopeCreatures.map((hope) => (
          <div key={hope.id}
            className="absolute flex flex-col items-center z-10 animate-[fade-in-up_0.6s_ease-out_forwards]"
            style={{
              left: `${hope.mapPosition.x * 100}%`, top: `${hope.mapPosition.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}>
            <div className="relative">
              <div className="absolute inset-0 rounded-full animate-[hope-pulse_3s_ease-in-out_infinite]"
                style={{ background: "radial-gradient(circle, rgba(234,179,8,0.3) 0%, transparent 70%)", transform: "scale(3)" }} />
              <div className="w-11 h-11 rounded-full flex items-center justify-center border-2 border-amber-400/50 bg-gradient-to-br from-amber-50/20 to-amber-100/10 shadow-[0_0_12px_rgba(234,179,8,0.3)]">
                <span className="text-xl">{hope.icon}</span>
              </div>
            </div>
            <span className="mt-0.5 text-[10px] font-bold text-amber-300 whitespace-nowrap tracking-wide"
              style={{ fontFamily: "var(--font-display)", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {hope.name.replace("THE ", "")}
            </span>
          </div>
        ))}

        {/* ── Footprint breadcrumb trail ── */}
        {mapRevealed && footprints.current.map((fp, i) => (
          <div key={`fp-${i}`} className="absolute w-1 h-1 rounded-full pointer-events-none"
            style={{
              left: `${fp.x * 100}%`, top: `${fp.y * 100}%`,
              transform: "translate(-50%, -50%)",
              backgroundColor: `rgba(180, 150, 100, ${(i / footprints.current.length) * 0.2})`,
              zIndex: 2,
            }} />
        ))}

        {/* ── Player sprite ── */}
        {mapRevealed && (
          <div
            className="absolute z-30 pointer-events-none"
            style={{
              left: `${playerX * 100}%`,
              top: `${playerY * 100}%`,
              transform: "translate(-50%, -80%)",
            }}
          >
            <PlayerSprite direction={playerDirection} isMoving={playerMoving} step={playerStep} />
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* ── VIEWPORT-FIXED OVERLAYS ──             */}
      {/* ══════════════════════════════════════════ */}

      {/* Torchlight effect — radial gradient tracking the PLAYER, not the
          viewport center (the camera clamps at world edges) */}
      {mapRevealed && (
        <div className="absolute inset-0 pointer-events-none z-20 animate-[torch-flicker_4s_ease-in-out_infinite]" style={{
          background: `radial-gradient(ellipse 45% 50% at ${camera.torchX}% ${camera.torchY}%,
            transparent 0%,
            rgba(0,0,0,0.05) 30%,
            rgba(0,0,0,0.25) 50%,
            rgba(0,0,0,0.55) 65%,
            rgba(0,0,0,0.80) 80%,
            rgba(0,0,0,0.92) 100%
          )`,
        }} />
      )}

      {/* Warm vignette inner glow — follows the torch */}
      {mapRevealed && (
        <div className="absolute inset-0 pointer-events-none z-20" style={{
          background: `radial-gradient(ellipse 35% 40% at ${camera.torchX}% ${camera.torchY}%,
            rgba(255, 180, 80, 0.06) 0%,
            transparent 100%
          )`,
        }} />
      )}

      {/* Fog overlay — fades out on map reveal */}
      <div className={`absolute inset-0 z-40 bg-gradient-to-b from-[#0e0c0a] via-[#1a1714ee] to-[#0e0c0a] flex items-center justify-center transition-opacity duration-[2000ms] ease-out ${mapRevealed ? "opacity-0 pointer-events-none" : "opacity-100"}`}>
        <div className="text-center max-w-2xl px-8">
          <h1 className="title-inscription text-3xl md:text-5xl lg:text-6xl font-bold tracking-[0.15em] text-amber-200 mb-8"
            style={{ fontFamily: "var(--font-display)", animationDelay: "0.5s" }}>
            NATURALIS FUTURA
          </h1>
          <p className="text-sm md:text-base text-amber-200/60 leading-relaxed opacity-0 animate-[fade-in-up_1s_ease-out_2s_forwards]"
            style={{ fontFamily: "var(--font-body)" }}>
            The territory beyond human-level intelligence is real. It is
            approaching. No one has drawn the map.{" "}
            <em className="text-amber-100">Until now.</em>
          </p>
          <p className="mt-6 text-xs text-amber-200/30 opacity-0 animate-[fade-in-up_1s_ease-out_3s_forwards]">
            Click anywhere to enter the dungeon...
          </p>
        </div>
      </div>

      {/* Touch D-pad (coarse pointers only) */}
      {mapRevealed && onTouchDirection && <TouchDPad onDirection={onTouchDirection} />}

      {/* WASD hint — hidden on touch devices, where the D-pad takes its place */}
      {mapRevealed && (
        <div className="absolute bottom-3 left-3 z-30 flex items-center gap-2 pointer-events-none select-none pointer-coarse:hidden">
          <div className="flex flex-col items-center gap-0.5">
            <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">W</kbd>
            <div className="flex gap-0.5">
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">A</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">S</kbd>
              <kbd className="w-6 h-5 flex items-center justify-center rounded bg-black/40 text-amber-200/50 text-[9px] font-mono font-bold border border-amber-200/15">D</kbd>
            </div>
          </div>
          <span className="text-[10px] text-amber-200/25 font-mono">MOVE</span>
        </div>
      )}

      {/* Proximity warning — something stirs nearby */}
      {mapRevealed && nearCreatures.size > 0 && (
        <div className="absolute pointer-events-none motion-static" style={{
          left: "50%",
          top: "38%",
          zIndex: 25,
          transform: "translateX(-50%)",
          opacity: 0.65,
          animation: "stir-float 3s ease-in-out infinite",
        }}>
          <p className="text-sm text-amber-300/50 italic whitespace-nowrap tracking-wider"
            style={{ fontFamily: "var(--font-display)", textShadow: "0 0 10px rgba(0,0,0,0.9), 0 0 20px rgba(180,130,50,0.15)" }}>
            Something stirs nearby...
          </p>
        </div>
      )}

      {/* Region entry banner */}
      {regionBanner && (
        <div className="absolute pointer-events-none z-30 motion-static" style={{
          left: "50%", top: "25%",
          transform: "translateX(-50%)",
          animation: "region-enter 3s ease-out forwards",
        }}>
          <div className="text-center">
            <p className="text-[10px] tracking-[0.5em] uppercase" style={{
              fontFamily: "var(--font-display)",
              color: regionBanner.color.accent + "60",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}>
              Entering
            </p>
            <h2 className="text-xl md:text-2xl font-bold tracking-[0.2em] mt-1" style={{
              fontFamily: "var(--font-display)",
              color: regionBanner.color.accent + "90",
              textShadow: `0 0 20px ${regionBanner.color.accent}40, 0 2px 8px rgba(0,0,0,0.8)`,
            }}>
              {regionBanner.name.toUpperCase()}
            </h2>
            <p className="text-[10px] italic mt-1" style={{
              color: regionBanner.color.accent + "40",
              fontFamily: "var(--font-body)",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}>
              {regionBanner.subtitle}
            </p>
          </div>
        </div>
      )}

      {/* Minimap — the cartographer's field vellum */}
      {mapRevealed && (
        <div className="absolute top-3 right-3 z-30 w-28 h-24 rounded-sm overflow-hidden pointer-events-none shadow-lg"
          style={{
            border: "1px solid rgba(180,160,120,0.4)",
            background: "linear-gradient(160deg, rgba(38,30,18,0.88), rgba(22,17,10,0.92))",
            boxShadow: "inset 0 0 0 2px rgba(180,160,120,0.12), inset 0 0 18px rgba(0,0,0,0.5), 0 4px 12px rgba(0,0,0,0.4)",
          }}>
          {/* Player dot */}
          <div className="absolute w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(255,180,80,0.8)]"
            style={{ left: `${playerX * 100}%`, top: `${playerY * 100}%`, transform: "translate(-50%, -50%)" }} />
          {/* Regions */}
          {regions.map((r) => (
            <div key={r.id} className="absolute rounded-sm border"
              style={{
                left: `${r.mapPosition.x * 100}%`, top: `${r.mapPosition.y * 100}%`,
                width: `${r.mapPosition.width * 100}%`, height: `${r.mapPosition.height * 100}%`,
                borderColor: r.color.accent + "30",
                backgroundColor: r.color.accent + "0a",
              }} />
          ))}
          {/* Discovered creatures */}
          {allCreatures.filter((c) => discoveredSet.has(c.id)).map((c) => (
            <div key={c.id} className="absolute w-1 h-1 rounded-full"
              style={{
                left: `${c.mapPosition.x * 100}%`, top: `${c.mapPosition.y * 100}%`,
                backgroundColor: REGION_COLORS[c.region]?.accent ?? "#666",
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 3px ${REGION_COLORS[c.region]?.accent ?? "#666"}`,
              }} />
          ))}
          {/* Walls on minimap */}
          {WORLD_OBSTACLES.filter((o) => o.type === "wall").map((obs, i) => (
            <div key={`mini-${i}`} className="absolute" style={{
              left: `${obs.x * 100}%`, top: `${obs.y * 100}%`,
              width: `${obs.w * 100}%`, height: `${obs.h * 100}%`,
              backgroundColor: "rgba(180,160,120,0.3)",
            }} />
          ))}
          {/* Folded corner */}
          <div className="absolute bottom-0 right-0 w-0 h-0" style={{
            borderLeft: "10px solid transparent",
            borderBottom: "10px solid rgba(180,160,120,0.22)",
          }} />
        </div>
      )}

      {/* Creature-sense compass — the needle points toward the nearest
          undiscovered creature; falls back to north when the map is complete */}
      <div
        className={`absolute bottom-3 right-3 z-30 pointer-events-none transition-opacity duration-500 ${mapRevealed && senseAngle !== null ? "opacity-70" : "opacity-30"}`}
        title="The needle senses the nearest undiscovered creature"
      >
        <svg width="44" height="44" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="18" stroke="#b4a078" strokeWidth="0.75" fill="rgba(20,16,10,0.55)" />
          <circle cx="20" cy="20" r="14.5" stroke="#b4a078" strokeWidth="0.35" fill="none" opacity="0.5" />
          {/* Cardinal ticks */}
          {[0, 90, 180, 270].map((a) => (
            <line key={a} x1="20" y1="3.5" x2="20" y2="6"
              stroke="#b4a078" strokeWidth="0.6" opacity="0.7"
              transform={`rotate(${a}, 20, 20)`} />
          ))}
          <text x="20" y="10.5" textAnchor="middle" fontSize="4.5" fill="#b4a078" fontFamily="serif" opacity="0.8">N</text>
          {/* Needle */}
          <g style={{
            transform: `rotate(${senseAngle ?? 0}deg)`,
            transformOrigin: "50% 50%",
            transition: "transform 0.6s cubic-bezier(0.34, 1.2, 0.64, 1)",
          }}>
            <polygon points="20,6.5 17.8,20 22.2,20"
              fill={senseAngle !== null ? "#f59e0b" : "#b4a078"}
              opacity="0.9" />
            <polygon points="20,33.5 17.8,20 22.2,20" fill="#b4a078" opacity="0.35" />
            <circle cx="20" cy="20" r="1.6" fill="#b4a078" />
          </g>
        </svg>
      </div>
    </div>
  );
}
