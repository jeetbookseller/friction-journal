import Dexie, { type EntityTable } from 'dexie';
import type { Action, TimelineEvent, Habit, HabitLog, RapidLog } from './models';

class FrictionJournalDB extends Dexie {
  actions!: EntityTable<Action, 'id'>;
  timeline_events!: EntityTable<TimelineEvent, 'id'>;
  habits!: EntityTable<Habit, 'id'>;
  habit_logs!: EntityTable<HabitLog, 'id'>;
  rapid_logs!: EntityTable<RapidLog, 'id'>;

  constructor() {
    super('FrictionJournalDB');
    this.version(1).stores({
      actions:         '++id, uuid, date, is_top_priority, deleted_at',
      timeline_events: '++id, uuid, &date, deleted_at',
      habits:          '++id, uuid, is_active, deleted_at',
      habit_logs:      '++id, uuid, habit_uuid, date, [habit_uuid+date], deleted_at',
      rapid_logs:      '++id, uuid, tag, created_at, deleted_at',
    });
  }
}

export const db = new FrictionJournalDB();
