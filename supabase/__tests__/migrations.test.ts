import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('001_initial_schema.sql', () => {
  let sql: string;

  beforeAll(() => {
    sql = readFileSync(
      join(__dirname, '../migrations/001_initial_schema.sql'),
      'utf-8'
    );
  });

  it('contains CREATE TABLE for all 5 tables', () => {
    expect(sql).toContain('CREATE TABLE');
    expect(sql).toMatch(/\bactions\b/);
    expect(sql).toMatch(/\btimeline_events\b/);
    expect(sql).toMatch(/\bhabits\b/);
    expect(sql).toMatch(/\bhabit_logs\b/);
    expect(sql).toMatch(/\brapid_logs\b/);
  });

  it('enables RLS on all 5 tables', () => {
    const rlsMatches = (sql.match(/ENABLE ROW LEVEL SECURITY/g) || []).length;
    expect(rlsMatches).toBeGreaterThanOrEqual(5);
  });

  it('has updated_at trigger function', () => {
    expect(sql).toContain('CREATE OR REPLACE FUNCTION');
    expect(sql).toContain('updated_at');
    expect(sql).toContain('TRIGGER');
  });

  it('applies trigger to all 5 tables', () => {
    const triggerMatches = (sql.match(/CREATE TRIGGER/g) || []).length;
    expect(triggerMatches).toBeGreaterThanOrEqual(5);
  });

  it('includes updated_at indexes for sync efficiency', () => {
    const indexMatches = (sql.match(/CREATE INDEX/g) || []).length;
    expect(indexMatches).toBeGreaterThanOrEqual(5);
  });

  it('includes pull_changes RPC function', () => {
    expect(sql).toContain('pull_changes');
    expect(sql).toContain('CREATE OR REPLACE FUNCTION');
  });

  it('includes RLS policies', () => {
    expect(sql).toContain('CREATE POLICY');
    expect(sql).toContain('auth.uid()');
  });

  it('includes deleted_at columns on all tables for soft-delete sync', () => {
    const deletedAtMatches = (sql.match(/deleted_at/g) || []).length;
    expect(deletedAtMatches).toBeGreaterThanOrEqual(5);
  });

  it('uses BIGINT for timestamp columns (epoch ms)', () => {
    expect(sql).toContain('BIGINT');
    expect(sql).toContain('created_at');
    expect(sql).toContain('updated_at');
  });

  it('enforces unique date constraint on timeline_events', () => {
    expect(sql).toMatch(/UNIQUE.*date|date.*UNIQUE/);
  });

  it('enforces unique (habit_uuid, date) on habit_logs', () => {
    expect(sql).toContain('habit_uuid');
    expect(sql).toMatch(/UNIQUE \(habit_uuid, date\)|UNIQUE\(habit_uuid, date\)/);
  });

  it('restricts tag column to valid values on rapid_logs', () => {
    expect(sql).toContain('CHECK');
    expect(sql).toContain("'note'");
    expect(sql).toContain("'event'");
    expect(sql).toContain("'mood'");
  });
});
