"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"));
const PERIODS = ["AM", "PM"] as const;

/** "HH:MM" in 24-hour time, as tasks store it. */
function split(value: string) {
  const [h, m] = value.split(":").map(Number);
  return { hour: String(h % 12 === 0 ? 12 : h % 12), minute: String(m).padStart(2, "0"), period: h >= 12 ? "PM" : "AM" };
}

function join(hour: string, minute: string, period: string) {
  const h = (Number(hour) % 12) + (period === "PM" ? 12 : 0);
  return `${String(h).padStart(2, "0")}:${minute}`;
}

/** The app's time picker: hour, minute and AM or PM, each a shadcn Select. Never the browser's own time input. */
export function TimeField({ value, onChange, label = "Time" }: { value: string; onChange: (value: string) => void; label?: string }) {
  const { hour, minute, period } = split(value);
  // A time saved off the 5-minute grid (an imported 9:07) stays choosable.
  const minutes = MINUTES.includes(minute) ? MINUTES : [...MINUTES, minute].sort();
  const part = (name: string, current: string, options: readonly string[], set: (next: string) => string) => (
    <Select value={current} onValueChange={(next) => next && onChange(set(next))}>
      <SelectTrigger className="time-part" aria-label={`${label} ${name}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="time-menu">
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
  return (
    <div className="time-field" role="group" aria-label={label}>
      {part("hour", hour, HOURS, (next) => join(next, minute, period))}
      <span className="time-colon" aria-hidden="true">
        :
      </span>
      {part("minute", minute, minutes, (next) => join(hour, next, period))}
      {part("AM or PM", period, PERIODS, (next) => join(hour, minute, next))}
    </div>
  );
}
