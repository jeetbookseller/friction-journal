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
