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

export interface PlayerSprite extends PlayerSpriteState {
  /** Press/release a direction from the touch D-pad. Multiple directions may
   *  be held at once (two thumbs = diagonals), mirroring keyboard input. */
  setTouchDirection: (dir: Direction, held: boolean) => void;
}

const MOVE_SPEED = 0.001;
const SPRINT_MULTIPLIER = 1.75;
const MOVE_INTERVAL = 16; // ~60fps

const MOVE_KEYS = new Set(["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d"]);

export function usePlayerSprite(
  enabled: boolean,
  onMoveStart?: () => void,
  canMoveTo?: (x: number, y: number) => boolean,
): PlayerSprite {
  const [sprite, setSprite] = useState<PlayerSpriteState>({
    x: 0.5,
    y: 0.5,
    direction: "down",
    isMoving: false,
    step: 0,
  });

  // Keys are stored lowercased so a Shift press/release mid-walk can't
  // strand an uppercase entry in the set (the classic stuck-key bug).
  const keysDown = useRef<Set<string>>(new Set());
  const touchDirs = useRef<Set<Direction>>(new Set());
  const moveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stepCounter = useRef(0);
  const wasMoving = useRef(false);
  const onMoveStartRef = useRef(onMoveStart);
  onMoveStartRef.current = onMoveStart;
  const canMoveToRef = useRef(canMoveTo);
  canMoveToRef.current = canMoveTo;

  const setTouchDirection = useCallback((dir: Direction, held: boolean) => {
    if (held) touchDirs.current.add(dir);
    else touchDirs.current.delete(dir);
  }, []);

  const updatePosition = useCallback(() => {
    const keys = keysDown.current;
    const touch = touchDirs.current;
    const speed = keys.has("shift") ? MOVE_SPEED * SPRINT_MULTIPLIER : MOVE_SPEED;
    let dx = 0;
    let dy = 0;
    let dir: Direction | null = null;

    if (keys.has("arrowup") || keys.has("w") || touch.has("up")) { dy = -speed; dir = "up"; }
    if (keys.has("arrowdown") || keys.has("s") || touch.has("down")) { dy = speed; dir = "down"; }
    if (keys.has("arrowleft") || keys.has("a") || touch.has("left")) { dx = -speed; dir = "left"; }
    if (keys.has("arrowright") || keys.has("d") || touch.has("right")) { dx = speed; dir = "right"; }

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
      const key = e.key.toLowerCase();
      if (key === "shift") {
        keysDown.current.add("shift");
        return;
      }
      if (MOVE_KEYS.has(key)) {
        if (enabled) {
          e.preventDefault();
          // Auto-repeat may only sustain a key that is already held, never
          // (re-)arm one. After an overlay (discovery, battle) clears the set,
          // a still-held key must be released and pressed again — otherwise
          // its repeat stream would instantly walk the player away and
          // auto-close the dossier that just opened.
          if (e.repeat && !keysDown.current.has(key)) return;
          keysDown.current.add(key);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.current.delete(e.key.toLowerCase());
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
      touchDirs.current.clear();
      wasMoving.current = false;
      return;
    }
    moveInterval.current = setInterval(updatePosition, MOVE_INTERVAL);
    return () => {
      if (moveInterval.current) clearInterval(moveInterval.current);
    };
  }, [enabled, updatePosition]);

  return { ...sprite, setTouchDirection };
}
