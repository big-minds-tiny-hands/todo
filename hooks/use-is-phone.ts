"use client";

import { useSyncExternalStore } from "react";

/** Below the 768px breakpoint in globals.css, where the layout is one column. */
const PHONE = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(PHONE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function useIsPhone() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(PHONE).matches, () => true);
}
