"use client";

import type { ReactNode } from "react";
import { toast } from "sonner";

export type RewardPrefs = { sounds: boolean; haptics: boolean };

let audio: AudioContext | null = null;

/** A short, soft two-note chime. Quiet enough for an office. */
function chime(big: boolean) {
  try {
    audio ??= new AudioContext();
    const notes = big ? [660, 880, 1320] : [880, 1320];
    notes.forEach((freq, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      const start = audio!.currentTime + i * 0.07;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.07, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
      osc.connect(gain).connect(audio!.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  } catch {
    // Audio is a nice-to-have. Some browsers block it until the first tap.
  }
}

/** Feedback for a check-off: haptic tap and chime, each if turned on in Settings. */
export function reward(prefs: RewardPrefs | undefined, big = false) {
  if (!prefs) return;
  if (prefs.haptics && "vibrate" in navigator) navigator.vibrate(big ? [12, 40, 18] : 12);
  if (prefs.sounds) chime(big);
}

type ToastOptions = { action?: { label: string; onClick: () => void }; lime?: boolean; icon?: ReactNode; duration?: number };

export function showToast(message: ReactNode, options: ToastOptions = {}) {
  toast.custom(
    (id) => (
      <div className={`toast${options.lime ? " lime" : ""}`} role="status">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0, fontWeight: options.lime ? 600 : 500 }}>
          {options.icon}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{message}</span>
        </span>
        {options.action && (
          <button
            className="btn"
            onClick={() => {
              options.action!.onClick();
              toast.dismiss(id);
            }}
          >
            {options.action.label}
          </button>
        )}
      </div>
    ),
    { duration: options.duration ?? 4000 },
  );
}

/** Upbeat line for a check-off, based on how the day is going. */
export function cheer(doneToday: number, target: number, focusLeft: number | null): string {
  if (focusLeft === 0) return "Focus set done.";
  if (focusLeft === 1) return "Nice. One more and the set is done.";
  if (doneToday === target) return "Day won.";
  if (doneToday > target) return `${doneToday} done today. On a roll.`;
  const left = target - doneToday;
  return `Nice. ${left} more to win the day.`;
}
