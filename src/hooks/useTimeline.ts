import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { getMonthRange } from '../lib/dates';
import type { TimelineEvent } from '../db/models';

export async function upsertEvent(date: string, note: string, userId = ''): Promise<void> {
  const existing = await db.timeline_events.where('date').equals(date).first();
  const now = Date.now();

  if (existing?.id !== undefined) {
    await db.timeline_events.update(existing.id, { note, updated_at: now });
  } else {
    await db.timeline_events.add({
      uuid: crypto.randomUUID(),
      user_id: userId,
      date,
      note,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  }
}

export function useTimelineForMonth(
  year: number,
  month: number,
  userId: string,
): {
  events: Map<string, TimelineEvent>;
  upsertEvent: (date: string, note: string) => Promise<void>;
} {
  const dates = getMonthRange(year, month);
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];

  const events =
    useLiveQuery(async () => {
      const rows = await db.timeline_events
        .where('date')
        .between(firstDate, lastDate, true, true)
        .filter((e) => e.deleted_at === null)
        .toArray();
      return new Map(rows.map((e) => [e.date, e]));
    }, [year, month]) ?? new Map<string, TimelineEvent>();

  return {
    events,
    upsertEvent: (date: string, note: string) => upsertEvent(date, note, userId),
  };
}
