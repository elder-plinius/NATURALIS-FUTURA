"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type Direction = "up" | "down" | "left" | "right";

interface PlayerSpriteState {
  x: number; // 0-1 normalized position
  y: number;
  direction: Direction;
  isMoving: boolean;
  step: number; // 0 or 1 for walk cycle
}

const MOVE_SPEED = 0.004; // ~0.4% of map per frame
const MOVE_INTERVAL = 30; // ms between move ticks

export function usePlayerSprite(enabled: boolean) {
  const [sprite, setSprite] = useState<PlayerSpriteState>({
    x: 0.5,
    y: 0.5,
    direction: "down",
    isMoving: false,
    step: 0,
  });

  const keysDown = useRef<Set<string>>(new Set());
  const moveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepCounter = useRef(0);

  const updatePosition = useCallback(() => {
    const keys = keysDown.current;
    let dx = 0;
    let dy = 0;
    let dir: Direction | null = null;

    if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) {
      dy = -MOVE_SPEED;
      dir = "up";
    }
    if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) {
      dy = MOVE_SPEED;
      dir = "down";
    }
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) {
      dx = -MOVE_SPEED;
      dir = "left";
    }
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) {
      dx = MOVE_SPEED;
      dir = "right";
    }

    // Diagonal movement: normalize speed
    if (dx !== 0 && dy !== 0) {
      dx *= 0.707;
      dy *= 0.707;
    }

    if (dx !== 0 || dy !== 0) {
      stepCounter.current++;
      setSprite((prev) => ({
        x: Math.max(0.02, Math.min(0.98, prev.x + dx)),
        y: Math.max(0.02, Math.min(0.98, prev.y + dy)),
        direction: dir ?? prev.direction,
        isMoving: true,
        step: Math.floor(stepCounter.current / 6) % 2, // Toggle every 6 ticks
      }));
    } else {
      setSprite((prev) => prev.isMoving ? { ...prev, isMoving: false, step: 0 } : prev);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(key)) {
        e.preventDefault();
        keysDown.current.add(key);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
    };

    const handleBlur = () => {
      keysDown.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    moveInterval.current = setInterval(updatePosition, MOVE_INTERVAL);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, [enabled, updatePosition]);

  return sprite;
}
