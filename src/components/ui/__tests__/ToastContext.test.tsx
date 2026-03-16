import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider, useToast } from '../ToastContext';

function TriggerToast({ message }: { message: string }) {
  const { showToast } = useToast();
  return <button onClick={() => showToast(message)}>Show</button>;
}

describe('ToastContext', () => {
  it('useToast throws when used outside ToastProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TriggerToast message="hi" />)).toThrow();
    consoleError.mockRestore();
  });

  it('ToastProvider renders children', () => {
    render(
      <ToastProvider>
        <div>Child content</div>
      </ToastProvider>
    );
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });

  it('showToast displays the message in the DOM', async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <TriggerToast message="Action saved!" />
      </ToastProvider>
    );
    await user.click(screen.getByRole('button', { name: 'Show' }));
    expect(screen.getByText('Action saved!')).toBeInTheDocument();
  });

  it('toast disappears after 3 seconds', () => {
    vi.useFakeTimers();
    try {
      render(
        <ToastProvider>
          <TriggerToast message="Bye soon" />
        </ToastProvider>
      );
      act(() => {
        fireEvent.click(screen.getByRole('button', { name: 'Show' }));
      });
      expect(screen.getByText('Bye soon')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(screen.queryByText('Bye soon')).not.toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it('calling showToast twice shows both messages', async () => {
    const user = userEvent.setup();
    function TwoToasts() {
      const { showToast } = useToast();
      return (
        <>
          <button onClick={() => showToast('First toast')}>First</button>
          <button onClick={() => showToast('Second toast')}>Second</button>
        </>
      );
    }
    render(
      <ToastProvider>
        <TwoToasts />
      </ToastProvider>
    );
    await user.click(screen.getByRole('button', { name: 'First' }));
    await user.click(screen.getByRole('button', { name: 'Second' }));
    expect(screen.getByText('First toast')).toBeInTheDocument();
    expect(screen.getByText('Second toast')).toBeInTheDocument();
  });
});
