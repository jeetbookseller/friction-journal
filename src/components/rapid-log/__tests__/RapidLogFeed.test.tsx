import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RapidLog } from '../../../db/models';

vi.mock('../../AuthProvider', () => ({
  useAuthContext: () => ({
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

// Mock the hook so RapidLogFeed tests don't need IndexedDB
const mockAddRapidLog = vi.fn();
const mockDeleteRapidLog = vi.fn();
let mockLogs: RapidLog[] = [];

vi.mock('../../../hooks/useRapidLogs', () => ({
  useRapidLogs: (_userId: string, filter?: RapidLog['tag']) => ({
    logs: filter ? mockLogs.filter((l) => l.tag === filter) : mockLogs,
    addRapidLog: mockAddRapidLog,
    deleteRapidLog: mockDeleteRapidLog,
  }),
}));

// Import after mock
import { RapidLogFeed } from '../RapidLogFeed';

function makeRapidLog(overrides: Partial<RapidLog> = {}): RapidLog {
  return {
    id: 1,
    uuid: 'test-uuid',
    user_id: 'test-user-id',
    tag: 'note',
    body: 'Test log entry',
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
    sent_to_ph: 0,
    sent_to_ph_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  mockLogs = [];
  mockAddRapidLog.mockReset();
  mockDeleteRapidLog.mockReset();
});

describe('RapidLogFeed', () => {
  function getFilterToolbar() {
    return screen.getByRole('toolbar', { name: /filter logs/i });
  }

  it('renders 4 filter chips: All, Note, Event, Mood', () => {
    render(<RapidLogFeed />);
    const toolbar = getFilterToolbar();
    expect(within(toolbar).getByRole('button', { name: /^All$/i })).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: /^Note$/i })).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: /^Event$/i })).toBeInTheDocument();
    expect(within(toolbar).getByRole('button', { name: /^Mood$/i })).toBeInTheDocument();
  });

  it('"All" chip is active by default', () => {
    render(<RapidLogFeed />);
    expect(within(getFilterToolbar()).getByRole('button', { name: /^All$/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('active filter chip has bg-accent and text-on-accent and rounded-full classes', () => {
    render(<RapidLogFeed />);
    const allChip = within(getFilterToolbar()).getByRole('button', { name: /^All$/i });
    expect(allChip.className).toMatch(/bg-accent/);
    expect(allChip.className).toMatch(/text-on-accent/);
    expect(allChip.className).toMatch(/rounded-full/);
  });

  it('inactive filter chip has bg-surface-overlay and text-on-surface-muted and rounded-full classes', () => {
    render(<RapidLogFeed />);
    const noteChip = within(getFilterToolbar()).getByRole('button', { name: /^Note$/i });
    expect(noteChip.className).toMatch(/bg-surface-overlay/);
    expect(noteChip.className).toMatch(/text-on-surface-muted/);
    expect(noteChip.className).toMatch(/rounded-full/);
  });

  it('root element has animate-fade-in class', () => {
    const { container } = render(<RapidLogFeed />);
    expect(container.firstChild).toHaveClass('animate-fade-in');
  });

  it('filter header has sticky and border-b and border-border and bg-surface classes', () => {
    render(<RapidLogFeed />);
    const toolbar = getFilterToolbar();
    expect(toolbar.className).toMatch(/sticky/);
    expect(toolbar.className).toMatch(/border-b/);
    expect(toolbar.className).toMatch(/border-border/);
    expect(toolbar.className).toMatch(/bg-surface/);
  });

  it('shows empty state with "No log entries yet" when no logs exist', () => {
    render(<RapidLogFeed />);
    expect(screen.getByText(/no log entries yet/i)).toBeInTheDocument();
  });

  it('renders log entries when logs exist', () => {
    mockLogs = [
      makeRapidLog({ id: 1, body: 'First entry', tag: 'note' }),
      makeRapidLog({ id: 2, body: 'Second entry', tag: 'event' }),
    ];
    render(<RapidLogFeed />);
    expect(screen.getByText('First entry')).toBeInTheDocument();
    expect(screen.getByText('Second entry')).toBeInTheDocument();
  });

  it('log entries have staggered animation-delay via AnimatedList', () => {
    mockLogs = [
      makeRapidLog({ id: 1, body: 'First entry', tag: 'note' }),
      makeRapidLog({ id: 2, body: 'Second entry', tag: 'event' }),
    ];
    render(<RapidLogFeed />);
    const items = screen.getAllByRole('listitem');
    // AnimatedList clones children with incrementing animation-delay
    expect(items[0]).toHaveStyle({ animationDelay: '0ms' });
    expect(items[1]).toHaveStyle({ animationDelay: '50ms' });
  });

  it('clicking a tag chip makes it active', async () => {
    render(<RapidLogFeed />);
    const toolbar = getFilterToolbar();
    const noteChip = within(toolbar).getByRole('button', { name: /^Note$/i });
    await userEvent.click(noteChip);
    expect(noteChip).toHaveAttribute('aria-pressed', 'true');
    expect(within(toolbar).getByRole('button', { name: /^All$/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking "All" chip after selecting a tag resets to all', async () => {
    render(<RapidLogFeed />);
    const toolbar = getFilterToolbar();
    await userEvent.click(within(toolbar).getByRole('button', { name: /^Event$/i }));
    await userEvent.click(within(toolbar).getByRole('button', { name: /^All$/i }));
    expect(within(toolbar).getByRole('button', { name: /^All$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(within(toolbar).getByRole('button', { name: /^Event$/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('renders AddRapidLogForm at the bottom', () => {
    render(<RapidLogFeed />);
    // The form has a text input
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls addRapidLog when form is submitted', async () => {
    render(<RapidLogFeed />);
    await userEvent.type(screen.getByRole('textbox'), 'New log entry');
    await userEvent.click(screen.getByRole('button', { name: /^Add$/i }));
    expect(mockAddRapidLog).toHaveBeenCalledWith('note', 'New log entry');
  });

  it('calls deleteRapidLog when entry delete button is clicked', async () => {
    mockLogs = [makeRapidLog({ id: 99, body: 'Entry to delete' })];
    render(<RapidLogFeed />);
    await userEvent.click(screen.getByRole('button', { name: /delete log entry/i }));
    expect(mockDeleteRapidLog).toHaveBeenCalledWith(99);
  });
});
