export const MAX_TOP_PRIORITIES = 3;
export const MAX_ACTIVE_HABITS = 3;
export const TEST_RUN_DAYS = 7;
export const TAG_OPTIONS = ['note', 'event', 'mood'] as const;
export type Tag = typeof TAG_OPTIONS[number];
