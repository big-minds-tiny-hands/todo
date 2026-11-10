"use client";

import { useEffect, useState } from "react";
import { addDays, toDay } from "@/lib/day";

/** Today's local date and the current time, refreshed every 30 seconds so midnight and time slots roll over. */
export function useToday() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const timer = window.setInterval(tick, 30_000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);
  const today = toDay(now);
  return { today, yesterday: addDays(today, -1), now, minutes: now.getHours() * 60 + now.getMinutes() };
}
