import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { upsertEvent } from '../useTimeline';

beforeEach(async () => {
  await db.timeline_events.clear();
});

describe('upsertEvent', () => {
  it('inserts a new event with correct fields', async () => {
    await upsertEvent('2026-03-15', 'A beautiful day');

    const all = await db.timeline_events.toArray();
    expect(all).toHaveLength(1);
    const event = all[0];
    expect(event.date).toBe('2026-03-15');
    expect(event.note).toBe('A beautiful day');
    expect(event.deleted_at).toBeNull();
    expect(event.uuid).toBeTruthy();
    expect(typeof event.created_at).toBe('number');
    expect(typeof event.updated_at).toBe('number');
  });

  it('updates existing event on same date without creating a duplicate', async () => {
    await upsertEvent('2026-03-15', 'Original note');
    await upsertEvent('2026-03-15', 'Updated note');

    const all = await db.timeline_events.toArray();
    expect(all).toHaveLength(1);
    expect(all[0].note).toBe('Updated note');
  });

  it('updates updated_at when note is changed', async () => {
    await upsertEvent('2026-03-15', 'First note');
    const before = await db.timeline_events.where('date').equals('2026-03-15').first();

    await new Promise((r) => setTimeout(r, 5));
    await upsertEvent('2026-03-15', 'Second note');
    const after = await db.timeline_events.where('date').equals('2026-03-15').first();

    expect(after!.updated_at).toBeGreaterThanOrEqual(before!.updated_at);
    expect(after!.note).toBe('Second note');
  });

  it('can insert events for different dates independently', async () => {
    await upsertEvent('2026-03-15', 'March 15');
    await upsertEvent('2026-03-16', 'March 16');

    const all = await db.timeline_events.toArray();
    expect(all).toHaveLength(2);
  });

  it('preserves uuid and created_at on update', async () => {
    await upsertEvent('2026-03-15', 'Initial note');
    const original = await db.timeline_events.where('date').equals('2026-03-15').first();

    await upsertEvent('2026-03-15', 'Changed note');
    const updated = await db.timeline_events.where('date').equals('2026-03-15').first();

    expect(updated!.uuid).toBe(original!.uuid);
    expect(updated!.created_at).toBe(original!.created_at);
  });

  it('sets deleted_at to null on new event', async () => {
    await upsertEvent('2026-03-20', 'Some note');

    const event = await db.timeline_events.where('date').equals('2026-03-20').first();
    expect(event!.deleted_at).toBeNull();
  });
});
