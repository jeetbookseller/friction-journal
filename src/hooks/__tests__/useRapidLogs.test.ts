import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { addRapidLog, deleteRapidLog } from '../useRapidLogs';

beforeEach(async () => {
  await db.rapid_logs.clear();
});

describe('addRapidLog', () => {
  it('inserts a log with correct fields', async () => {
    await addRapidLog('note', 'Hello world');

    const all = await db.rapid_logs.toArray();
    expect(all).toHaveLength(1);
    const log = all[0];
    expect(log.tag).toBe('note');
    expect(log.body).toBe('Hello world');
    expect(log.deleted_at).toBeNull();
    expect(log.uuid).toBeTruthy();
    expect(typeof log.created_at).toBe('number');
    expect(typeof log.updated_at).toBe('number');
  });

  it('trims whitespace from body before inserting', async () => {
    await addRapidLog('event', '  trimmed  ');

    const all = await db.rapid_logs.toArray();
    expect(all[0].body).toBe('trimmed');
  });

  it('inserts with event tag', async () => {
    await addRapidLog('event', 'Something happened');
    const all = await db.rapid_logs.toArray();
    expect(all[0].tag).toBe('event');
  });

  it('inserts with mood tag', async () => {
    await addRapidLog('mood', 'Feeling good');
    const all = await db.rapid_logs.toArray();
    expect(all[0].tag).toBe('mood');
  });

  it('throws when body is empty string', async () => {
    await expect(addRapidLog('note', '')).rejects.toThrow();
  });

  it('throws when body is only whitespace', async () => {
    await expect(addRapidLog('note', '   ')).rejects.toThrow();
  });

  it('throws when body exceeds 280 characters', async () => {
    const longBody = 'a'.repeat(281);
    await expect(addRapidLog('note', longBody)).rejects.toThrow();
  });

  it('allows body of exactly 280 characters', async () => {
    const maxBody = 'a'.repeat(280);
    await expect(addRapidLog('note', maxBody)).resolves.toBeUndefined();
    const all = await db.rapid_logs.toArray();
    expect(all).toHaveLength(1);
  });
});

describe('deleteRapidLog', () => {
  it('soft-deletes by setting deleted_at to a timestamp', async () => {
    const id = await db.rapid_logs.add({
      uuid: crypto.randomUUID(),
      tag: 'note',
      body: 'Delete me',
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await deleteRapidLog(id as number);

    const log = await db.rapid_logs.get(id as number);
    expect(log).toBeDefined();
    expect(log?.deleted_at).not.toBeNull();
    expect(typeof log?.deleted_at).toBe('number');
  });

  it('does not physically remove the row', async () => {
    const id = await db.rapid_logs.add({
      uuid: crypto.randomUUID(),
      tag: 'event',
      body: 'Still here',
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await deleteRapidLog(id as number);

    const count = await db.rapid_logs.count();
    expect(count).toBe(1);
  });

  it('updates updated_at when soft-deleting', async () => {
    const createdAt = Date.now() - 5000;
    const id = await db.rapid_logs.add({
      uuid: crypto.randomUUID(),
      tag: 'mood',
      body: 'Track updated_at',
      created_at: createdAt,
      updated_at: createdAt,
      deleted_at: null,
    });

    await deleteRapidLog(id as number);

    const log = await db.rapid_logs.get(id as number);
    expect(log?.updated_at).toBeGreaterThan(createdAt);
  });
});

describe('getRapidLogs (DB queries matching useRapidLogs behavior)', () => {
  it('returns logs ordered by created_at ascending', async () => {
    const now = Date.now();
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'note', body: 'Second',
      created_at: now + 1000, updated_at: now + 1000, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'event', body: 'First',
      created_at: now, updated_at: now, deleted_at: null,
    });

    const logs = await db.rapid_logs
      .where('deleted_at')
      .equals(0)
      .filter((l) => l.deleted_at === null)
      .sortBy('created_at');

    const allLogs = (await db.rapid_logs.filter((l) => l.deleted_at === null).toArray())
      .sort((a, b) => a.created_at - b.created_at);

    expect(allLogs[0].body).toBe('First');
    expect(allLogs[1].body).toBe('Second');
  });

  it('excludes soft-deleted entries', async () => {
    const now = Date.now();
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'note', body: 'Active',
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'note', body: 'Deleted',
      created_at: now, updated_at: now, deleted_at: now,
    });

    const activeLogs = await db.rapid_logs.filter((l) => l.deleted_at === null).toArray();
    expect(activeLogs).toHaveLength(1);
    expect(activeLogs[0].body).toBe('Active');
  });

  it('filters by tag', async () => {
    const now = Date.now();
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'note', body: 'A note',
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'event', body: 'An event',
      created_at: now, updated_at: now, deleted_at: null,
    });

    const noteLogs = await db.rapid_logs
      .filter((l) => l.deleted_at === null && l.tag === 'note')
      .toArray();
    expect(noteLogs).toHaveLength(1);
    expect(noteLogs[0].body).toBe('A note');
  });

  it('returns all tags when no filter applied', async () => {
    const now = Date.now();
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'note', body: 'Note',
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'event', body: 'Event',
      created_at: now + 1, updated_at: now + 1, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), tag: 'mood', body: 'Mood',
      created_at: now + 2, updated_at: now + 2, deleted_at: null,
    });

    const allLogs = await db.rapid_logs.filter((l) => l.deleted_at === null).toArray();
    expect(allLogs).toHaveLength(3);
  });
});
