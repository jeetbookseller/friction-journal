import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HabitCard } from '../HabitCard';
import type { Habit, HabitLog } from '../../../db/models';

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 1,
    uuid: 'habit-uuid-1',
    user_id: '',
    name: 'Morning Run',
    details: '',
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
    user_id: '',
    habit_uuid: 'habit-uuid-1',
    date,
    completed,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
  };
}

interface RenderOverrides {
  habit?: Habit;
  logs?: HabitLog[];
  onToggleToday?: ReturnType<typeof vi.fn>;
  onUpdateDetails?: ReturnType<typeof vi.fn>;
  onDelete?: ReturnType<typeof vi.fn>;
}

function renderCard(overrides: RenderOverrides = {}) {
  return render(
    <HabitCard
      habit={overrides.habit ?? makeHabit()}
      logs={overrides.logs ?? []}
      today="2026-03-15"
      onToggleToday={overrides.onToggleToday ?? vi.fn()}
      onUpdateDetails={overrides.onUpdateDetails ?? vi.fn()}
      onDelete={overrides.onDelete ?? vi.fn()}
    />,
  );
}

describe('HabitCard', () => {
  it('renders the habit name', () => {
    renderCard({ habit: makeHabit({ name: 'Evening Walk' }) });
    expect(screen.getByText('Evening Walk')).toBeInTheDocument();
  });

  it('renders "Test Run" badge for a brand new habit', () => {
    renderCard({ habit: makeHabit({ created_at: Date.now() }) });
    expect(screen.getByText(/test run/i)).toBeInTheDocument();
  });

  it('does not render "Test Run" badge for an older habit', () => {
    renderCard({ habit: makeHabit({ created_at: Date.now() - 8 * 86400000 }) });
    expect(screen.queryByText(/test run/i)).not.toBeInTheDocument();
  });

  it('renders a today toggle button', () => {
    renderCard();
    expect(screen.getByRole('button', { name: /toggle today/i })).toBeInTheDocument();
  });

  it('calls onToggleToday with habitUuid and today when toggle clicked', async () => {
    const onToggleToday = vi.fn();
    renderCard({ habit: makeHabit({ uuid: 'test-uuid' }), onToggleToday });
    await userEvent.click(screen.getByRole('button', { name: /toggle today/i }));
    expect(onToggleToday).toHaveBeenCalledWith('test-uuid', '2026-03-15');
  });

  it('renders 14 day-dot elements', () => {
    renderCard();
    const dots = screen.getAllByRole('img', { hidden: true });
    expect(dots).toHaveLength(14);
  });

  it('shows today toggle as completed when log exists for today', () => {
    renderCard({ logs: [makeLog('2026-03-15', 1)] });
    const toggleBtn = screen.getByRole('button', { name: /toggle today/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows today toggle as not completed when no log for today', () => {
    renderCard();
    const toggleBtn = screen.getByRole('button', { name: /toggle today/i });
    expect(toggleBtn).toHaveAttribute('aria-pressed', 'false');
  });

  describe('details', () => {
    it('renders the details text', () => {
      renderCard({ habit: makeHabit({ details: '30 min at least' }) });
      expect(screen.getByText('30 min at least')).toBeInTheDocument();
    });

    it('shows placeholder when details are empty', () => {
      renderCard();
      expect(screen.getByText('Add details…')).toBeInTheDocument();
    });

    it('clicking details enters edit mode', async () => {
      renderCard({ habit: makeHabit({ details: '30 min' }) });
      await userEvent.click(screen.getByText('30 min'));
      expect(screen.getByLabelText('Edit habit details')).toHaveValue('30 min');
    });

    it('Enter commits the edited details', async () => {
      const onUpdateDetails = vi.fn();
      renderCard({ habit: makeHabit({ id: 7, details: '30 min' }), onUpdateDetails });
      await userEvent.click(screen.getByText('30 min'));
      const input = screen.getByLabelText('Edit habit details');
      await userEvent.clear(input);
      await userEvent.type(input, '45 min{Enter}');
      expect(onUpdateDetails).toHaveBeenCalledWith(7, '45 min');
    });

    it('Escape cancels editing without committing', async () => {
      const onUpdateDetails = vi.fn();
      renderCard({ habit: makeHabit({ details: '30 min' }), onUpdateDetails });
      await userEvent.click(screen.getByText('30 min'));
      const input = screen.getByLabelText('Edit habit details');
      await userEvent.type(input, ' more{Escape}');
      expect(onUpdateDetails).not.toHaveBeenCalled();
      expect(screen.getByText('30 min')).toBeInTheDocument();
    });

    it('allows clearing details', async () => {
      const onUpdateDetails = vi.fn();
      renderCard({ habit: makeHabit({ id: 7, details: '30 min' }), onUpdateDetails });
      await userEvent.click(screen.getByText('30 min'));
      const input = screen.getByLabelText('Edit habit details');
      await userEvent.clear(input);
      await userEvent.keyboard('{Enter}');
      expect(onUpdateDetails).toHaveBeenCalledWith(7, '');
    });
  });

  describe('delete', () => {
    it('renders no deactivate button', () => {
      renderCard();
      expect(screen.queryByRole('button', { name: /deactivate/i })).not.toBeInTheDocument();
    });

    it('delete button opens the confirm dialog', async () => {
      renderCard();
      await userEvent.click(screen.getByRole('button', { name: 'Delete habit' }));
      expect(screen.getByRole('dialog', { name: /delete habit/i })).toBeInTheDocument();
    });

    it('confirming calls onDelete with the habit id', async () => {
      const onDelete = vi.fn();
      renderCard({ habit: makeHabit({ id: 42 }), onDelete });
      await userEvent.click(screen.getByRole('button', { name: 'Delete habit' }));
      await userEvent.click(screen.getByRole('button', { name: 'Confirm delete habit' }));
      expect(onDelete).toHaveBeenCalledWith(42);
    });

    it('cancel closes the dialog without deleting', async () => {
      const onDelete = vi.fn();
      renderCard({ onDelete });
      await userEvent.click(screen.getByRole('button', { name: 'Delete habit' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onDelete).not.toHaveBeenCalled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  // RWP-4 redesign tests
  it('day dots have rounded-sm class (squares, not circles)', () => {
    const { container } = renderCard();
    const dots = container.querySelectorAll('.rounded-sm');
    expect(dots.length).toBeGreaterThanOrEqual(14);
  });

  it('completed dot has bg-success class', () => {
    const { container } = renderCard({ logs: [makeLog('2026-03-15', 1)] });
    const completedDot = container.querySelector('[aria-label="2026-03-15"]');
    expect(completedDot).toHaveClass('bg-success');
  });

  it('incomplete dot has bg-surface-overlay class', () => {
    const { container } = renderCard();
    const incompleteDot = container.querySelector('[aria-label="2026-03-15"]');
    expect(incompleteDot).toHaveClass('bg-surface-overlay');
  });

  it('Test Run badge has rounded-full class', () => {
    renderCard({ habit: makeHabit({ created_at: Date.now() }) });
    const badge = screen.getByText(/test run/i);
    expect(badge).toHaveClass('rounded-full');
  });

  it('today toggle has bg-success class when completed', () => {
    renderCard({ logs: [makeLog('2026-03-15', 1)] });
    const btn = screen.getByRole('button', { name: /toggle today/i });
    expect(btn).toHaveClass('bg-success');
  });

  it('today toggle has bg-surface-overlay class when not completed', () => {
    renderCard();
    const btn = screen.getByRole('button', { name: /toggle today/i });
    expect(btn).toHaveClass('bg-surface-overlay');
  });
});
