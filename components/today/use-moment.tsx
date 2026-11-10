"use client";

import type { FunctionReturnType } from "convex/server";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { api } from "@/convex/_generated/api";
import type { Moment } from "@/components/celebration";
import { TrophyIcon } from "@/components/icons";
import { showToast } from "@/lib/reward";
import type { CheckResult } from "./use-check";
import type { TodayData } from "./view";

type Wins = FunctionReturnType<typeof api.stats.wins>;

// The Day won screen plays once per day on this device, even if a check is undone and redone.
const dayWonKey = (day: string) => `todo:day-won:${day}`;
function dayWonShown(day: string) {
  try {
    return window.localStorage.getItem(dayWonKey(day)) === "1";
  } catch {
    return false;
  }
}
function markDayWonShown(day: string) {
  try {
    window.localStorage.setItem(dayWonKey(day), "1");
  } catch {
    // Storage can be blocked. The screen may then show again after an undo, which is harmless.
  }
}

/**
 * Turns a check into its response: the Day won screen, the Focus set done screen, or a milestone toast.
 * A day won outranks a focus set finished on the same check. Routine checks get only the cheer toast from useCheck.
 */
export function useMoment(data: TodayData | undefined, wins: Wins | undefined, today: string) {
  const router = useRouter();
  const [moment, setMoment] = useState<Moment | null>(null);
  const streak = wins?.streak ?? 0;

  function after(result: CheckResult | null) {
    if (!result || !data) return;
    const focusDone = result.focusLeft === 0;
    const wonNow = result.doneToday === data.settings.dailyTarget && !dayWonShown(today);
    // The streak counts today only once today is won, so winning now adds one.
    const streakTo = wonNow ? streak + 1 : streak;
    const milestones: string[] = [];
    if (wins) {
      if (focusDone && wins.firstFocusSetDay === null) milestones.push("First focus set");
      if (wonNow && wins.milestones.streak5 === null && streakTo >= 5) milestones.push("5-day streak");
      if (wonNow && wins.milestones.streak10 === null && streakTo >= 10) milestones.push("10-day streak");
      if (wins.milestones.tasks100 === null && wins.totalDone + 1 >= 100) milestones.push("100 tasks done");
    }
    const base = { doneToday: result.doneToday, streakFrom: streak, streakTo, focusDoneToo: focusDone, milestones };
    if (wonNow) {
      markDayWonShown(today);
      setMoment({ kind: "day", ...base });
    } else if (focusDone) {
      setMoment({ kind: "focus", ...base });
    } else if (milestones.length > 0) {
      showToast(`New milestone: ${milestones[0]}`, {
        lime: true,
        icon: <TrophyIcon size={20} />,
        duration: 6000,
        action: { label: "See it", onClick: () => router.push("/wins") },
      });
    }
  }

  // Next keeps visited screens alive with their state, so a moment left open would greet her on return.
  function leaveTo(href: string) {
    setMoment(null);
    router.push(href);
  }

  return { moment, after, clear: () => setMoment(null), leaveTo };
}
