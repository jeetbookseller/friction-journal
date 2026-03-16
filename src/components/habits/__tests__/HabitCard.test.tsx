import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitCard } from '../HabitCard';
import type { Habit, HabitLog } from '../../../db/models';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    uuid: 'habit-uuid-1',
    name: 'Morning Run',
    is_active: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    ...overrides,
  };
}

function makeLog(date: string, completed: 0 | 1 = 1): HabitLog {
  return {
    id: 1,
    uuid: crypto.randomUUID(),
    habit_uuid: 'habit-uuid-1',
    date,
    completed,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  };
}

describe('HabitCard', () => {
  it('renders the habit name', () => {
    render(
      <HabitCard
        habit={makeHabit({ name: 'Evening Walk' })}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByText('Evening Walk')).toBeInTheDocument();
  });

  it('renders "Test Run" badge for a brand new habit', () => {
    render(
      <HabitCard
        habit={makeHabit({ created_at: Date.now() })}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByText(/test run/i)).toBeInTheDocument();
  });

  it('does not render "Test Run" badge for an older habit', () => {
    render(
      <HabitCard
        habit={makeHabit({ created_at: Date.now() - 8 * 86400000 })}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.queryByText(/test run/i)).not.toBeInTheDocument();
  });

  it('renders a today toggle button', () => {
    render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /toggle today/i })).toBeInTheDocument();
  });

  it('calls onToggleToday with habitUuid and today when toggle clicked', async () => {
    const onToggleToday = vi.fn();
    const habit = makeHabit({ uuid: 'test-uuid' });
    render(
      <HabitCard
        habit={habit}
        logs={[]}
        today="2026-03-15"
        onToggleToday={onToggleToday}
        onDeactivate={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /toggle today/i }));
    expect(onToggleToday).toHaveBeenCalledWith('test-uuid', '2026-03-15');
  });

  it('calls onDeactivate with habit id when deactivate button clicked', async () => {
    const onDeactivate = vi.fn();
    render(
      <HabitCard
        habit={makeHabit({ id: 42 })}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={onDeactivate}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /deactivate/i }));
    expect(onDeactivate).toHaveBeenCalledWith(42);
  });

  it('renders 14 day-dot elements', () => {
    render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    // Each dot has aria-label with date
    const dots = screen.getAllByRole('img', { hidden: true });
    expect(dots).toHaveLength(14);
  });

  it('shows today toggle as completed when log exists for today', () => {
    const habit = makeHabit({ uuid: 'habit-uuid-1' });
    render(
      <HabitCard
        habit={habit}
        logs={[makeLog('2026-03-15', 1)]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const toggleBtn = screen.getByRole('button', { name: /toggle today/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows today toggle as not completed when no log for today', () => {
    render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const toggleBtn = screen.getByRole('button', { name: /toggle today/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  // RWP-4 redesign tests
  it('day dots have rounded-sm class (squares, not circles)', () => {
    const { container } = render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const dots = container.querySelectorAll('.rounded-sm');
    expect(dots.length).toBeGreaterThanOrEqual(14);
  });

  it('completed dot has bg-success class', () => {
    const { container } = render(
      <HabitCard
        habit={makeHabit({ uuid: 'habit-uuid-1' })}
        logs={[makeLog('2026-03-15', 1)]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const completedDot = container.querySelector('[aria-label="2026-03-15"]');
    expect(completedDot).toHaveClass('bg-success');
  });

  it('incomplete dot has bg-surface-overlay class', () => {
    const { container } = render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const incompleteDot = container.querySelector('[aria-label="2026-03-15"]');
    expect(incompleteDot).toHaveClass('bg-surface-overlay');
  });

  it('Test Run badge has rounded-full class', () => {
    render(
      <HabitCard
        habit={makeHabit({ created_at: Date.now() })}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const badge = screen.getByText(/test run/i);
    expect(badge).toHaveClass('rounded-full');
  });

  it('today toggle has bg-success class when completed', () => {
    render(
      <HabitCard
        habit={makeHabit({ uuid: 'habit-uuid-1' })}
        logs={[makeLog('2026-03-15', 1)]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /toggle today/i });
    expect(btn).toHaveClass('bg-success');
  });

  it('today toggle has bg-surface-overlay class when not completed', () => {
    render(
      <HabitCard
        habit={makeHabit()}
        logs={[]}
        today="2026-03-15"
        onToggleToday={vi.fn()}
        onDeactivate={vi.fn()}
      />,
    );
    const btn = screen.getByRole('button', { name: /toggle today/i });
    expect(btn).toHaveClass('bg-surface-overlay');
  });
});
