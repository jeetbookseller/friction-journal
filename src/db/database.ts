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
    // Bump version to add user_id index and sent_to_ph columns.
    // Non-indexed additions (user_id data, sent_to_ph, sent_to_ph_at) are handled automatically.
    this.version(2).stores({
      actions:         '++id, uuid, user_id, date, updated_at, deleted_at',
      timeline_events: '++id, uuid, user_id, date, updated_at, deleted_at',
      habits:          '++id, uuid, user_id, is_active, updated_at, deleted_at',
      habit_logs:      '++id, uuid, user_id, [habit_uuid+date], updated_at, deleted_at',
      rapid_logs:      '++id, uuid, user_id, tag, updated_at, deleted_at',
    });
  }
}

export const db = new FrictionJournalDB();
