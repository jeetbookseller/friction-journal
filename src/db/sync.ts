/**
 * Supabase Sync — Stub / Scaffold
 *
 * ## Sync Architecture: Last-Write-Wins (LWW)
 *
 * LWW was chosen for simplicity in a single-user, offline-first app.
 * The device with the highest `updated_at` timestamp wins any conflict.
 * This is safe because only one user owns all data (no multi-user auth in v1).
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
 * timestamp. This ensures deletions propagate correctly — a deleted row on
 * one device will sync to all devices via the normal LWW pull/push cycle.
 * The local UI filters out rows where `deleted_at !== null`.
 *
 * ## Alternative: Field-Level Merge
 *
 * A more sophisticated strategy would merge individual fields rather than
 * entire rows. For example, if two devices edit different fields of the same
 * Action simultaneously, field-level merge would preserve both changes.
 * This is not implemented because:
 *   - Single-user apps rarely experience true concurrent edits
 *   - It requires tracking per-field timestamps (significant schema complexity)
 *   - LWW is sufficient for the use cases this app targets
 */

export interface SyncResult {
  /** Number of remote rows fetched and applied locally */
  pulled: number;
  /** Number of local rows upserted to remote */
  pushed: number;
  /** Number of conflicts resolved via LWW (remote timestamp was newer) */
  conflicts: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error' | 'success';

/**
 * Synchronize local IndexedDB with Supabase.
 *
 * Currently a no-op stub. When Supabase credentials are available
 * (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY), replace the TODO
 * sections below with the full pull → apply → push → confirm implementation.
 *
 * @returns SyncResult with counts of pulled, pushed, and resolved conflicts
 */
export async function syncWithSupabase(): Promise<SyncResult> {
  // TODO: Check if Supabase is configured
  //   const url = import.meta.env.VITE_SUPABASE_URL;
  //   const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  //   if (!url || !key) return { pulled: 0, pushed: 0, conflicts: 0 };

  // TODO: Step 1 — Pull
  //   const lastSync = Number(localStorage.getItem('last_sync_timestamp') ?? '0');
  //   const { data } = await supabase.rpc('pull_changes', { since: lastSync });

  // TODO: Step 2 — Apply (LWW per table, keyed by uuid)
  //   for (const row of data.actions) {
  //     const local = await db.actions.where({ uuid: row.uuid }).first();
  //     if (!local || row.updated_at > local.updated_at) {
  //       await db.actions.put(row);
  //       if (local) conflicts++;
  //     }
  //   }
  //   // ... repeat for timeline_events, habits, habit_logs, rapid_logs

  // TODO: Step 3 — Push
  //   const localChanges = await db.actions.where('updated_at').above(lastSync).toArray();
  //   await supabase.from('actions').upsert(localChanges, { onConflict: 'uuid' });
  //   // ... repeat for all tables

  // TODO: Step 4 — Confirm
  //   localStorage.setItem('last_sync_timestamp', String(Date.now()));

  return { pulled: 0, pushed: 0, conflicts: 0 };
}
