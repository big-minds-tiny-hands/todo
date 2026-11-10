"use client";

import { usePathname } from "next/navigation";

// Every screen's <title>, by route. React hoists the <title> into <head>.
const TITLES: [RegExp, string][] = [
  [/^\/$/, "Today"],
  [/^\/tasks$/, "All tasks"],
  [/^\/calendar$/, "Calendar"],
  [/^\/wins$/, "Your wins"],
  [/^\/settings$/, "Settings"],
  [/^\/settings\/goals$/, "Daily goals"],
  [/^\/settings\/goals\/new$/, "New goal"],
  [/^\/settings\/goals\/[^/]+$/, "Edit goal"],
  [/^\/task\/[^/]+$/, "Task"],
  [/^\/focus$/, "Focus"],
  [/^\/focus\/choose$/, "Choose a focus set"],
  [/^\/install$/, "Install Todo"],
  [/^\/sign-in$/, "Sign in"],
  [/^\/sign-up$/, "Create an account"],
  [/^\/forgot-password$/, "Reset your password"],
  [/^\/reset-password$/, "Set a new password"],
  [/^\/offline$/, "Offline"],
];

export function RouteTitle() {
  const pathname = usePathname();
  const name = TITLES.find(([pattern]) => pattern.test(pathname))?.[1];
  return <title>{name ? `${name} · Todo` : "Todo"}</title>;
}
