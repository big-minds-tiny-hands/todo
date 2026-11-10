"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { addMonths, MonthGrid, monthCells, monthLabel, monthOf, monthRange } from "@/components/tasks/month-grid";

/** The app's date picker: a month with arrows and swipe, dots on days that hold tasks, past days disabled. */
export function DayPicker({ value, onChange, today }: { value: string | null; onChange: (day: string) => void; today: string }) {
  const [month, setMonth] = useState(monthOf(value ?? today));
  const [seen, setSeen] = useState(value);
  if (value !== seen) {
    // A day picked elsewhere (a quick chip) brings its month into view.
    setSeen(value);
    if (value && monthOf(value) !== month) setMonth(monthOf(value));
  }
  const planned = useQuery(api.tasks.inRange, monthRange(month));
  const cells = monthCells({ month, today, selected: value, busyDays: new Set(planned?.map((t) => t.plannedDay ?? "")) });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span className="h3">{monthLabel(month)}</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button type="button" className="iconbtn ghost" aria-label="Previous month" onClick={() => setMonth(addMonths(month, -1))}>
            <ChevronLeft />
          </button>
          <button type="button" className="iconbtn ghost" aria-label="Next month" onClick={() => setMonth(addMonths(month, 1))}>
            <ChevronRight />
          </button>
        </div>
      </div>
      <MonthGrid month={month} cells={cells} onSelect={onChange} onMonthSwipe={(delta) => setMonth(addMonths(month, delta))} disablePast dayStyle={{ height: 42 }} />
    </div>
  );
}
