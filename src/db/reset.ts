import type { Table } from 'dexie';
import { db } from './database';
import { syncWithSupabase } from './sync';

type SoftDeletable = { deleted_at: number | null; updated_at: number };

/**
 * Soft-delete every non-deleted row in all 5 tables (tombstones stay local so
 * an offline reset still propagates on the next sync). Returns rows tombstoned.
 */
export async function softDeleteAllData(): Promise<number> {
  const now = Date.now();
  let count = 0;
  const tables = [
    db.actions,
    db.timeline_events,
    db.habits,
    db.habit_logs,
    db.rapid_logs,
  ] as unknown as Table<SoftDeletable>[];
  await db.transaction('rw', tables, async () => {
    for (const table of tables) {
      count += await table
        .filter((r) => r.deleted_at === null)
        .modify((r) => {
          r.deleted_at = now;
          r.updated_at = now;
        });
    }
  });
  return count;
}

/**
 * Reset everything: tombstone locally, then push the tombstones to Supabase.
 * Local deletion always succeeds first; a sync failure is rethrown so the UI
 * can tell the user the cloud copy will catch up on the next sync.
 */
export async function resetAllData(): Promise<void> {
  await softDeleteAllData();
  await syncWithSupabase();
}
