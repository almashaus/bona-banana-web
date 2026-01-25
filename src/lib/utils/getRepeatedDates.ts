import {
  addDays,
  addWeeks,
  addMonths,
  startOfDay,
  startOfWeek,
  isAfter,
  isBefore,
  format,
} from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

type Repeats = "daily" | "weekly" | "monthly";
type EndsMode = "after" | "onDate";
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type RepeatSettings = {
  startsOn: Date;
  repeats: Repeats;
  interval: number;
  repeatOnWeekdays?: Weekday[];
  endsMode: EndsMode;
  afterOccurrences?: number;
  endsOnDate?: Date;
  weekStartsOn?: Weekday;
};

const TIME_ZONE = "Asia/Riyadh";

export function getRepeatedDates(settings: RepeatSettings): Date[] {
  const {
    startsOn,
    repeats,
    interval,
    repeatOnWeekdays = [],
    endsMode,
    afterOccurrences,
    endsOnDate,
    weekStartsOn = 1,
  } = settings;

  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error("interval must be a positive integer");
  }

  if (endsMode === "after") {
    if (!Number.isInteger(afterOccurrences) || afterOccurrences! <= 0) {
      throw new Error("afterOccurrences must be a positive integer");
    }
  } else {
    if (!(endsOnDate instanceof Date)) {
      throw new Error("endsOnDate is required when endsMode='onDate'");
    }
  }

  // Normalize start/end to local calendar days
  const start = startOfDay(toZonedTime(startsOn, TIME_ZONE));
  const endInclusive =
    endsMode === "onDate"
      ? startOfDay(toZonedTime(endsOnDate!, TIME_ZONE))
      : null;

  const maxCount = endsMode === "after" ? afterOccurrences! : Infinity;

  const seen = new Set<string>();
  const result: Date[] = [];

  const pushIfValid = (d: Date) => {
    if (isBefore(d, start)) return;
    if (endInclusive && isAfter(d, endInclusive)) return;

    const key = format(d, "yyyy-MM-dd"); // local day key
    if (!seen.has(key)) {
      seen.add(key);
      result.push(fromZonedTime(d, TIME_ZONE));
    }
  };

  // ─────────────────────────── DAILY ───────────────────────────
  if (repeats === "daily") {
    let i = 0;
    while (result.length < maxCount) {
      const d = addDays(start, i * interval);
      if (endInclusive && isAfter(d, endInclusive)) break;
      pushIfValid(d);
      i++;
    }
  }

  // ─────────────────────────── WEEKLY ──────────────────────────
  else if (repeats === "weekly") {
    if (repeatOnWeekdays.length === 0) {
      throw new Error("repeatOnWeekdays is required for weekly repeats");
    }

    const weekdays = [...new Set(repeatOnWeekdays)].sort((a, b) => a - b);

    let cycle = 0;
    while (result.length < maxCount) {
      const anchor = addWeeks(start, cycle * interval);
      const weekStart = startOfWeek(anchor, { weekStartsOn });

      for (const wd of weekdays) {
        const d = addDays(weekStart, wd);
        pushIfValid(d);
        if (result.length >= maxCount) break;
      }

      if (
        endInclusive &&
        isAfter(addWeeks(weekStart, interval), endInclusive)
      ) {
        break;
      }

      cycle++;
    }

    result.sort((a, b) => a.getTime() - b.getTime());
  }

  // ─────────────────────────── MONTHLY ─────────────────────────
  else {
    let i = 0;
    while (result.length < maxCount) {
      const d = addMonths(start, i * interval);
      if (endInclusive && isAfter(d, endInclusive)) break;
      pushIfValid(d);
      i++;
    }
  }

  return result;
}

// --- Optional helpers (example formatting) ---
export function formatDMY(d: Date): string {
  const day = String(d.getUTCDate()).padStart(2, "0");
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
