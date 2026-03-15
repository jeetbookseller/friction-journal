import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/database';
import { MAX_ACTIVE_HABITS, TEST_RUN_DAYS } from '../lib/constants';
import type { Habit, HabitLog } from '../db/models';

export function isTestRun(habit: Habit): boolean {
  return Date.now() - habit.created_at <= TEST_RUN_DAYS * 86400000;
}

async function activeHabitCount(): Promise<number> {
  return db.habits
    .where({ is_active: 1 })
    .filter((h) => h.deleted_at === null)
    .count();
}

export async function addHabit(name: string): Promise<void> {
  const count = await activeHabitCount();
  if (count >= MAX_ACTIVE_HABITS) {
    throw new Error('Habit cap reached');
  }
  const now = Date.now();
  await db.habits.add({
    uuid: crypto.randomUUID(),
    name,
    is_active: 1,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
}

export async function deactivateHabit(id: number): Promise<void> {
  await db.habits.update(id, { is_active: 0, updated_at: Date.now() });
}

export async function reactivateHabit(id: number): Promise<void> {
  const count = await activeHabitCount();
  if (count >= MAX_ACTIVE_HABITS) {
    throw new Error('Habit cap reached');
  }
  await db.habits.update(id, { is_active: 1, updated_at: Date.now() });
}

export async function toggleHabitLog(habitUuid: string, date: string): Promise<void> {
  const existing = await db.habit_logs
    .where('[habit_uuid+date]')
    .equals([habitUuid, date])
    .first();

  const now = Date.now();
  if (!existing) {
    await db.habit_logs.add({
      uuid: crypto.randomUUID(),
      habit_uuid: habitUuid,
      date,
      completed: 1,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  } else {
    await db.habit_logs.update(existing.id!, {
      completed: existing.completed === 1 ? 0 : 1,
      updated_at: now,
    });
  }
}

export function useActiveHabits(): {
  habits: Habit[];
  activeCount: number;
  addHabit: (name: string) => Promise<void>;
  deactivateHabit: (id: number) => Promise<void>;
  reactivateHabit: (id: number) => Promise<void>;
  toggleHabitLog: (habitUuid: string, date: string) => Promise<void>;
} {
  const result = useLiveQuery(async () => {
    const habits = await db.habits
      .where({ is_active: 1 })
      .filter((h) => h.deleted_at === null)
      .toArray();
    return { habits, activeCount: habits.length };
  }, []) ?? { habits: [], activeCount: 0 };

  return {
    habits: result.habits,
    activeCount: result.activeCount,
    addHabit,
    deactivateHabit,
    reactivateHabit,
    toggleHabitLog,
  };
}

export function useHabitLogs(
  habitUuid: string,
  startDate: string,
  endDate: string,
): HabitLog[] {
  return useLiveQuery(
    async () => {
      return db.habit_logs
        .where('habit_uuid')
        .equals(habitUuid)
        .filter(
          (l) => l.deleted_at === null && l.date >= startDate && l.date <= endDate,
        )
        .toArray();
    },
    [habitUuid, startDate, endDate],
  ) ?? [];
}
