import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RapidLog } from '../../../db/models';

// Mock the hook so RapidLogFeed tests don't need IndexedDB
const mockAddRapidLog = vi.fn();
const mockDeleteRapidLog = vi.fn();
let mockLogs: RapidLog[] = [];

vi.mock('../../../hooks/useRapidLogs', () => ({
  useRapidLogs: (filter?: RapidLog['tag']) => ({
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
    tag: 'note',
    body: 'Test log entry',
    created_at: Date.now(),
    updated_at: Date.now(),
    deleted_at: null,
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

  it('shows empty state when no logs exist', () => {
    render(<RapidLogFeed />);
    expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
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
