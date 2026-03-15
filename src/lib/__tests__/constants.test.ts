import { describe, it, expect } from 'vitest';
import {
  MAX_TOP_PRIORITIES,
  MAX_ACTIVE_HABITS,
  TEST_RUN_DAYS,
  TAG_OPTIONS,
} from '../constants';

describe('constants', () => {
  it('MAX_TOP_PRIORITIES is 3', () => {
    expect(MAX_TOP_PRIORITIES).toBe(3);
  });

  it('MAX_ACTIVE_HABITS is 3', () => {
    expect(MAX_ACTIVE_HABITS).toBe(3);
  });

  it('TEST_RUN_DAYS is 7', () => {
    expect(TEST_RUN_DAYS).toBe(7);
  });

  it('TAG_OPTIONS contains note, event, mood', () => {
    expect(TAG_OPTIONS).toEqual(['note', 'event', 'mood']);
  });

  it('TAG_OPTIONS has exactly 3 entries', () => {
    expect(TAG_OPTIONS).toHaveLength(3);
  });
});
