type Repeats = "daily" | "weekly" | "monthly";
type EndsMode = "after" | "onDate";

/** 0=Sun ... 6=Sat (JS Date.getDay()) */
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

type RepeatSettings = {
  startsOn: Date;

  repeats: Repeats;

  /** e.g. every 2 weeks / every 3 days / every 1 month */
  interval: number;

  /** only used when repeats === "weekly" */
  repeatOnWeekdays?: Weekday[];

  endsMode: EndsMode;

  /** required when endsMode === "after" (number of returned dates) */
  afterOccurrences?: number;

  /** required when endsMode === "onDate" (inclusive) */
  endsOnDate?: Date;

  /** week start for weekly calculations (1 = Monday, like your screenshot) */
  weekStartsOn?: Weekday;
};

export function getRepeatedDates(settings: RepeatSettings): Date[] {
  const {
    startsOn,
    repeats,
    interval,
    repeatOnWeekdays = [],
    endsMode,
    afterOccurrences,
    endsOnDate,
    weekStartsOn = 1, // Monday
  } = settings;

  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error("interval must be a positive integer");
  }

  if (endsMode === "after") {
    if (!Number.isInteger(afterOccurrences) || (afterOccurrences ?? 0) <= 0) {
      throw new Error(
        "afterOccurrences must be a positive integer when endsMode='after'",
      );
    }
  } else {
    if (!(endsOnDate instanceof Date) || isNaN(endsOnDate.getTime())) {
      throw new Error("endsOnDate is required when endsMode='onDate'");
    }
  }

  const start = startsOn;
  const endInclusive = endsMode === "onDate" ? endsOnDate! : null;
  const maxCount =
    endsMode === "after" ? (afterOccurrences as number) : Infinity;

  const addDays = (d: Date, days: number) => {
    const x = new Date(d.getTime());
    x.setUTCDate(x.getUTCDate() + days);
    return x;
  };

  const addMonths = (d: Date, months: number) => {
    // Keep "same day-of-month" as much as possible (clamp to last day of target month).
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const day = d.getUTCDate();

    const targetMonthIndex = month + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = ((targetMonthIndex % 12) + 12) % 12;

    const lastDay = new Date(
      Date.UTC(targetYear, targetMonth + 1, 0, 12),
    ).getUTCDate();
    const clampedDay = Math.min(day, lastDay);

    return new Date(Date.UTC(targetYear, targetMonth, clampedDay, 12, 0, 0));
  };

  const startOfWeek = (d: Date, weekStart: Weekday) => {
    const dow = d.getUTCDay() as Weekday; // 0..6
    const diff = (dow - weekStart + 7) % 7;
    return addDays(d, -diff);
  };

  const isAfterEnd = (d: Date) =>
    endInclusive !== null && d.getTime() > endInclusive.getTime();

  const result: Date[] = [];
  const pushIfValid = (d: Date) => {
    if (d.getTime() < start.getTime()) return;
    if (isAfterEnd(d)) return;

    // de-dupe (can happen with odd inputs)
    const key = d.toISOString().slice(0, 10);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(d);
    }
  };
  const seen = new Set<string>();

  if (repeats === "daily") {
    let i = 0;
    while (result.length < maxCount) {
      const d = addDays(start, i * interval);
      if (isAfterEnd(d)) break;
      pushIfValid(d);
      i++;
    }
  } else if (repeats === "weekly") {
    if (repeatOnWeekdays.length === 0) {
      throw new Error("repeatOnWeekdays is required when repeats='weekly'");
    }

    // Ensure stable order: Monday..Sunday (or natural numeric order) then generate, then sort.
    const weekdays = [...new Set(repeatOnWeekdays)].sort((a, b) => a - b);

    let cycle = 0;
    while (result.length < maxCount) {
      const anchor = addDays(start, cycle * interval * 7);
      const weekStartDate = startOfWeek(anchor, weekStartsOn);

      for (const wd of weekdays) {
        const dayOffset = (wd - weekStartsOn + 7) % 7;
        const d = addDays(weekStartDate, dayOffset);
        if (isAfterEnd(d)) break;
        pushIfValid(d);
        if (result.length >= maxCount) break;
      }

      // Quick stop if the first day of the next cycle is beyond end date
      if (endInclusive) {
        const nextAnchor = addDays(start, (cycle + 1) * interval * 7);
        if (nextAnchor.getTime() > endInclusive.getTime() && result.length > 0)
          break;
      }

      cycle++;
    }

    // Sort because weekdays order (and filtering >= start) can produce non-sorted pushes.
    result.sort((a, b) => a.getTime() - b.getTime());
  } else {
    // monthly: same day-of-month as startsOn (clamped if month shorter)
    let i = 0;
    while (result.length < maxCount) {
      const d = addMonths(start, i * interval);
      if (isAfterEnd(d)) break;
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
