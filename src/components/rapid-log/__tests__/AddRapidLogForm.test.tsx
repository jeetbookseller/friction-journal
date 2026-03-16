import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddRapidLogForm } from '../AddRapidLogForm';
import type { RapidLog } from '../../../db/models';

describe('AddRapidLogForm', () => {
  it('renders 3 tag buttons: Note, Event, Mood', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    expect(screen.getByRole('button', { name: /^Note$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Event$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Mood$/i })).toBeInTheDocument();
  });

  it('renders a text input and a submit button', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('"note" tag is selected by default', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const noteBtn = screen.getByRole('button', { name: /^Note$/i });
    expect(noteBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a tag button selects it', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const eventBtn = screen.getByRole('button', { name: /^Event$/i });
    await userEvent.click(eventBtn);
    expect(eventBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('only one tag is selected at a time', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^Event$/i }));
    expect(screen.getByRole('button', { name: /^Note$/i })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: /^Event$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^Mood$/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('active note tag button uses bg-tag-note class', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const noteBtn = screen.getByRole('button', { name: /^Note$/i });
    expect(noteBtn.className).toMatch(/bg-tag-note\b/);
  });

  it('active event tag button uses bg-tag-event class', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^Event$/i }));
    const eventBtn = screen.getByRole('button', { name: /^Event$/i });
    expect(eventBtn.className).toMatch(/bg-tag-event\b/);
  });

  it('active mood tag button uses bg-tag-mood class', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /^Mood$/i }));
    const moodBtn = screen.getByRole('button', { name: /^Mood$/i });
    expect(moodBtn.className).toMatch(/bg-tag-mood\b/);
  });

  it('inactive tag buttons use bg-surface-overlay class', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const eventBtn = screen.getByRole('button', { name: /^Event$/i });
    expect(eventBtn.className).toMatch(/bg-surface-overlay/);
  });

  it('tag buttons are rounded-full', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const noteBtn = screen.getByRole('button', { name: /^Note$/i });
    expect(noteBtn.className).toMatch(/rounded-full/);
  });

  it('submit button uses bg-accent and text-on-accent and rounded-lg classes', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const addBtn = screen.getByRole('button', { name: /^Add$/i });
    expect(addBtn.className).toMatch(/bg-accent\b/);
    expect(addBtn.className).toMatch(/text-on-accent/);
    expect(addBtn.className).toMatch(/rounded-lg/);
  });

  it('input uses bg-surface-raised and border-border and rounded-lg classes', () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const input = screen.getByRole('textbox');
    expect(input.className).toMatch(/bg-surface-raised/);
    expect(input.className).toMatch(/border-border/);
    expect(input.className).toMatch(/rounded-lg/);
  });

  it('calls onAdd with (tag, trimmedBody) on submit', async () => {
    const onAdd = vi.fn();
    render(<AddRapidLogForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /^Event$/i }));
    await userEvent.type(screen.getByRole('textbox'), '  Went for a walk  ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith('event' satisfies RapidLog['tag'], 'Went for a walk');
  });

  it('clears input after submission', async () => {
    render(<AddRapidLogForm onAdd={vi.fn()} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Some log');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(input).toHaveValue('');
  });

  it('does not call onAdd when body is empty', async () => {
    const onAdd = vi.fn();
    render(<AddRapidLogForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when body is only whitespace', async () => {
    const onAdd = vi.fn();
    render(<AddRapidLogForm onAdd={onAdd} />);
    await userEvent.type(screen.getByRole('textbox'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits on Enter key press', async () => {
    const onAdd = vi.fn();
    render(<AddRapidLogForm onAdd={onAdd} />);
    await userEvent.type(screen.getByRole('textbox'), 'Enter submit{Enter}');
    expect(onAdd).toHaveBeenCalledWith('note', 'Enter submit');
  });
});
