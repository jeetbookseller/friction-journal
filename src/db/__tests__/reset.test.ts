import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../database';
import { softDeleteAllData } from '../reset';

beforeEach(async () => {
  await db.actions.clear();
  await db.timeline_events.clear();
  await db.habits.clear();
  await db.habit_logs.clear();
  await db.rapid_logs.clear();
});

const now = Date.now();

async function seedAllTables() {
  await db.actions.add({
    uuid: crypto.randomUUID(), user_id: '', date: '2026-06-28', title: 'Task',
    is_completed: 0, is_top_priority: 0, sort_order: 0,
    created_at: now, updated_at: now, deleted_at: null,
  });
  await db.timeline_events.add({
    uuid: crypto.randomUUID(), user_id: '', date: '2026-06-28', note: 'Note',
    created_at: now, updated_at: now, deleted_at: null,
  });
  await db.habits.add({
    uuid: crypto.randomUUID(), user_id: '', name: 'Walk', details: '', is_active: 1,
    created_at: now, updated_at: now, deleted_at: null,
  });
  await db.habit_logs.add({
    uuid: crypto.randomUUID(), user_id: '', habit_uuid: 'h', date: '2026-06-28',
    completed: 1, created_at: now, updated_at: now, deleted_at: null,
  });
  await db.rapid_logs.add({
    uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'Entry',
    created_at: now, updated_at: now, deleted_at: null,
    sent_to_ph: 0, sent_to_ph_at: null,
  });
}

describe('softDeleteAllData', () => {
  it('tombstones every row in all 5 tables without removing them', async () => {
    await seedAllTables();

    const count = await softDeleteAllData();

    expect(count).toBe(5);
    for (const table of [db.actions, db.timeline_events, db.habits, db.habit_logs, db.rapid_logs]) {
      expect(await table.count()).toBe(1);
      const rows = await table.toArray();
      expect(rows[0].deleted_at).not.toBeNull();
      expect(rows[0].updated_at).toBeGreaterThanOrEqual(rows[0].deleted_at!);
    }
  });

  it('is idempotent: already-deleted rows keep their original tombstone', async () => {
    const originalDeletedAt = now - 100000;
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'Already gone',
      created_at: now, updated_at: now, deleted_at: originalDeletedAt,
      sent_to_ph: 0, sent_to_ph_at: null,
    });

    const count = await softDeleteAllData();

    expect(count).toBe(0);
    const row = (await db.rapid_logs.toArray())[0];
    expect(row.deleted_at).toBe(originalDeletedAt);
  });
});
