import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddHabitForm } from '../AddHabitForm';

describe('AddHabitForm', () => {
  it('renders a text input and submit button', () => {
    render(<AddHabitForm onAdd={vi.fn()} capReached={false} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add habit/i })).toBeInTheDocument();
  });

  it('calls onAdd with trimmed input value on submit', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddHabitForm onAdd={onAdd} capReached={false} />);
    await userEvent.type(screen.getByRole('textbox'), '  Morning Run  ');
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));
    expect(onAdd).toHaveBeenCalledWith('Morning Run');
  });

  it('clears input after submission', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddHabitForm onAdd={onAdd} capReached={false} />);
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Morning Run');
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));
    expect(input).toHaveValue('');
  });

  it('does not call onAdd when input is empty', async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    render(<AddHabitForm onAdd={onAdd} capReached={false} />);
    await userEvent.click(screen.getByRole('button', { name: /add habit/i }));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('button is disabled when capReached is true', () => {
    render(<AddHabitForm onAdd={vi.fn()} capReached={true} />);
    expect(screen.getByRole('button', { name: /add habit/i })).toBeDisabled();
  });

  it('shows hint text when capReached is true', () => {
    render(<AddHabitForm onAdd={vi.fn()} capReached={true} />);
    expect(screen.getByText(/3 habit slots/i)).toBeInTheDocument();
  });
});
