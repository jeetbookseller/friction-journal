import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../db/database';
import { csvEscape, gatherCsvData, buildCsv } from '../csv';

beforeEach(async () => {
  await db.actions.clear();
  await db.timeline_events.clear();
  await db.habits.clear();
  await db.habit_logs.clear();
  await db.rapid_logs.clear();
});

describe('csvEscape', () => {
  it('leaves plain values untouched', () => {
    expect(csvEscape('plain value')).toBe('plain value');
  });

  it('quotes values containing commas', () => {
    expect(csvEscape('a,b')).toBe('"a,b"');
  });

  it('doubles internal quotes', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('quotes values containing newlines', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });
});

describe('buildCsv', () => {
  it('emits the simplified 5-column header and rows', () => {
    const csv = buildCsv([
      {
        date: '2026-06-28',
        actionsCompleted: 3,
        habitsCompleted: 'Walk ✓',
        timeline: 'Chicago Trip',
        rapidLogNotes: 'Flight delayed | excited',
      },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('date,actions_completed,habits_completed,timeline,rapid_log_notes');
    expect(lines[1]).toBe('2026-06-28,3,Walk ✓,Chicago Trip,Flight delayed | excited');
  });
});

describe('gatherCsvData', () => {
  const now = Date.now();

  it('builds a full row: actions count, habit ✓ list, timeline, rapid logs', async () => {
    const dayMs = new Date(2026, 5, 28, 12).getTime(); // local noon, 2026-06-28

    await db.actions.add({
      uuid: crypto.randomUUID(), user_id: '', date: '2026-06-28', title: 'Pack',
      is_completed: 1, is_top_priority: 0, sort_order: 0,
      created_at: now, updated_at: now, deleted_at: null,
    });
    const walkUuid = crypto.randomUUID();
    await db.habits.add({
      uuid: walkUuid, user_id: '', name: 'Walk', details: '', is_active: 1,
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.habit_logs.add({
      uuid: crypto.randomUUID(), user_id: '', habit_uuid: walkUuid,
      date: '2026-06-28', completed: 1,
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.timeline_events.add({
      uuid: crypto.randomUUID(), user_id: '', date: '2026-06-28', note: 'Chicago Trip',
      created_at: now, updated_at: now, deleted_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'Flight delayed',
      created_at: dayMs, updated_at: dayMs, deleted_at: null,
      sent_to_ph: 0, sent_to_ph_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'mood', body: 'excited',
      created_at: dayMs + 1000, updated_at: dayMs + 1000, deleted_at: null,
      sent_to_ph: 0, sent_to_ph_at: null,
    });

    const days = await gatherCsvData('2026-06-28', '2026-06-28');
    expect(days).toHaveLength(1);
    expect(days[0]).toEqual({
      date: '2026-06-28',
      actionsCompleted: 1,
      habitsCompleted: 'Walk ✓',
      timeline: 'Chicago Trip',
      rapidLogNotes: 'Flight delayed | excited',
    });
  });

  it('excludes rapid logs outside the range and soft-deleted logs', async () => {
    const inRange = new Date(2026, 5, 28, 12).getTime();
    const outOfRange = new Date(2026, 5, 20, 12).getTime();

    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'kept',
      created_at: inRange, updated_at: inRange, deleted_at: null,
      sent_to_ph: 0, sent_to_ph_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'too old',
      created_at: outOfRange, updated_at: outOfRange, deleted_at: null,
      sent_to_ph: 0, sent_to_ph_at: null,
    });
    await db.rapid_logs.add({
      uuid: crypto.randomUUID(), user_id: '', tag: 'note', body: 'deleted',
      created_at: inRange, updated_at: inRange, deleted_at: now,
      sent_to_ph: 0, sent_to_ph_at: null,
    });

    const days = await gatherCsvData('2026-06-28', '2026-06-28');
    expect(days[0].rapidLogNotes).toBe('kept');
  });
});
