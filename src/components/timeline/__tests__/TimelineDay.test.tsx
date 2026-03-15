import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineDay } from '../TimelineDay';
import type { TimelineEvent } from '../../../db/models';

function makeEvent(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return {
    id: 1,
    uuid: 'test-uuid',
    date: '2026-03-15',
    note: 'Test note',
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    ...overrides,
  };
}

describe('TimelineDay', () => {
  it('renders date label with day number and abbreviated day name', () => {
    render(
      <TimelineDay
        date="2026-03-15"
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    // March 15, 2026 is a Sunday
    expect(screen.getByText('15 Sun')).toBeInTheDocument();
  });

  it('renders correct day name for another date', () => {
    render(
      <TimelineDay
        date="2026-03-01"
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    // March 1, 2026 is a Sunday
    expect(screen.getByText('1 Sun')).toBeInTheDocument();
  });

  it('shows a single-line input when no event exists', () => {
    render(
      <TimelineDay
        date="2026-03-15"
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('shows note text in read mode when event exists', () => {
    render(
      <TimelineDay
        date="2026-03-15"
        event={makeEvent({ note: 'Went for a walk' })}
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    expect(screen.getByText('Went for a walk')).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('switches to edit mode when note text is clicked', async () => {
    render(
      <TimelineDay
        date="2026-03-15"
        event={makeEvent({ note: 'Click me' })}
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    await userEvent.click(screen.getByText('Click me'));
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('Click me');
  });

  it('calls onUpsert with date and value on blur when input has content', async () => {
    const onUpsert = vi.fn();
    render(
      <TimelineDay
        date="2026-03-15"
        isToday={false}
        onUpsert={onUpsert}
      />
    );
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'New note');
    await userEvent.tab(); // trigger blur
    expect(onUpsert).toHaveBeenCalledWith('2026-03-15', 'New note');
  });

  it('does not call onUpsert when input is empty on blur', async () => {
    const onUpsert = vi.fn();
    render(
      <TimelineDay
        date="2026-03-15"
        isToday={false}
        onUpsert={onUpsert}
      />
    );
    const input = screen.getByRole('textbox');
    await userEvent.click(input);
    await userEvent.tab(); // blur with empty input
    expect(onUpsert).not.toHaveBeenCalled();
  });

  it('does not call onUpsert when input is whitespace only on blur', async () => {
    const onUpsert = vi.fn();
    render(
      <TimelineDay
        date="2026-03-15"
        isToday={false}
        onUpsert={onUpsert}
      />
    );
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '   ');
    await userEvent.tab();
    expect(onUpsert).not.toHaveBeenCalled();
  });

  it('calls onUpsert and exits edit mode on Enter key', async () => {
    const onUpsert = vi.fn();
    render(
      <TimelineDay
        date="2026-03-15"
        event={makeEvent({ note: 'Old note' })}
        isToday={false}
        onUpsert={onUpsert}
      />
    );
    await userEvent.click(screen.getByText('Old note'));
    const input = screen.getByRole('textbox');
    await userEvent.clear(input);
    await userEvent.type(input, 'New note{Enter}');
    expect(onUpsert).toHaveBeenCalledWith('2026-03-15', 'New note');
    // After enter, should return to read mode — note text visible
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('applies a distinct CSS class to today\'s row', () => {
    const { container } = render(
      <TimelineDay
        date="2026-03-15"
        isToday={true}
        onUpsert={vi.fn()}
      />
    );
    // Today's row should have a highlight class (ring or border accent)
    expect(container.firstChild).toHaveClass('today');
  });

  it('does not apply today class to non-today rows', () => {
    const { container } = render(
      <TimelineDay
        date="2026-03-14"
        isToday={false}
        onUpsert={vi.fn()}
      />
    );
    expect(container.firstChild).not.toHaveClass('today');
  });
});
