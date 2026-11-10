"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

const COLORS = { light: "#F5F5F1", dark: "#0D0E11" } as const;

/** Keeps the status bar and browser chrome in step with the in-app theme, not only the OS setting. */
export function ThemeColor() {
  const { theme, resolvedTheme } = useTheme();
  useEffect(() => {
    const metas = document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]');
    metas.forEach((meta) => {
      const media = meta.dataset.media ?? meta.media;
      meta.dataset.media = media;
      if (theme === "system" || !resolvedTheme) {
        meta.media = media;
        meta.content = media.includes("dark") ? COLORS.dark : COLORS.light;
      } else {
        meta.media = "all";
        meta.content = resolvedTheme === "dark" ? COLORS.dark : COLORS.light;
      }
    });
  }, [theme, resolvedTheme]);
  return null;
}
