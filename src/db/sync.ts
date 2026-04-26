/**
 * Supabase Sync — Last-Write-Wins (LWW)
 *
 * ## Sync Flow: pull → apply → push → confirm
 *
 * 1. PULL: Fetch all remote rows where `updated_at > last_sync_timestamp`
 *    via the `pull_changes` Supabase RPC function.
 *
 * 2. APPLY: For each remote row, compare with local row by `uuid`:
 *    - If remote.updated_at > local.updated_at → overwrite local (LWW wins)
 *    - If local.updated_at >= remote.updated_at → keep local (no-op)
 *    - If uuid not found locally → insert remote row as new
 *
 * 3. PUSH: Find all local rows where `updated_at > last_sync_timestamp`
 *    and upsert them to Supabase (conflict target: uuid).
 *
 * 4. CONFIRM: Update the stored `last_sync_timestamp` to `Date.now()`
 *    in localStorage so the next sync only fetches newer changes.
 *
 * ## Soft-Delete Pattern
 *
 * Rows are never hard-deleted. Instead, `deleted_at` is set to an epoch ms
 * timestamp. This ensures deletions propagate correctly across devices via
 * the normal LWW pull/push cycle.
 *
 * ## No-op when unconfigured
 *
 * If VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are absent, returns
 * { pulled: 0, pushed: 0, conflicts: 0 } immediately — the app stays
 * fully offline-only with no errors.
 */

import type { Table } from 'dexie';
import { supabase } from '../lib/supabase';
import { db } from './database';

const SYNC_KEY = 'last_sync_timestamp';

export interface SyncResult {
  /** Number of remote rows fetched and applied locally */
  pulled: number;
  /** Number of local rows upserted to remote */
  pushed: number;
  /** Number of conflicts resolved via LWW (remote timestamp was newer) */
  conflicts: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

type WithId = { id?: number; uuid: string; updated_at: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function applyTable<T extends WithId>(
  table: Table<any, any, any>,
  remoteRows: T[] | null,
  conflicts: { count: number },
): Promise<number> {
  if (!remoteRows?.length) return 0;
  let pulled = 0;
  for (const row of remoteRows) {
    const local = await table.where('uuid').equals(row.uuid).first();
    if (!local || row.updated_at > local.updated_at) {
      if (local) conflicts.count++;
      await table.put({ ...row, id: local?.id });
      pulled++;
    }
  }
  return pulled;
}

/**
 * Synchronize local IndexedDB with Supabase.
 *
 * Returns immediately with zero counts if Supabase is not configured.
 * Throws if the user is not authenticated or on network/API errors.
 */
export async function syncWithSupabase(): Promise<SyncResult> {
  if (!supabase) return { pulled: 0, pushed: 0, conflicts: 0 };

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const userId = session.user.id;

  const lastSync = Number(localStorage.getItem(SYNC_KEY) ?? '0');
  let pulled = 0;
  let pushed = 0;
  const conflicts = { count: 0 };

  // Step 1 — Pull
  const { data, error } = await supabase.rpc('pull_changes', { since: lastSync });
  if (error) throw new Error(`Sync pull failed: ${error.message}`);

  // Step 2 — Apply (LWW per table)
  pulled += await applyTable(db.actions, data.actions, conflicts);
  pulled += await applyTable(db.timeline_events, data.timeline_events, conflicts);
  pulled += await applyTable(db.habits, data.habits, conflicts);
  pulled += await applyTable(db.habit_logs, data.habit_logs, conflicts);
  pulled += await applyTable(db.rapid_logs, data.rapid_logs, conflicts);

  // Step 3 — Push (upsert local changes since lastSync, stamp user_id on every row)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tablePairs = [
    [db.actions, 'actions'],
    [db.timeline_events, 'timeline_events'],
    [db.habits, 'habits'],
    [db.habit_logs, 'habit_logs'],
    [db.rapid_logs, 'rapid_logs'],
  ] as [any, string][];

  for (const [table, name] of tablePairs) {
    const localChanges = await table.where('updated_at').above(lastSync).toArray();
    if (localChanges.length) {
      // Strip Dexie's auto-increment `id`; ensure user_id is set on every row
      const rows = localChanges.map(({ id: _id, ...row }: WithId) => ({
        ...row,
        user_id: userId,
      }));
      const { error: pushErr } = await supabase
        .from(name)
        .upsert(rows, { onConflict: 'uuid' });
      if (pushErr) throw new Error(`Sync push failed for ${name}: ${pushErr.message}`);
      pushed += localChanges.length;
    }
  }

  // Step 4 — Confirm
  localStorage.setItem(SYNC_KEY, String(Date.now()));

  return { pulled, pushed, conflicts: conflicts.count };
}
