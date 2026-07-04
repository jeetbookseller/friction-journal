import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  parseISO,
} from 'date-fns';

export function todayString(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function getMonthRange(year: number, month: number): string[] {
  const start = startOfMonth(new Date(year, month - 1));
  const end = endOfMonth(new Date(year, month - 1));
  return eachDayOfInterval({ start, end }).map((d) => format(d, 'yyyy-MM-dd'));
}

export function daysActiveCount(createdAt: number): number {
  return differenceInDays(Date.now(), createdAt);
}

/** Sunday-start week containing `d`, as 'yyyy-MM-dd'. */
export function weekStartString(d: Date | number): string {
  return format(startOfWeek(d, { weekStartsOn: 0 }), 'yyyy-MM-dd');
}

/** "June 28 – July 4" (same month: "June 1 – 7"); year appended when not current. */
export function weekRangeLabel(weekStartIso: string): string {
  const start = parseISO(weekStartIso);
  const end = endOfWeek(start, { weekStartsOn: 0 });
  const sameMonth = start.getMonth() === end.getMonth();
  const base = sameMonth
    ? `${format(start, 'MMMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMMM d')} – ${format(end, 'MMMM d')}`;
  return end.getFullYear() === new Date().getFullYear()
    ? base
    : `${base}, ${format(end, 'yyyy')}`;
}

/** "Fri, Jul 4" for a day-group header. */
export function dayLabel(timestamp: number): string {
  return format(timestamp, 'EEE, MMM d');
}

/** "Su Jun 28" for metrics table rows. */
export function shortDayLabel(dateIso: string): string {
  return format(parseISO(dateIso), 'EEEEEE MMM d');
}
