import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import {
  addAction,
  toggleComplete,
  togglePriority,
  deleteAction,
  reorderActions,
} from '../useActions';

beforeEach(async () => {
  await db.actions.clear();
});

describe('addAction', () => {
  it('inserts an action with correct fields', async () => {
    await addAction('2026-03-15', 'Write tests');

    const all = await db.actions.toArray();
    expect(all).toHaveLength(1);
    const action = all[0];
    expect(action.date).toBe('2026-03-15');
    expect(action.title).toBe('Write tests');
    expect(action.is_completed).toBe(0);
    expect(action.is_top_priority).toBe(0);
    expect(action.deleted_at).toBeNull();
    expect(action.uuid).toBeTruthy();
    expect(typeof action.sort_order).toBe('number');
    expect(typeof action.created_at).toBe('number');
    expect(typeof action.updated_at).toBe('number');
  });

  it('assigns ascending sort_order for multiple actions on same date', async () => {
    await addAction('2026-03-15', 'First');
    await addAction('2026-03-15', 'Second');

    const all = (await db.actions.toArray()).sort((a, b) => a.sort_order - b.sort_order);
    expect(all[0].title).toBe('First');
    expect(all[0].sort_order).toBe(0);
    expect(all[1].title).toBe('Second');
    expect(all[1].sort_order).toBe(1);
  });
});

describe('toggleComplete', () => {
  it('sets is_completed to 1 when it was 0', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Test',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await toggleComplete(id as number);

    const action = await db.actions.get(id as number);
    expect(action?.is_completed).toBe(1);
  });

  it('sets is_completed to 0 when it was 1', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Test',
      is_completed: 1,
      is_top_priority: 0,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await toggleComplete(id as number);

    const action = await db.actions.get(id as number);
    expect(action?.is_completed).toBe(0);
  });
});

describe('togglePriority', () => {
  it('sets is_top_priority to 1 when it was 0 and cap not reached', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Test',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await togglePriority(id as number);

    const action = await db.actions.get(id as number);
    expect(action?.is_top_priority).toBe(1);
  });

  it('sets is_top_priority to 0 when it was 1', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Test',
      is_completed: 0,
      is_top_priority: 1,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await togglePriority(id as number);

    const action = await db.actions.get(id as number);
    expect(action?.is_top_priority).toBe(0);
  });

  it('throws when trying to add priority and cap of 3 is already reached', async () => {
    const date = '2026-03-15';
    for (let i = 0; i < 3; i++) {
      await db.actions.add({
        uuid: crypto.randomUUID(),
        date,
        title: `Priority ${i}`,
        is_completed: 0,
        is_top_priority: 1,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
      });
    }

    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date,
      title: 'Would be 4th',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 3,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await expect(togglePriority(id as number)).rejects.toThrow('Priority cap reached');
  });

  it('allows toggling OFF priority even when cap is reached', async () => {
    const date = '2026-03-15';
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const id = await db.actions.add({
        uuid: crypto.randomUUID(),
        date,
        title: `Priority ${i}`,
        is_completed: 0,
        is_top_priority: 1,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
      });
      ids.push(id as number);
    }

    await togglePriority(ids[0]);

    const action = await db.actions.get(ids[0]);
    expect(action?.is_top_priority).toBe(0);
  });

  it('does not count soft-deleted items toward the cap', async () => {
    const date = '2026-03-15';
    for (let i = 0; i < 3; i++) {
      await db.actions.add({
        uuid: crypto.randomUUID(),
        date,
        title: `Deleted Priority ${i}`,
        is_completed: 0,
        is_top_priority: 1,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: Date.now(), // soft-deleted
      });
    }

    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date,
      title: 'Should become priority',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 3,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await togglePriority(id as number);

    const action = await db.actions.get(id as number);
    expect(action?.is_top_priority).toBe(1);
  });
});

describe('deleteAction', () => {
  it('soft-deletes by setting deleted_at timestamp', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Delete me',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await deleteAction(id as number);

    const action = await db.actions.get(id as number);
    expect(action).toBeDefined();
    expect(action?.deleted_at).not.toBeNull();
    expect(typeof action?.deleted_at).toBe('number');
  });

  it('does not physically remove the row', async () => {
    const id = await db.actions.add({
      uuid: crypto.randomUUID(),
      date: '2026-03-15',
      title: 'Still in DB',
      is_completed: 0,
      is_top_priority: 0,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });

    await deleteAction(id as number);

    const count = await db.actions.count();
    expect(count).toBe(1);
  });
});

describe('reorderActions', () => {
  it('updates sort_order based on position in ids array', async () => {
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const id = await db.actions.add({
        uuid: crypto.randomUUID(),
        date: '2026-03-15',
        title: `Action ${i}`,
        is_completed: 0,
        is_top_priority: 0,
        sort_order: i,
        created_at: Date.now(),
        updated_at: Date.now(),
        deleted_at: null,
      });
      ids.push(id as number);
    }

    // Reverse order
    await reorderActions([ids[2], ids[1], ids[0]]);

    const a0 = await db.actions.get(ids[0]);
    const a1 = await db.actions.get(ids[1]);
    const a2 = await db.actions.get(ids[2]);

    expect(a2?.sort_order).toBe(0);
    expect(a1?.sort_order).toBe(1);
    expect(a0?.sort_order).toBe(2);
  });
});
