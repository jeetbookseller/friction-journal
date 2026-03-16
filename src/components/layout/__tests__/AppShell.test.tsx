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

  it('renders header with "Friction Journal" text', () => {
    renderWithRouter();
    expect(screen.getByText('Friction Journal')).toBeInTheDocument();
  });

  it('header has border-b class', () => {
    renderWithRouter();
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('border-b');
  });

  it('header has bg-surface class', () => {
    renderWithRouter();
    const header = screen.getByRole('banner');
    expect(header).toHaveClass('bg-surface');
  });

  it('nav has bg-nav-bg class', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation')).toHaveClass('bg-nav-bg');
  });

  it('nav has shadow-nav class', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation')).toHaveClass('shadow-nav');
  });

  it('nav has border-t class', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation')).toHaveClass('border-t');
  });

  it('nav has border-border class', () => {
    renderWithRouter();
    expect(screen.getByRole('navigation')).toHaveClass('border-border');
  });

  it('each tab link contains an svg icon with aria-hidden', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('each tab link stacks icon and label vertically', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('flex-col');
      expect(link).toHaveClass('items-center');
    });
  });

  it('active tab shows a dot indicator', () => {
    renderWithRouter('/');
    expect(screen.getByTestId('nav-dot')).toBeInTheDocument();
  });

  it('active tab dot has bg-nav-active class', () => {
    renderWithRouter('/');
    const dot = screen.getByTestId('nav-dot');
    expect(dot).toHaveClass('bg-nav-active');
  });

  it('inactive tabs do not show a dot indicator', () => {
    renderWithRouter('/');
    expect(screen.getAllByTestId('nav-dot')).toHaveLength(1);
  });

  it('links have transition-colors class', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('transition-colors');
    });
  });
});
