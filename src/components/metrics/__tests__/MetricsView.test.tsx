import 'fake-indexeddb/auto';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { MetricsView } from '../MetricsView';

const mockShowToast = vi.fn();
vi.mock('../../ui/ToastContext', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

function renderView() {
  return render(
    <MemoryRouter initialEntries={['/metrics']}>
      <MetricsView />
    </MemoryRouter>,
  );
}

describe('MetricsView', () => {
  it('renders the title, back link, and action buttons', () => {
    renderView();
    expect(screen.getByRole('heading', { name: 'Metrics' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to journal/i })).toHaveAttribute('href', '/');
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset data/i })).toBeInTheDocument();
  });

  it('week mode shows 7 day rows starting on a Sunday', async () => {
    renderView();
    const rows = await screen.findAllByRole('row');
    // 1 header row + 7 day rows
    expect(rows).toHaveLength(8);
    expect(within(rows[1]).getByText(/^Su /)).toBeInTheDocument();
  });

  it('month toggle switches to a full-month table', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /^month$/i }));
    const rows = await screen.findAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(29); // header + 28..31 days
  });

  it('previous period changes the label; next returns to current', async () => {
    renderView();
    await screen.findAllByRole('row');
    const label = () => screen.getByText(/–/).textContent;
    const before = label();
    await userEvent.click(screen.getByRole('button', { name: /previous period/i }));
    expect(label()).not.toBe(before);
    await userEvent.click(screen.getByRole('button', { name: /next period/i }));
    expect(label()).toBe(before);
  });

  it('next is disabled on the current period', () => {
    renderView();
    expect(screen.getByRole('button', { name: /next period/i })).toBeDisabled();
  });

  it('export button opens the range dialog', async () => {
    renderView();
    await userEvent.click(screen.getByRole('button', { name: /export csv/i }));
    expect(screen.getByRole('dialog', { name: /export csv/i })).toBeInTheDocument();
  });

  describe('reset dialog', () => {
    it('delete button is disabled until DELETE is typed', async () => {
      renderView();
      await userEvent.click(screen.getByRole('button', { name: /reset data/i }));
      const deleteBtn = screen.getByRole('button', { name: /delete everything/i });
      expect(deleteBtn).toBeDisabled();

      await userEvent.type(screen.getByLabelText(/type delete to confirm/i), 'DELETE');
      expect(deleteBtn).toBeEnabled();
    });

    it('offers an export-first option', async () => {
      renderView();
      await userEvent.click(screen.getByRole('button', { name: /reset data/i }));
      expect(screen.getByRole('button', { name: /export to csv first/i })).toBeInTheDocument();
    });
  });
});
