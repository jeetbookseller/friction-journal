import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../AppShell';

function renderWithRouter(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell />
    </MemoryRouter>
  );
}

describe('AppShell', () => {
  it('renders bottom nav with 4 tabs', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('renders Actions tab linking to /', () => {
    renderWithRouter();
    const actionsLink = screen.getByRole('link', { name: /actions/i });
    expect(actionsLink).toHaveAttribute('href', '/');
  });

  it('renders Timeline tab linking to /timeline', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /timeline/i });
    expect(link).toHaveAttribute('href', '/timeline');
  });

  it('renders Habits tab linking to /habits', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /habits/i });
    expect(link).toHaveAttribute('href', '/habits');
  });

  it('renders Log tab linking to /log', () => {
    renderWithRouter();
    const link = screen.getByRole('link', { name: /log/i });
    expect(link).toHaveAttribute('href', '/log');
  });
});
