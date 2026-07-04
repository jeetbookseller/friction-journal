import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import {
  addHabit,
  updateHabitDetails,
  deleteHabit,
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
    user_id: '',
    name: 'Test Habit',
    details: '',
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
    expect(habit.details).toBe('');
    expect(habit.is_active).toBe(1);
    expect(habit.deleted_at).toBeNull();
    expect(habit.uuid).toBeTruthy();
    expect(typeof habit.created_at).toBe('number');
    expect(typeof habit.updated_at).toBe('number');
  });

  it('stores trimmed details when provided', async () => {
    await addHabit('Meditation', '  30 min at least  ');

    const habit = (await db.habits.toArray())[0];
    expect(habit.details).toBe('30 min at least');
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

describe('updateHabitDetails', () => {
  it('updates details and bumps updated_at', async () => {
    const id = await db.habits.add(makeHabit({ updated_at: 1000 }));

    await updateHabitDetails(id as number, '25 min');

    const habit = await db.habits.get(id as number);
    expect(habit?.details).toBe('25 min');
    expect(habit?.updated_at).toBeGreaterThan(1000);
  });

  it('trims details', async () => {
    const id = await db.habits.add(makeHabit());

    await updateHabitDetails(id as number, '  7.5 hours  ');

    const habit = await db.habits.get(id as number);
    expect(habit?.details).toBe('7.5 hours');
  });

  it('allows clearing details to an empty string', async () => {
    const id = await db.habits.add(makeHabit({ details: '30 min' }));

    await updateHabitDetails(id as number, '');

    const habit = await db.habits.get(id as number);
    expect(habit?.details).toBe('');
  });
});

describe('deleteHabit', () => {
  it('sets deleted_at and updated_at without removing the row', async () => {
    const id = await db.habits.add(makeHabit({ updated_at: 1000 }));

    await deleteHabit(id as number);

    expect(await db.habits.count()).toBe(1);
    const habit = await db.habits.get(id as number);
    expect(habit?.deleted_at).not.toBeNull();
    expect(habit?.updated_at).toBeGreaterThan(1000);
  });

  it('frees a habit slot toward the cap', async () => {
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      ids.push((await db.habits.add(makeHabit({ name: `Habit ${i}` }))) as number);
    }
    await expect(addHabit('Fourth')).rejects.toThrow('Habit cap reached');

    await deleteHabit(ids[0]);

    await expect(addHabit('Fourth')).resolves.not.toThrow();
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
      user_id: '',
      name: 'New Habit',
      details: '',
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
      user_id: '',
      name: 'Old Habit',
      details: '',
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
      user_id: '',
      name: 'Week Old Habit',
      details: '',
      is_active: 1,
      created_at: Date.now() - 7 * 86400000,
      updated_at: Date.now(),
      deleted_at: null,
    };

    expect(isTestRun(habit)).toBe(true);
  });
});
