/** Weekdays a daily goal applies, indexed like Date.getDay(): 0 = Sunday. */
export const WEEK = [
  { letter: "S", short: "Sun", name: "Sunday" },
  { letter: "M", short: "Mon", name: "Monday" },
  { letter: "T", short: "Tue", name: "Tuesday" },
  { letter: "W", short: "Wed", name: "Wednesday" },
  { letter: "T", short: "Thu", name: "Thursday" },
  { letter: "F", short: "Fri", name: "Friday" },
  { letter: "S", short: "Sat", name: "Saturday" },
];

const NAMED_SETS: Record<string, string> = {
  "0,1,2,3,4,5,6": "Every day",
  "1,2,3,4,5": "Weekdays",
  "0,6": "Weekends",
};

export function daysRule(days: number[]) {
  const sorted = [...days].sort((a, b) => a - b);
  return NAMED_SETS[sorted.join(",")] ?? sorted.map((d) => WEEK[d].short).join(", ");
}
