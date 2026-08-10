/**
 * Working-hours arithmetic for the enquiry SLA.
 *
 * Working hours are Mon–Fri 09:00–17:00 Europe/London. The quote SLA is
 * 4 working hours from the enquiry landing; follow-ups are day 2 and day 5.
 *
 * Europe/London is not UTC for most of the year, so this converts into
 * London wall-clock time, does the arithmetic there, and converts back —
 * rather than pretending UTC hours are London hours, which silently breaks
 * for seven months a year.
 */

const ZONE = 'Europe/London';
export const WORK_START_HOUR = 9;
export const WORK_END_HOUR = 17;
export const QUOTE_SLA_WORKING_HOURS = 4;
export const FOLLOW_UP_1_DAYS = 2;
export const FOLLOW_UP_2_DAYS = 5;

const PARTS = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  weekday: 'short',
});

interface LondonParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  /** 0 = Sunday … 6 = Saturday */
  weekday: number;
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
};

/** The London wall-clock reading of an instant. */
export function londonParts(date: Date): LondonParts {
  const parts = Object.fromEntries(
    PARTS.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour === '24' ? '0' : parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_INDEX[parts.weekday] ?? 0,
  };
}

/** London's UTC offset in minutes at a given instant (0 in GMT, 60 in BST). */
function londonOffsetMinutes(date: Date): number {
  const p = londonParts(date);
  const asIfUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return Math.round((asIfUtc - date.getTime()) / 60_000);
}

/**
 * Builds the instant matching a London wall-clock time. Resolves the
 * offset iteratively, which is what makes the DST-transition days correct
 * rather than an hour out.
 */
export function fromLondon(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
): Date {
  const naiveUtc = Date.UTC(year, month - 1, day, hour, minute);
  let guess = new Date(naiveUtc);
  for (let i = 0; i < 3; i += 1) {
    const offset = londonOffsetMinutes(guess);
    const corrected = new Date(naiveUtc - offset * 60_000);
    if (corrected.getTime() === guess.getTime()) break;
    guess = corrected;
  }
  return guess;
}

export function isWorkingDay(date: Date): boolean {
  const day = londonParts(date).weekday;
  return day >= 1 && day <= 5;
}

/** True when the instant falls inside Mon–Fri 09:00–17:00 London. */
export function isWithinWorkingHours(date: Date): boolean {
  const p = londonParts(date);
  if (p.weekday < 1 || p.weekday > 5) return false;
  const minutes = p.hour * 60 + p.minute;
  return minutes >= WORK_START_HOUR * 60 && minutes < WORK_END_HOUR * 60;
}

/** The next instant that is inside working hours, or the same one if already. */
function advanceIntoWorkingHours(from: Date): Date {
  let cursor = from;
  // At most a handful of iterations: forward to the next 09:00 as needed.
  for (let i = 0; i < 14; i += 1) {
    const p = londonParts(cursor);
    if (p.weekday === 0) {
      cursor = fromLondon(p.year, p.month, p.day + 1, WORK_START_HOUR);
      continue;
    }
    if (p.weekday === 6) {
      cursor = fromLondon(p.year, p.month, p.day + 2, WORK_START_HOUR);
      continue;
    }
    const minutes = p.hour * 60 + p.minute;
    if (minutes < WORK_START_HOUR * 60) {
      cursor = fromLondon(p.year, p.month, p.day, WORK_START_HOUR);
      continue;
    }
    if (minutes >= WORK_END_HOUR * 60) {
      cursor = fromLondon(p.year, p.month, p.day + 1, WORK_START_HOUR);
      continue;
    }
    return cursor;
  }
  return cursor;
}

/**
 * Adds working hours to an instant, skipping evenings and weekends.
 * An enquiry that lands at 16:00 on a Friday is due at 12:00 the next Monday,
 * not 20:00 on the Friday.
 */
export function addWorkingHours(start: Date, hours: number): Date {
  if (hours <= 0) return new Date(start.getTime());

  let cursor = advanceIntoWorkingHours(start);
  let remainingMs = hours * 3_600_000;

  for (let i = 0; i < 60 && remainingMs > 0; i += 1) {
    const p = londonParts(cursor);
    const endOfDay = fromLondon(p.year, p.month, p.day, WORK_END_HOUR);
    const msLeftToday = endOfDay.getTime() - cursor.getTime();

    if (remainingMs <= msLeftToday) {
      return new Date(cursor.getTime() + remainingMs);
    }

    remainingMs -= msLeftToday;
    cursor = advanceIntoWorkingHours(new Date(endOfDay.getTime() + 60_000));
  }

  return cursor;
}

/** Adds whole calendar days, then lands on the next working 09:00 if needed. */
export function addWorkingDays(start: Date, days: number): Date {
  const p = londonParts(start);
  const target = fromLondon(p.year, p.month, p.day + days, p.hour, p.minute);
  return advanceIntoWorkingHours(target);
}

/** The three SLA deadlines for a new enquiry. */
export function enquiryDeadlines(createdAt: Date): {
  quoteDueAt: Date;
  followUp1DueAt: Date;
  followUp2DueAt: Date;
} {
  return {
    quoteDueAt: addWorkingHours(createdAt, QUOTE_SLA_WORKING_HOURS),
    followUp1DueAt: addWorkingDays(createdAt, FOLLOW_UP_1_DAYS),
    followUp2DueAt: addWorkingDays(createdAt, FOLLOW_UP_2_DAYS),
  };
}
