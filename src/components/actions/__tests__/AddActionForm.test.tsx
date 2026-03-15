import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddActionForm } from '../AddActionForm';

describe('AddActionForm', () => {
  it('renders a text input and submit button', () => {
    render(<AddActionForm onAdd={vi.fn()} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
  });

  it('calls onAdd with the trimmed title on submit', async () => {
    const onAdd = vi.fn();
    render(<AddActionForm onAdd={onAdd} />);
    await userEvent.type(screen.getByRole('textbox'), '  Buy milk  ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).toHaveBeenCalledWith('Buy milk');
  });

  it('clears the input after successful submission', async () => {
    render(<AddActionForm onAdd={vi.fn()} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Some task');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(input).toHaveValue('');
  });

  it('does not call onAdd when input is empty', async () => {
    const onAdd = vi.fn();
    render(<AddActionForm onAdd={onAdd} />);
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('does not call onAdd when input is only whitespace', async () => {
    const onAdd = vi.fn();
    render(<AddActionForm onAdd={onAdd} />);
    await userEvent.type(screen.getByRole('textbox'), '   ');
    await userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('submits on Enter key press', async () => {
    const onAdd = vi.fn();
    render(<AddActionForm onAdd={onAdd} />);
    await userEvent.type(screen.getByRole('textbox'), 'Task via enter{Enter}');
    expect(onAdd).toHaveBeenCalledWith('Task via enter');
  });
});
