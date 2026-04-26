import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from '../AppShell';

vi.mock('../../AuthProvider', () => ({
  useAuthContext: () => ({ signOut: vi.fn() }),
}));

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
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    expect(mobileNav).toBeInTheDocument();
    expect(within(mobileNav).getAllByRole('link')).toHaveLength(4);
  });

  it('renders Actions tab linking to /', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link', { name: /actions/i });
    expect(links[0]).toHaveAttribute('href', '/');
  });

  it('renders Timeline tab linking to /timeline', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link', { name: /timeline/i });
    expect(links[0]).toHaveAttribute('href', '/timeline');
  });

  it('renders Habits tab linking to /habits', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link', { name: /habits/i });
    expect(links[0]).toHaveAttribute('href', '/habits');
  });

  it('renders Log tab linking to /log', () => {
    renderWithRouter();
    const links = screen.getAllByRole('link', { name: /log/i });
    expect(links[0]).toHaveAttribute('href', '/log');
  });

  it('renders header with "Personal Journal" text', () => {
    renderWithRouter();
    const instances = screen.getAllByText('Personal Journal');
    expect(instances.length).toBeGreaterThanOrEqual(1);
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
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    expect(mobileNav).toHaveClass('bg-nav-bg');
  });

  it('nav has shadow-nav class', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    expect(mobileNav).toHaveClass('shadow-nav');
  });

  it('nav has border-t class', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    expect(mobileNav).toHaveClass('border-t');
  });

  it('nav has border-border class', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    expect(mobileNav).toHaveClass('border-border');
  });

  it('each tab link in mobile nav contains an svg icon with aria-hidden', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    const links = within(mobileNav).getAllByRole('link');
    links.forEach((link) => {
      const svg = link.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('each tab link in mobile nav stacks icon and label vertically', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    const links = within(mobileNav).getAllByRole('link');
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

  it('mobile nav links have transition-colors class', () => {
    renderWithRouter();
    const mobileNav = screen.getByRole('navigation', { name: 'Tab navigation' });
    const links = within(mobileNav).getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('transition-colors');
    });
  });

  it('sidebar navigation is rendered with 4 links', () => {
    renderWithRouter();
    const sidebarNav = screen.getByRole('navigation', { name: 'Sidebar navigation' });
    expect(sidebarNav).toBeInTheDocument();
    expect(within(sidebarNav).getAllByRole('link')).toHaveLength(4);
  });

  it('sidebar nav links display icon and label side by side', () => {
    renderWithRouter();
    const sidebarNav = screen.getByRole('navigation', { name: 'Sidebar navigation' });
    const links = within(sidebarNav).getAllByRole('link');
    links.forEach((link) => {
      expect(link).toHaveClass('flex');
      expect(link).toHaveClass('items-center');
      expect(link).toHaveClass('gap-3');
    });
  });
});
