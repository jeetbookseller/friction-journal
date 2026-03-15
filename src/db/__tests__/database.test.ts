import { describe, it, expect } from 'vitest';
import Dexie from 'dexie';
import { db } from '../database';

describe('database', () => {
  it('db is a Dexie instance', () => {
    expect(db).toBeInstanceOf(Dexie);
  });

  it('db has all 5 tables', () => {
    const tableNames = db.tables.map((t) => t.name);
    expect(tableNames).toContain('actions');
    expect(tableNames).toContain('timeline_events');
    expect(tableNames).toContain('habits');
    expect(tableNames).toContain('habit_logs');
    expect(tableNames).toContain('rapid_logs');
  });

  it('db has exactly 5 tables', () => {
    expect(db.tables).toHaveLength(5);
  });
});
