import { useLiveQuery } from 'dexie-react-hooks';
import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { db } from '../db/database';
import type { Habit } from '../db/models';

export interface MetricsDay {
  date: string; // 'yyyy-MM-dd'
  actionsCompleted: number;
  actionsTotal: number;
  /** keyed by habit uuid */
  habitDone: Record<string, boolean>;
  timelineNote: string;
}

export interface MetricsData {
  days: MetricsDay[];
  habits: Habit[];
}

export async function gatherMetrics(startDate: string, endDate: string): Promise<MetricsData> {
  const habits = await db.habits
    .where({ is_active: 1 })
    .filter((h) => h.deleted_at === null)
    .toArray();

  const actions = await db.actions
    .where('date')
    .between(startDate, endDate, true, true)
    .filter((a) => a.deleted_at === null)
    .toArray();

  const habitLogs = await db.habit_logs
    .filter(
      (l) =>
        l.deleted_at === null &&
        l.completed === 1 &&
        l.date >= startDate &&
        l.date <= endDate,
    )
    .toArray();

  const timelineEvents = await db.timeline_events
    .where('date')
    .between(startDate, endDate, true, true)
    .filter((t) => t.deleted_at === null)
    .toArray();

  const timelineByDate = new Map(timelineEvents.map((t) => [t.date, t.note]));

  const days = eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  }).map((d): MetricsDay => {
    const date = format(d, 'yyyy-MM-dd');
    const dayActions = actions.filter((a) => a.date === date);
    const doneUuids = new Set(
      habitLogs.filter((l) => l.date === date).map((l) => l.habit_uuid),
    );
    return {
      date,
      actionsCompleted: dayActions.filter((a) => a.is_completed === 1).length,
      actionsTotal: dayActions.length,
      habitDone: Object.fromEntries(habits.map((h) => [h.uuid, doneUuids.has(h.uuid)])),
      timelineNote: timelineByDate.get(date) ?? '',
    };
  });

  return { days, habits };
}

export function useMetrics(startDate: string, endDate: string): MetricsData | undefined {
  return useLiveQuery(() => gatherMetrics(startDate, endDate), [startDate, endDate]);
}
