import { describe, it, expect } from 'vitest';
import { todayString, getMonthRange, daysActiveCount } from '../dates';

describe('todayString', () => {
  it('returns a string matching YYYY-MM-DD format', () => {
    expect(todayString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns today\'s date (2026-03-15)', () => {
    expect(todayString()).toBe('2026-03-15');
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
