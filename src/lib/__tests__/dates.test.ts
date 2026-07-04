import { describe, it, expect } from 'vitest';
import {
  todayString,
  getMonthRange,
  daysActiveCount,
  weekStartString,
  weekRangeLabel,
  dayLabel,
  shortDayLabel,
} from '../dates';

describe('todayString', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's local date", () => {
    const now = new Date();
    const expected = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-');
    expect(todayString()).toBe(expected);
  });
});

describe('getMonthRange', () => {
  it('returns 28 days for February 2026 (non-leap year)', () => {
    const days = getMonthRange(2026, 2);
    expect(days).toHaveLength(28);
  });

  it('first day of Feb 2026 is 2026-02-01', () => {
    const days = getMonthRange(2026, 2);
    expect(days[0]).toBe('2026-02-01');
  });

  it('last day of Feb 2026 is 2026-02-28', () => {
    const days = getMonthRange(2026, 2);
    expect(days[days.length - 1]).toBe('2026-02-28');
  });

  it('returns 31 days for March 2026', () => {
    const days = getMonthRange(2026, 3);
    expect(days).toHaveLength(31);
  });

  it('returns 29 days for February 2024 (leap year)', () => {
    const days = getMonthRange(2024, 2);
    expect(days).toHaveLength(29);
  });

  it('all entries match YYYY-MM-DD format', () => {
    const days = getMonthRange(2026, 3);
    for (const d of days) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('daysActiveCount', () => {
  it('returns 0 for a timestamp of right now', () => {
    expect(daysActiveCount(Date.now())).toBe(0);
  });

  it('returns approximately 3 for 3 days ago', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(daysActiveCount(threeDaysAgo)).toBe(3);
  });

  it('returns approximately 7 for 7 days ago', () => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    expect(daysActiveCount(sevenDaysAgo)).toBe(7);
  });
});

describe('weekStartString', () => {
  it('maps a mid-week date to the preceding Sunday', () => {
    // 2026-07-04 is a Saturday; its Sunday-start week begins 2026-06-28
    expect(weekStartString(new Date(2026, 6, 4))).toBe('2026-06-28');
  });

  it('maps a Sunday to itself', () => {
    expect(weekStartString(new Date(2026, 5, 28))).toBe('2026-06-28');
  });
});

describe('weekRangeLabel', () => {
  it('spans months: "June 28 – July 4"', () => {
    expect(weekRangeLabel('2026-06-28')).toBe('June 28 – July 4');
  });

  it('stays within one month: "June 7 – 13"', () => {
    expect(weekRangeLabel('2026-06-07')).toBe('June 7 – 13');
  });

  it('appends the year for non-current years', () => {
    expect(weekRangeLabel('2024-06-02')).toBe('June 2 – 8, 2024');
  });
});

describe('dayLabel', () => {
  it('formats as "Sat, Jul 4"', () => {
    expect(dayLabel(new Date(2026, 6, 4).getTime())).toBe('Sat, Jul 4');
  });
});

describe('shortDayLabel', () => {
  it('formats as "Su Jun 28"', () => {
    expect(shortDayLabel('2026-06-28')).toBe('Su Jun 28');
  });
});
