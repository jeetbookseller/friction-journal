import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HabitTracker } from '../HabitTracker';
import * as useHabitsModule from '../../../hooks/useHabits';
import type { Habit } from '../../../db/models';

vi.mock('../../../hooks/useHabits');

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    uuid: crypto.randomUUID(),
    name: 'Test Habit',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    ...overrides,
  };
}

function mockActiveHabits(
  habits: Habit[] = [],
  overrides: Partial<ReturnType<typeof useHabitsModule.useActiveHabits>> = {},
) {
  vi.mocked(useHabitsModule.useActiveHabits).mockReturnValue({
    habits,
    activeCount: habits.length,
    addHabit: vi.fn(),
    deactivateHabit: vi.fn(),
    reactivateHabit: vi.fn(),
    toggleHabitLog: vi.fn(),
    ...overrides,
  });
  vi.mocked(useHabitsModule.useHabitLogs).mockReturnValue([]);
  vi.mocked(useHabitsModule.isTestRun).mockReturnValue(false);
}

beforeEach(() => {
  mockActiveHabits();
});

describe('HabitTracker', () => {
  it('renders slot indicator showing 0/3 when no habits', () => {
    render(<HabitTracker />);
    expect(screen.getByText(/0\/3 habit slots/i)).toBeInTheDocument();
  });

  it('renders slot indicator showing correct count', () => {
    mockActiveHabits([makeHabit({ id: 1 }), makeHabit({ id: 2 })]);
    render(<HabitTracker />);
    expect(screen.getByText(/2\/3 habit slots/i)).toBeInTheDocument();
  });

  it('renders a HabitCard for each active habit', () => {
    mockActiveHabits([
      makeHabit({ id: 1, name: 'Morning Run' }),
      makeHabit({ id: 2, name: 'Evening Walk' }),
    ]);
    render(<HabitTracker />);
    expect(screen.getByText('Morning Run')).toBeInTheDocument();
    expect(screen.getByText('Evening Walk')).toBeInTheDocument();
  });

  it('"Add Habit" button is not disabled when fewer than 3 active', () => {
    mockActiveHabits([makeHabit({ id: 1 })]);
    render(<HabitTracker />);
    expect(screen.getByRole('button', { name: /add habit/i })).not.toBeDisabled();
  });

  it('"Add Habit" button is disabled when 3 active habits', () => {
    mockActiveHabits([makeHabit({ id: 1 }), makeHabit({ id: 2 }), makeHabit({ id: 3 })]);
    render(<HabitTracker />);
    expect(screen.getByRole('button', { name: /add habit/i })).toBeDisabled();
  });

  it('shows empty state message when no habits', () => {
    render(<HabitTracker />);
    expect(screen.getByText(/no active habits/i)).toBeInTheDocument();
  });
});
