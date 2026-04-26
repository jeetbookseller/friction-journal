import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import type { RapidLog } from '../db/models';

export async function addRapidLog(tag: RapidLog['tag'], body: string, userId = ''): Promise<void> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error('Body cannot be empty');
  }
  if (trimmed.length > 280) {
    throw new Error('Body cannot exceed 280 characters');
  }
  const now = Date.now();
  await db.rapid_logs.add({
    uuid: crypto.randomUUID(),
    user_id: userId,
    tag,
    body: trimmed,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    sent_to_ph: 0,
    sent_to_ph_at: null,
  });
}

export async function deleteRapidLog(id: number): Promise<void> {
  await db.rapid_logs.update(id, { deleted_at: Date.now(), updated_at: Date.now() });
}

export function useRapidLogs(userId: string, filter?: RapidLog['tag']): {
  logs: RapidLog[];
  addRapidLog: (tag: RapidLog['tag'], body: string) => Promise<void>;
  deleteRapidLog: (id: number) => Promise<void>;
} {
  const logs = useLiveQuery(async () => {
    const all = await db.rapid_logs
      .filter((l) => l.deleted_at === null && (filter === undefined || l.tag === filter))
      .toArray();
    return all.sort((a, b) => a.created_at - b.created_at);
  }, [filter]) ?? [];

  return {
    logs,
    addRapidLog: (tag: RapidLog['tag'], body: string) => addRapidLog(tag, body, userId),
    deleteRapidLog,
  };
}
