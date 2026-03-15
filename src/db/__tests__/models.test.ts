import { describe, it, expectTypeOf } from 'vitest';
import type { Action, TimelineEvent, Habit, HabitLog, RapidLog } from '../models';

describe('TypeScript model interfaces', () => {
  it('Action interface has correct shape', () => {
    const action: Action = {
      uuid: 'test-uuid',
      date: '2026-03-15',
      title: 'Test action',
      is_completed: 0,
      is_top_priority: 1,
      sort_order: 0,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };
    expectTypeOf(action.is_completed).toEqualTypeOf<0 | 1>();
    expectTypeOf(action.is_top_priority).toEqualTypeOf<0 | 1>();
    expectTypeOf(action.deleted_at).toEqualTypeOf<number | null>();
  });

  it('TimelineEvent interface has unique date', () => {
    const event: TimelineEvent = {
      uuid: 'test-uuid',
      date: '2026-03-15',
      note: 'Something happened',
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };
    expectTypeOf(event.date).toEqualTypeOf<string>();
  });

  it('Habit interface has is_active field', () => {
    const habit: Habit = {
      uuid: 'test-uuid',
      name: 'Morning run',
      is_active: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };
    expectTypeOf(habit.is_active).toEqualTypeOf<0 | 1>();
  });

  it('HabitLog interface links habit to date', () => {
    const log: HabitLog = {
      uuid: 'test-uuid',
      habit_uuid: 'habit-uuid',
      date: '2026-03-15',
      completed: 1,
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };
    expectTypeOf(log.completed).toEqualTypeOf<0 | 1>();
  });

  it('RapidLog tag is restricted to note | event | mood', () => {
    const log: RapidLog = {
      uuid: 'test-uuid',
      tag: 'note',
      body: 'A quick note',
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    };
    expectTypeOf(log.tag).toEqualTypeOf<'note' | 'event' | 'mood'>();
  });
});
