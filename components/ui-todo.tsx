"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CalendarIcon, CheckIcon, ListIcon, SunIcon } from "@/components/icons";

/** Round check from the design: 44px target, 28px ring (36px when large). */
export function Check({
  checked,
  onChange,
  label,
  size,
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  size?: "lg" | "sm";
  className?: string;
}) {
  const [pop, setPop] = useState(false);
  return (
    <button
      type="button"
      className={["check", checked && "on", size, pop && "pop", className].filter(Boolean).join(" ")}
      aria-pressed={checked}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!checked) {
          setPop(true);
          window.setTimeout(() => setPop(false), 420);
        }
        onChange(!checked);
      }}
    >
      <span>
        <CheckIcon />
      </span>
    </button>
  );
}

/** Daily ring: done today against the daily target. */
export function Ring({ done, target, href }: { done: number; target: number; href?: string }) {
  const circumference = 113;
  const offset = circumference * (1 - Math.min(1, target ? done / target : 0));
  const content = (
    <>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <circle className="track" cx="22" cy="22" r="18" />
        <circle className="val" cx="22" cy="22" r="18" style={{ strokeDasharray: circumference, strokeDashoffset: offset }} />
      </svg>
      <b>
        {done}/{target}
      </b>
    </>
  );
  const label = `${done} of ${target} done today`;
  const className = `ring${done >= target ? " full" : ""}`;
  return href ? (
    <Link className={className} href={href} aria-label={`${label}. See your wins`}>
      {content}
    </Link>
  ) : (
    <span className={className} aria-label={label}>
      {content}
    </span>
  );
}

/** Bottom sheet on phone, centered dialog from 768px. */
export function Sheet({
  open,
  onOpenChange,
  title,
  eyebrow,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  eyebrow?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="scrim" />
        <Dialog.Popup className="sheet">
          <div className="grab" />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              {eyebrow && <p className="eyebrow" style={{ margin: 0 }}>{eyebrow}</p>}
              <Dialog.Title className="h2">{title}</Dialog.Title>
            </div>
            <Dialog.Close className="iconbtn ghost" aria-label="Close">
              <svg className="i" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const TABS = [
  { href: "/", label: "Today", Icon: SunIcon, match: (p: string) => p === "/" || p.startsWith("/wins") },
  { href: "/tasks", label: "All tasks", Icon: ListIcon, match: (p: string) => p.startsWith("/tasks") },
  { href: "/calendar", label: "Calendar", Icon: CalendarIcon, match: (p: string) => p.startsWith("/calendar") },
];

export function TabBar({ allTasksCount }: { allTasksCount?: number }) {
  const pathname = usePathname();
  return (
    <nav className="tabbar" aria-label="Main">
      {TABS.map(({ href, label, Icon, match }) => {
        const on = match(pathname);
        return (
          <Link key={href} className={`tab${on ? " on" : ""}`} href={href} aria-current={on ? "page" : undefined}>
            <Icon />
            {label}
            {href === "/tasks" && allTasksCount ? <span className="badge">{allTasksCount}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function PriorityDot({ priority }: { priority: "high" | "normal" | "low" }) {
  return <span className={`pri ${priority}`} aria-hidden="true" />;
}

export const PRIORITY_LABEL = { high: "High", normal: "Normal", low: "Low" } as const;

export function PrioritySeg({
  value,
  onChange,
}: {
  value: "high" | "normal" | "low";
  onChange: (value: "high" | "normal" | "low") => void;
}) {
  return (
    <div className="seg" role="radiogroup" aria-label="Priority">
      {(["high", "normal", "low"] as const).map((p) => (
        <button
          key={p}
          type="button"
          role="radio"
          aria-checked={value === p}
          className={value === p ? "on" : undefined}
          onClick={() => onChange(p)}
        >
          <PriorityDot priority={p} />
          {PRIORITY_LABEL[p]}
        </button>
      ))}
    </div>
  );
}

export function Avatar({ name }: { name?: string }) {
  return (
    <Link className="avatar" href="/settings" aria-label="Settings">
      {(name?.trim()[0] ?? "·").toUpperCase()}
    </Link>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button type="button" className={`toggle${on ? " on" : ""}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}>
      <span />
    </button>
  );
}
