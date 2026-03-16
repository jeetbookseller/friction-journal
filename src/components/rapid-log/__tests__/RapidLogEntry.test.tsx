import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RapidLogEntry } from '../RapidLogEntry';
import type { RapidLog } from '../../../db/models';

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

describe('RapidLogEntry', () => {
  it('renders the body text', () => {
    render(<RapidLogEntry entry={makeRapidLog({ body: 'My log body' })} onDelete={vi.fn()} />);
    expect(screen.getByText('My log body')).toBeInTheDocument();
  });

  it('renders tag pill with label "Note" for note tag', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'note' })} onDelete={vi.fn()} />);
    expect(screen.getByText('Note')).toBeInTheDocument();
  });

  it('renders tag pill with label "Event" for event tag', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'event' })} onDelete={vi.fn()} />);
    expect(screen.getByText('Event')).toBeInTheDocument();
  });

  it('renders tag pill with label "Mood" for mood tag', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'mood' })} onDelete={vi.fn()} />);
    expect(screen.getByText('Mood')).toBeInTheDocument();
  });

  it('note tag pill uses bg-tag-note-subtle and text-tag-note token classes', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'note' })} onDelete={vi.fn()} />);
    const pill = screen.getByText('Note');
    expect(pill.className).toMatch(/bg-tag-note-subtle/);
    expect(pill.className).toMatch(/text-tag-note/);
  });

  it('event tag pill uses bg-tag-event-subtle and text-tag-event token classes', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'event' })} onDelete={vi.fn()} />);
    const pill = screen.getByText('Event');
    expect(pill.className).toMatch(/bg-tag-event-subtle/);
    expect(pill.className).toMatch(/text-tag-event/);
  });

  it('mood tag pill uses bg-tag-mood-subtle and text-tag-mood token classes', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'mood' })} onDelete={vi.fn()} />);
    const pill = screen.getByText('Mood');
    expect(pill.className).toMatch(/bg-tag-mood-subtle/);
    expect(pill.className).toMatch(/text-tag-mood/);
  });

  it('tag pill is rounded-full', () => {
    render(<RapidLogEntry entry={makeRapidLog({ tag: 'note' })} onDelete={vi.fn()} />);
    const pill = screen.getByText('Note');
    expect(pill.className).toMatch(/rounded-full/);
  });

  it('renders a non-empty relative timestamp', () => {
    render(<RapidLogEntry entry={makeRapidLog()} onDelete={vi.fn()} />);
    // The timestamp element should have some text (e.g. "less than a minute ago")
    const timestamp = screen.getByTestId('relative-timestamp');
    expect(timestamp.textContent).toBeTruthy();
  });

  it('delete button contains an SVG icon', () => {
    render(<RapidLogEntry entry={makeRapidLog()} onDelete={vi.fn()} />);
    const deleteBtn = screen.getByRole('button', { name: /delete log entry/i });
    expect(deleteBtn.querySelector('svg')).toBeInTheDocument();
  });

  it('calls onDelete with entry id when delete button is clicked', async () => {
    const onDelete = vi.fn();
    render(<RapidLogEntry entry={makeRapidLog({ id: 42 })} onDelete={onDelete} />);
    await userEvent.click(screen.getByRole('button', { name: /delete log entry/i }));
    expect(onDelete).toHaveBeenCalledWith(42);
  });
});
