import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { gatherMetrics } from '../useMetrics';

beforeEach(async () => {
  await db.actions.clear();
  await db.timeline_events.clear();
  await db.habits.clear();
  await db.habit_logs.clear();
});

const now = Date.now();

async function seedHabit(name: string, overrides: Record<string, unknown> = {}) {
  const uuid = crypto.randomUUID();
  await db.habits.add({
    uuid,
    user_id: '',
    name,
    details: '',
    is_active: 1,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    ...overrides,
  });
  return uuid;
}

async function seedAction(date: string, title: string, completed: 0 | 1) {
  await db.actions.add({
    uuid: crypto.randomUUID(),
    user_id: '',
    date,
    title,
    is_completed: completed,
    is_top_priority: 0,
    sort_order: 0,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  });
}

describe('gatherMetrics', () => {
  it('includes one entry per day of the range, even empty days', async () => {
    const { days } = await gatherMetrics('2026-06-28', '2026-07-04');
    expect(days).toHaveLength(7);
    expect(days[0].date).toBe('2026-06-28');
    expect(days[6].date).toBe('2026-07-04');
  });

  it('counts completed and total actions per day', async () => {
    await seedAction('2026-06-28', 'One', 1);
    await seedAction('2026-06-28', 'Two', 1);
    await seedAction('2026-06-28', 'Three', 0);
    await seedAction('2026-06-29', 'Other day', 1);

    const { days } = await gatherMetrics('2026-06-28', '2026-06-29');
    expect(days[0].actionsCompleted).toBe(2);
    expect(days[0].actionsTotal).toBe(3);
    expect(days[1].actionsCompleted).toBe(1);
  });

  it('excludes soft-deleted actions', async () => {
    await seedAction('2026-06-28', 'Kept', 1);
    await db.actions.add({
      uuid: crypto.randomUUID(),
      user_id: '',
      date: '2026-06-28',
      title: 'Deleted',
      is_completed: 1,
      is_top_priority: 0,
      sort_order: 0,
      created_at: now,
      updated_at: now,
      deleted_at: now,
    });

    const { days } = await gatherMetrics('2026-06-28', '2026-06-28');
    expect(days[0].actionsTotal).toBe(1);
  });

  it('maps habit completion per day by habit uuid', async () => {
    const walkUuid = await seedHabit('Walk');
    const meditationUuid = await seedHabit('Meditation');
    await db.habit_logs.add({
      uuid: crypto.randomUUID(),
      user_id: '',
      habit_uuid: walkUuid,
      date: '2026-06-28',
      completed: 1,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    const { days, habits } = await gatherMetrics('2026-06-28', '2026-06-28');
    expect(habits).toHaveLength(2);
    expect(days[0].habitDone[walkUuid]).toBe(true);
    expect(days[0].habitDone[meditationUuid]).toBe(false);
  });

  it('excludes deleted and inactive habits from columns', async () => {
    await seedHabit('Active');
    await seedHabit('Deleted', { deleted_at: now });
    await seedHabit('Inactive', { is_active: 0 });

    const { habits } = await gatherMetrics('2026-06-28', '2026-06-28');
    expect(habits).toHaveLength(1);
    expect(habits[0].name).toBe('Active');
  });

  it('includes the timeline note for each day', async () => {
    await db.timeline_events.add({
      uuid: crypto.randomUUID(),
      user_id: '',
      date: '2026-06-28',
      note: 'Chicago Trip',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });

    const { days } = await gatherMetrics('2026-06-28', '2026-06-29');
    expect(days[0].timelineNote).toBe('Chicago Trip');
    expect(days[1].timelineNote).toBe('');
  });
});
