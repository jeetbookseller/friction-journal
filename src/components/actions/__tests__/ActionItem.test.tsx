import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ActionItem } from '../ActionItem';
import type { Action } from '../../../db/models';

function makeAction(overrides: Partial<Action> = {}): Action {
  return {
    id: 1,
    uuid: 'test-uuid',
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

describe('ActionItem', () => {
  it('renders the action title', () => {
    render(
      <ActionItem
        action={makeAction({ title: 'My task' })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('My task')).toBeInTheDocument();
  });

  it('applies line-through style when action is completed', () => {
    render(
      <ActionItem
        action={makeAction({ is_completed: 1 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const title = screen.getByText('Test action');
    expect(title.className).toMatch(/line-through/);
  });

  it('does not apply line-through when action is not completed', () => {
    render(
      <ActionItem
        action={makeAction({ is_completed: 0 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const title = screen.getByText('Test action');
    expect(title.className).not.toMatch(/line-through/);
  });

  it('calls onToggleComplete with action id when checkbox is clicked', async () => {
    const onToggleComplete = vi.fn();
    render(
      <ActionItem
        action={makeAction({ id: 42 })}
        priorityCapReached={false}
        onToggleComplete={onToggleComplete}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onToggleComplete).toHaveBeenCalledWith(42);
  });

  it('calls onTogglePriority with action id when star button is clicked', async () => {
    const onTogglePriority = vi.fn();
    render(
      <ActionItem
        action={makeAction({ id: 7 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={onTogglePriority}
        onDelete={vi.fn()}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /priority/i }));
    expect(onTogglePriority).toHaveBeenCalledWith(7);
  });

  it('disables priority button when cap reached and item is not priority', () => {
    render(
      <ActionItem
        action={makeAction({ is_top_priority: 0 })}
        priorityCapReached={true}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /priority/i })).toBeDisabled();
  });

  it('enables priority button when cap reached but item is already priority', () => {
    render(
      <ActionItem
        action={makeAction({ is_top_priority: 1 })}
        priorityCapReached={true}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: /priority/i })).not.toBeDisabled();
  });

  it('calls onDelete with action id when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(
      <ActionItem
        action={makeAction({ id: 99 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={onDelete}
      />
    );
    await userEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledWith(99);
  });

  it('shows visual distinction for priority items', () => {
    render(
      <ActionItem
        action={makeAction({ is_top_priority: 1 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const title = screen.getByText('Test action');
    expect(title.className).toMatch(/font-semibold/);
  });

  it('uses custom-checkbox class on the checkbox input', () => {
    render(
      <ActionItem
        action={makeAction()}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox.className).toMatch(/custom-checkbox/);
  });

  it('applies text-on-surface-faint class when action is completed', () => {
    render(
      <ActionItem
        action={makeAction({ is_completed: 1 })}
        priorityCapReached={false}
        onToggleComplete={vi.fn()}
        onTogglePriority={vi.fn()}
        onDelete={vi.fn()}
      />
    );
    const title = screen.getByText('Test action');
    expect(title.className).toMatch(/text-on-surface-faint/);
  });
});
