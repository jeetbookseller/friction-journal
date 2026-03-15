import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import {
  addHabit,
  deactivateHabit,
  reactivateHabit,
  toggleHabitLog,
  isTestRun,
} from '../useHabits';
import type { Habit } from '../../db/models';

beforeEach(async () => {
  await db.habits.clear();
  await db.habit_logs.clear();
});

function makeHabit(overrides: Partial<Habit> = {}): Omit<Habit, 'id'> {
  return {
    uuid: crypto.randomUUID(),
    name: 'Test Habit',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    ...overrides,
  };
}

describe('addHabit', () => {
  it('inserts a habit with correct fields', async () => {
    await addHabit('Morning Run');

    const all = await db.habits.toArray();
    expect(all).toHaveLength(1);
    const habit = all[0];
    expect(habit.name).toBe('Morning Run');
    expect(habit.is_active).toBe(1);
    expect(habit.deleted_at).toBeNull();
    expect(habit.uuid).toBeTruthy();
    expect(typeof habit.created_at).toBe('number');
    expect(typeof habit.updated_at).toBe('number');
  });

  it('throws "Habit cap reached" when 3 active habits exist', async () => {
    for (let i = 0; i < 3; i++) {
      await db.habits.add(makeHabit({ name: `Habit ${i}` }));
    }

    await expect(addHabit('Fourth Habit')).rejects.toThrow('Habit cap reached');
  });

  it('allows adding when fewer than 3 active habits exist', async () => {
    await db.habits.add(makeHabit({ name: 'Habit 1' }));
    await db.habits.add(makeHabit({ name: 'Habit 2' }));

    await expect(addHabit('Habit 3')).resolves.not.toThrow();
    expect(await db.habits.count()).toBe(3);
  });

  it('does not count soft-deleted habits toward cap', async () => {
    for (let i = 0; i < 3; i++) {
      await db.habits.add(makeHabit({ name: `Deleted ${i}`, deleted_at: Date.now() }));
    }

    await expect(addHabit('New Habit')).resolves.not.toThrow();
  });

  it('does not count inactive habits toward cap', async () => {
    for (let i = 0; i < 3; i++) {
      await db.habits.add(makeHabit({ name: `Inactive ${i}`, is_active: 0 }));
    }

    await expect(addHabit('New Habit')).resolves.not.toThrow();
  });
});

describe('deactivateHabit', () => {
  it('sets is_active to 0', async () => {
    const id = await db.habits.add(makeHabit());

    await deactivateHabit(id as number);

    const habit = await db.habits.get(id as number);
    expect(habit?.is_active).toBe(0);
  });

  it('does not physically remove the row', async () => {
    const id = await db.habits.add(makeHabit());

    await deactivateHabit(id as number);

    expect(await db.habits.count()).toBe(1);
  });
});

describe('reactivateHabit', () => {
  it('sets is_active to 1 when cap not reached', async () => {
    const id = await db.habits.add(makeHabit({ is_active: 0 }));

    await reactivateHabit(id as number);

    const habit = await db.habits.get(id as number);
    expect(habit?.is_active).toBe(1);
  });

  it('throws "Habit cap reached" when 3 active habits exist', async () => {
    for (let i = 0; i < 3; i++) {
      await db.habits.add(makeHabit({ name: `Active ${i}` }));
    }
    const id = await db.habits.add(makeHabit({ name: 'Inactive', is_active: 0 }));

    await expect(reactivateHabit(id as number)).rejects.toThrow('Habit cap reached');
  });
});

describe('toggleHabitLog', () => {
  it('creates log with completed=1 when no existing log', async () => {
    const uuid = crypto.randomUUID();
    await toggleHabitLog(uuid, '2026-03-15');

    const logs = await db.habit_logs.toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0].habit_uuid).toBe(uuid);
    expect(logs[0].date).toBe('2026-03-15');
    expect(logs[0].completed).toBe(1);
    expect(logs[0].deleted_at).toBeNull();
  });

  it('sets completed=0 when existing log has completed=1', async () => {
    const uuid = crypto.randomUUID();
    const now = Date.now();
    const id = await db.habit_logs.add({
      uuid: crypto.randomUUID(),
      habit_uuid: uuid,
      date: '2026-03-15',
      completed: 1,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    await toggleHabitLog(uuid, '2026-03-15');

    const log = await db.habit_logs.get(id as number);
    expect(log?.completed).toBe(0);
  });

  it('sets completed=1 when existing log has completed=0', async () => {
    const uuid = crypto.randomUUID();
    const now = Date.now();
    const id = await db.habit_logs.add({
      uuid: crypto.randomUUID(),
      habit_uuid: uuid,
      date: '2026-03-15',
      completed: 0,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    await toggleHabitLog(uuid, '2026-03-15');

    const log = await db.habit_logs.get(id as number);
    expect(log?.completed).toBe(1);
  });
});

describe('isTestRun', () => {
  it('returns true for a brand new habit', () => {
    const habit: Habit = {
      id: 1,
      uuid: crypto.randomUUID(),
      name: 'New Habit',
      is_active: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };

    expect(isTestRun(habit)).toBe(true);
  });

  it('returns false for a habit older than 7 days', () => {
    const habit: Habit = {
      id: 1,
      uuid: crypto.randomUUID(),
      name: 'Old Habit',
      is_active: 1,
      created_at: Date.now() - 8 * 86400000,
      updated_at: Date.now(),
      deleted_at: null,
    };

    expect(isTestRun(habit)).toBe(false);
  });

  it('returns true for a habit exactly 7 days old', () => {
    const habit: Habit = {
      id: 1,
      uuid: crypto.randomUUID(),
      name: 'Week Old Habit',
      is_active: 1,
      created_at: Date.now() - 7 * 86400000,
      updated_at: Date.now(),
      deleted_at: null,
    };

    expect(isTestRun(habit)).toBe(true);
  });
});
