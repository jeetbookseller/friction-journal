import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal open={false} title="Hidden" onClose={vi.fn()}>
        <p>Content</p>
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders a dialog with title and children when open', () => {
    render(
      <Modal open title="My Dialog" onClose={vi.fn()}>
        <p>Dialog content</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog', { name: 'My Dialog' })).toBeInTheDocument();
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Escapable" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Backdrop" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    await userEvent.click(screen.getByTestId('modal-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the panel', async () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Inside" onClose={onClose}>
        <p>Content</p>
      </Modal>,
    );
    await userEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
