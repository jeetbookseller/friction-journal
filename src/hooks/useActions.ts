import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { MAX_TOP_PRIORITIES } from '../lib/constants';
import type { Action } from '../db/models';

export async function addAction(date: string, title: string, userId = ''): Promise<void> {
  const count = await db.actions.where({ date }).filter((a) => a.deleted_at === null).count();
  const now = Date.now();
  await db.actions.add({
    uuid: crypto.randomUUID(),
    user_id: userId,
    date,
    title,
    is_completed: 0,
    is_top_priority: 0,
    sort_order: count,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
}

export async function toggleComplete(id: number): Promise<void> {
  const action = await db.actions.get(id);
  if (!action) return;
  await db.actions.update(id, {
    is_completed: action.is_completed === 1 ? 0 : 1,
    updated_at: Date.now(),
  });
}

export async function togglePriority(id: number): Promise<void> {
  const action = await db.actions.get(id);
  if (!action) return;

  if (action.is_top_priority === 0) {
    const priorityCount = await db.actions
      .where({ date: action.date, is_top_priority: 1 })
      .filter((a) => a.deleted_at === null)
      .count();

    if (priorityCount >= MAX_TOP_PRIORITIES) {
      throw new Error('Priority cap reached');
    }

    await db.actions.update(id, { is_top_priority: 1, updated_at: Date.now() });
  } else {
    await db.actions.update(id, { is_top_priority: 0, updated_at: Date.now() });
  }
}

export async function deleteAction(id: number): Promise<void> {
  await db.actions.update(id, { deleted_at: Date.now(), updated_at: Date.now() });
}

export async function reorderActions(ids: number[]): Promise<void> {
  await db.transaction('rw', db.actions, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.actions.update(ids[i], { sort_order: i, updated_at: Date.now() });
    }
  });
}

export function useActionsForDate(date: string, userId: string): {
  actions: Action[];
  priorityCount: number;
  addAction: (title: string) => Promise<void>;
  toggleComplete: (id: number) => Promise<void>;
  togglePriority: (id: number) => Promise<void>;
  deleteAction: (id: number) => Promise<void>;
  reorderActions: (ids: number[]) => Promise<void>;
} {
  const result = useLiveQuery(async () => {
    const actions = (
      await db.actions
        .where('date')
        .equals(date)
        .filter((a) => a.deleted_at === null)
        .toArray()
    ).sort((a, b) => a.sort_order - b.sort_order);
    const priorityCount = actions.filter((a) => a.is_top_priority === 1).length;
    return { actions, priorityCount };
  }, [date]) ?? { actions: [], priorityCount: 0 };

  return {
    actions: result.actions,
    priorityCount: result.priorityCount,
    addAction: (title: string) => addAction(date, title, userId),
    toggleComplete,
    togglePriority,
    deleteAction,
    reorderActions,
  };
}
