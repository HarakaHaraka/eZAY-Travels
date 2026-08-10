import { describe, expect, it } from 'vitest';
import {
  addWorkingDays,
  addWorkingHours,
  enquiryDeadlines,
  fromLondon,
  isWithinWorkingHours,
  londonParts,
} from '@/lib/workingHours';

/** Reads an instant back as a London wall-clock string, for readable assertions. */
function london(date: Date): string {
  const p = londonParts(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.year}-${pad(p.month)}-${pad(p.day)} ${pad(p.hour)}:${pad(p.minute)}`;
}

describe('isWithinWorkingHours', () => {
  it('accepts a Tuesday mid-morning', () => {
    expect(isWithinWorkingHours(fromLondon(2026, 9, 15, 10, 0))).toBe(true);
  });

  it('rejects before 09:00 and from 17:00', () => {
    expect(isWithinWorkingHours(fromLondon(2026, 9, 15, 8, 59))).toBe(false);
    expect(isWithinWorkingHours(fromLondon(2026, 9, 15, 17, 0))).toBe(false);
  });

  it('rejects the weekend', () => {
    // 2026-09-19 is a Saturday, 2026-09-20 a Sunday.
    expect(isWithinWorkingHours(fromLondon(2026, 9, 19, 11, 0))).toBe(false);
    expect(isWithinWorkingHours(fromLondon(2026, 9, 20, 11, 0))).toBe(false);
  });
});

describe('addWorkingHours', () => {
  it('adds within a single working day', () => {
    // Tuesday 10:00 + 4h = Tuesday 14:00
    const result = addWorkingHours(fromLondon(2026, 9, 15, 10, 0), 4);
    expect(london(result)).toBe('2026-09-15 14:00');
  });

  it('rolls over the end of the day onto the next morning', () => {
    // Tuesday 16:00 + 4h: 1h left today, 3h into Wednesday -> Wed 12:00
    const result = addWorkingHours(fromLondon(2026, 9, 15, 16, 0), 4);
    expect(london(result)).toBe('2026-09-16 12:00');
  });

  it('skips the weekend — a Friday afternoon enquiry is due Monday', () => {
    // Friday 2026-09-18 16:00 + 4h -> Monday 2026-09-21 12:00
    const result = addWorkingHours(fromLondon(2026, 9, 18, 16, 0), 4);
    expect(london(result)).toBe('2026-09-21 12:00');
  });

  it('treats a Saturday arrival as Monday 09:00 and counts from there', () => {
    // Saturday 2026-09-19 11:00 + 4h -> Monday 13:00
    const result = addWorkingHours(fromLondon(2026, 9, 19, 11, 0), 4);
    expect(london(result)).toBe('2026-09-21 13:00');
  });

  it('treats a Sunday arrival as Monday 09:00', () => {
    const result = addWorkingHours(fromLondon(2026, 9, 20, 20, 0), 1);
    expect(london(result)).toBe('2026-09-21 10:00');
  });

  it('treats an out-of-hours weekday evening as the next morning', () => {
    // Tuesday 21:00 -> Wednesday 09:00 + 2h = 11:00
    const result = addWorkingHours(fromLondon(2026, 9, 15, 21, 0), 2);
    expect(london(result)).toBe('2026-09-16 11:00');
  });

  it('treats an early-morning arrival as 09:00 the same day', () => {
    const result = addWorkingHours(fromLondon(2026, 9, 15, 6, 30), 1);
    expect(london(result)).toBe('2026-09-15 10:00');
  });

  it('spans several days when the SLA is long', () => {
    // Monday 09:00 + 20 working hours = 2.5 working days -> Wednesday 13:00
    const result = addWorkingHours(fromLondon(2026, 9, 14, 9, 0), 20);
    expect(london(result)).toBe('2026-09-16 13:00');
  });
});

describe('British Summer Time', () => {
  it('keeps London wall-clock correct across the spring transition', () => {
    // BST starts Sunday 2026-03-29. An enquiry the Friday before, due after.
    const result = addWorkingHours(fromLondon(2026, 3, 27, 16, 0), 4);
    expect(london(result)).toBe('2026-03-30 12:00');
  });

  it('keeps London wall-clock correct across the autumn transition', () => {
    // BST ends Sunday 2026-10-25.
    const result = addWorkingHours(fromLondon(2026, 10, 23, 16, 0), 4);
    expect(london(result)).toBe('2026-10-26 12:00');
  });

  it('is a real offset difference, not UTC pretending to be London', () => {
    // Mid-summer London is UTC+1, mid-winter is UTC+0. If this were naive UTC
    // both would render identically and this test would fail.
    const summer = fromLondon(2026, 7, 1, 12, 0);
    const winter = fromLondon(2026, 1, 1, 12, 0);
    expect(summer.getUTCHours()).toBe(11);
    expect(winter.getUTCHours()).toBe(12);
  });
});

describe('addWorkingDays', () => {
  it('lands on a working day at the same time', () => {
    // Monday + 2 days = Wednesday
    const result = addWorkingDays(fromLondon(2026, 9, 14, 11, 0), 2);
    expect(london(result)).toBe('2026-09-16 11:00');
  });

  it('pushes a weekend landing to Monday morning', () => {
    // Thursday + 2 days = Saturday -> Monday 09:00
    const result = addWorkingDays(fromLondon(2026, 9, 17, 11, 0), 2);
    expect(london(result)).toBe('2026-09-21 09:00');
  });
});

describe('enquiryDeadlines', () => {
  it('produces quote, follow-up 1 and follow-up 2 in order', () => {
    const createdAt = fromLondon(2026, 9, 15, 10, 0);
    const d = enquiryDeadlines(createdAt);
    expect(london(d.quoteDueAt)).toBe('2026-09-15 14:00');
    expect(d.followUp1DueAt.getTime()).toBeGreaterThan(d.quoteDueAt.getTime());
    expect(d.followUp2DueAt.getTime()).toBeGreaterThan(d.followUp1DueAt.getTime());
  });
});
