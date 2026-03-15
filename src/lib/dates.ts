import { format, eachDayOfInterval, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

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
