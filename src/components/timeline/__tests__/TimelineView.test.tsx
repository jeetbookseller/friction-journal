import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TimelineView } from '../TimelineView';
import * as useTimelineModule from '../../../hooks/useTimeline';
import type { TimelineEvent } from '../../../db/models';

vi.mock('../../AuthProvider', () => ({
  useAuthContext: () => ({
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

vi.mock('../../../hooks/useTimeline');

function mockReturn(events: Map<string, TimelineEvent> = new Map()) {
  return { events, upsertEvent: vi.fn() };
}

beforeEach(() => {
  vi.mocked(useTimelineModule.useTimelineForMonth).mockReturnValue(mockReturn());
});

describe('TimelineView', () => {
  it('renders month/year header for the initial month', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    expect(screen.getByText('March 2026')).toBeInTheDocument();
  });

  it('renders previous and next navigation buttons', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('renders one row per day of the month (31 for March)', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    const dayRows = screen.getAllByTestId(/^day-/);
    expect(dayRows).toHaveLength(31);
  });

  it('renders 28 rows for February 2026', () => {
    render(<TimelineView initialYear={2026} initialMonth={2} />);
    const dayRows = screen.getAllByTestId(/^day-/);
    expect(dayRows).toHaveLength(28);
  });

  it('navigates to next month when next button clicked', async () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('April 2026')).toBeInTheDocument();
  });

  it('navigates to previous month when previous button clicked', async () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText('February 2026')).toBeInTheDocument();
  });

  it('wraps to January of next year when navigating forward from December', async () => {
    render(<TimelineView initialYear={2026} initialMonth={12} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByText('January 2027')).toBeInTheDocument();
  });

  it('wraps to December of previous year when navigating back from January', async () => {
    render(<TimelineView initialYear={2026} initialMonth={1} />);
    await userEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByText('December 2025')).toBeInTheDocument();
  });

  it('calls useTimelineForMonth with the initial year and month', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    expect(useTimelineModule.useTimelineForMonth).toHaveBeenCalledWith(2026, 3, 'test-user-id');
  });

  it('calls useTimelineForMonth with updated month after navigation', async () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    await userEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(useTimelineModule.useTimelineForMonth).toHaveBeenCalledWith(2026, 4, 'test-user-id');
  });

  it('root element has animate-fade-in class', () => {
    const { container } = render(<TimelineView initialYear={2026} initialMonth={3} />);
    expect(container.firstChild).toHaveClass('animate-fade-in');
  });

  it('prev button contains an SVG icon', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    const prev = screen.getByRole('button', { name: /previous/i });
    expect(prev.querySelector('svg')).not.toBeNull();
  });

  it('next button contains an SVG icon', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    const next = screen.getByRole('button', { name: /next/i });
    expect(next.querySelector('svg')).not.toBeNull();
  });

  it('header has sticky and border-b classes', () => {
    render(<TimelineView initialYear={2026} initialMonth={3} />);
    const header = screen.getByText('March 2026').closest('div');
    expect(header).toHaveClass('sticky');
    expect(header).toHaveClass('border-b');
  });

  it('passes matching event from Map to the correct day row', () => {
    const events = new Map<string, TimelineEvent>();
    events.set('2026-03-15', {
      id: 1,
      uuid: 'test-uuid',
      date: '2026-03-15',
      note: 'Rainy Sunday',
      created_at: Date.now(),
      updated_at: Date.now(),
      deleted_at: null,
    });
    vi.mocked(useTimelineModule.useTimelineForMonth).mockReturnValue(mockReturn(events));

    render(<TimelineView initialYear={2026} initialMonth={3} />);
    expect(screen.getByText('Rainy Sunday')).toBeInTheDocument();
  });
});
