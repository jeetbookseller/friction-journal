import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

vi.mock('./components/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuthContext: () => ({
    session: { user: { id: 'test-user-id' } },
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('contains all 4 tab labels', () => {
    render(<App />);
    expect(screen.getAllByRole('link', { name: /actions/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /timeline/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /habits/i }).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByRole('link', { name: /log/i }).length).toBeGreaterThanOrEqual(1);
  });

  it('mounts ToastProvider (aria-live region present)', () => {
    render(<App />);
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });
});
