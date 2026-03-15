import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionList } from '../ActionList';
import * as useActionsModule from '../../../hooks/useActions';
import type { Action } from '../../../db/models';

vi.mock('../../../hooks/useActions');

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: 1,
    uuid: 'uuid-1',
    date: '2026-03-15',
    title: 'Test action',
    is_completed: 0,
    is_top_priority: 0,
    sort_order: 0,
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    ...overrides,
  };
}

function mockHook(overrides: Partial<ReturnType<typeof useActionsModule.useActionsForDate>> = {}) {
  vi.mocked(useActionsModule.useActionsForDate).mockReturnValue({
    actions: [],
    priorityCount: 0,
    addAction: vi.fn(),
    toggleComplete: vi.fn(),
    togglePriority: vi.fn(),
    deleteAction: vi.fn(),
    reorderActions: vi.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  mockHook();
});

describe('ActionList', () => {
  it('renders a date header', () => {
    render(<ActionList />);
    // Should contain a date string (any date header is fine)
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders priority count indicator', () => {
    mockHook({ priorityCount: 2 });
    render(<ActionList />);
    expect(screen.getByText(/2\/3 priorities/i)).toBeInTheDocument();
  });

  it('renders 0 priority count when no priorities', () => {
    mockHook({ priorityCount: 0 });
    render(<ActionList />);
    expect(screen.getByText(/0\/3 priorities/i)).toBeInTheDocument();
  });

  it('renders empty state when no actions', () => {
    mockHook({ actions: [] });
    render(<ActionList />);
    expect(screen.getByText(/no actions/i)).toBeInTheDocument();
  });

  it('renders an ActionItem for each action', () => {
    mockHook({
      actions: [
        makeAction({ id: 1, title: 'First task' }),
        makeAction({ id: 2, title: 'Second task' }),
      ],
    });
    render(<ActionList />);
    expect(screen.getByText('First task')).toBeInTheDocument();
    expect(screen.getByText('Second task')).toBeInTheDocument();
  });

  it('renders the AddActionForm', () => {
    render(<ActionList />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls addAction when form is submitted', async () => {
    const addActionMock = vi.fn();
    mockHook({ addAction: addActionMock });
    render(<ActionList />);
    await userEvent.type(screen.getByRole('textbox'), 'New task');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(addActionMock).toHaveBeenCalledWith('New task');
  });

  it('passes priorityCapReached=true to items when count is at max', () => {
    mockHook({
      priorityCount: 3,
      actions: [makeAction({ id: 1, is_top_priority: 0, title: 'Non-priority' })],
    });
    render(<ActionList />);
    expect(screen.getByRole('button', { name: /priority/i })).toBeDisabled();
  });

  it('passes priorityCapReached=false to items when count is below max', () => {
    mockHook({
      priorityCount: 2,
      actions: [makeAction({ id: 1, is_top_priority: 0, title: 'Task' })],
    });
    render(<ActionList />);
    expect(screen.getByRole('button', { name: /priority/i })).not.toBeDisabled();
  });
});
