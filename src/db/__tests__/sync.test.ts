import { describe, it, expect } from 'vitest';
import { syncWithSupabase } from '../sync';
import type { SyncResult } from '../sync';

describe('syncWithSupabase', () => {
  it('is exported as a function', () => {
    expect(typeof syncWithSupabase).toBe('function');
  });

  it('returns a Promise', () => {
    const result = syncWithSupabase();
    expect(result).toBeInstanceOf(Promise);
  });

  it('resolves without throwing', async () => {
    await expect(syncWithSupabase()).resolves.toBeDefined();
  });

  it('returns a SyncResult with pulled, pushed, conflicts properties', async () => {
    const result: SyncResult = await syncWithSupabase();
    expect(result).toHaveProperty('pulled');
    expect(result).toHaveProperty('pushed');
    expect(result).toHaveProperty('conflicts');
  });

  it('returns zero counts when Supabase is not configured', async () => {
    const result = await syncWithSupabase();
    expect(result.pulled).toBe(0);
    expect(result.pushed).toBe(0);
    expect(result.conflicts).toBe(0);
  });

  it('can be called multiple times without side effects', async () => {
    const r1 = await syncWithSupabase();
    const r2 = await syncWithSupabase();
    expect(r1).toEqual(r2);
  });
});
