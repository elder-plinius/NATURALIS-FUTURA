"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type Direction = "up" | "down" | "left" | "right";

export interface PlayerSpriteState {
  x: number; // 0-1 world position
  y: number;
  direction: Direction;
  isMoving: boolean;
  step: number; // walk cycle frame
}

const MOVE_SPEED = 0.001;
const MOVE_INTERVAL = 16; // ~60fps

export function usePlayerSprite(
  enabled: boolean,
  onMoveStart?: () => void,
  canMoveTo?: (x: number, y: number) => boolean,
) {
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
  const wasMoving = useRef(false);
  const onMoveStartRef = useRef(onMoveStart);
  onMoveStartRef.current = onMoveStart;
  const canMoveToRef = useRef(canMoveTo);
  canMoveToRef.current = canMoveTo;

  const updatePosition = useCallback(() => {
    const keys = keysDown.current;
    let dx = 0;
    let dy = 0;
    let dir: Direction | null = null;

    if (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) { dy = -MOVE_SPEED; dir = "up"; }
    if (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) { dy = MOVE_SPEED; dir = "down"; }
    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) { dx = -MOVE_SPEED; dir = "left"; }
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) { dx = MOVE_SPEED; dir = "right"; }

    if (dx !== 0 && dy !== 0) { dx *= 0.707; dy *= 0.707; }

    if (dx !== 0 || dy !== 0) {
      if (!wasMoving.current) {
        wasMoving.current = true;
        onMoveStartRef.current?.();
      }
      stepCounter.current++;
      setSprite((prev) => {
        const clamp = (v: number) => Math.max(0.01, Math.min(0.99, v));
        const newX = clamp(prev.x + dx);
        const newY = clamp(prev.y + dy);
        const check = canMoveToRef.current;

        let finalX = newX;
        let finalY = newY;

        if (check) {
          if (!check(newX, newY)) {
            // Try wall-sliding: move only on one axis
            const canSlideX = check(newX, prev.y);
            const canSlideY = check(prev.x, newY);
            if (canSlideX) {
              finalX = newX;
              finalY = prev.y;
            } else if (canSlideY) {
              finalX = prev.x;
              finalY = newY;
            } else {
              // Fully blocked
              return {
                ...prev,
                direction: dir ?? prev.direction,
                isMoving: true,
                step: Math.floor(stepCounter.current / 8) % 4,
              };
            }
          }
        }

        return {
          x: finalX,
          y: finalY,
          direction: dir ?? prev.direction,
          isMoving: true,
          step: Math.floor(stepCounter.current / 8) % 4,
        };
      });
    } else {
      if (wasMoving.current) {
        wasMoving.current = false;
        setSprite((prev) => ({ ...prev, isMoving: false, step: 0 }));
      }
    }
  }, []);

  // ALWAYS listen for keys, even when "disabled" -- but only move when enabled
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const key = e.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "w", "a", "s", "d", "W", "A", "S", "D"].includes(key)) {
        if (enabled) {
          e.preventDefault();
          keysDown.current.add(key);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key);
    };

    const handleBlur = () => {
      keysDown.current.clear();
    };

    window.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [enabled]);

  // Movement tick
  useEffect(() => {
    if (!enabled) {
      keysDown.current.clear();
      wasMoving.current = false;
      return;
    }
    moveInterval.current = setInterval(updatePosition, MOVE_INTERVAL);
    return () => {
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, [enabled, updatePosition]);

  return sprite;
}
