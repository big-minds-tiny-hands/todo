"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, MinusIcon, MonitorIcon, MoonIcon, PlusIcon, SunIcon } from "@/components/icons";

/** Back link above a page title. The negative top margin keeps the canvas spacing with a 44px target. */
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link className="link" href={href} style={{ minHeight: 44, margin: "-6px 0 0 -2px" }}>
      <ChevronLeft size={18} />
      {label}
    </Link>
  );
}

export function Seg<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { value: T; label: ReactNode }[];
  value: T | undefined;
  onChange: (value: T) => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          className={value === option.value ? "on" : undefined}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

const THEMES = [
  { value: "system", label: <><MonitorIcon size={18} />System</> },
  { value: "light", label: <><SunIcon size={18} />Light</> },
  { value: "dark", label: <><MoonIcon size={18} />Dark</> },
] as const;

const subscribeNever = () => () => {};

/** The stored theme is only known in the browser, so the selection shows after hydration. */
export function ThemeSeg() {
  const { theme, setTheme } = useTheme();
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);
  return (
    <Seg
      label="Appearance"
      options={THEMES}
      value={hydrated ? (theme as (typeof THEMES)[number]["value"]) : undefined}
      onChange={setTheme}
    />
  );
}

export function Stepper({
  value,
  min,
  max,
  unit,
  label,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unit: string;
  label: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 8 }}>
      <button
        type="button"
        className="iconbtn"
        aria-label={`Lower ${label}`}
        disabled={value <= min}
        style={value <= min ? { opacity: 0.4 } : undefined}
        onClick={() => onChange(value - 1)}
      >
        <MinusIcon />
      </button>
      <span style={{ display: "flex", alignItems: "baseline", gap: 8 }} aria-live="polite">
        <span className="num" style={{ fontFamily: "var(--fd)", fontSize: 34, fontWeight: 700 }}>
          {value}
        </span>
        <span className="muted">{unit}</span>
      </span>
      <button
        type="button"
        className="iconbtn"
        aria-label={`Raise ${label}`}
        disabled={value >= max}
        style={value >= max ? { opacity: 0.4 } : undefined}
        onClick={() => onChange(value + 1)}
      >
        <PlusIcon />
      </button>
    </div>
  );
}
