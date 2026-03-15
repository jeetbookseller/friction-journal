import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('contains all 4 tab labels', () => {
    render(<App />);
    expect(screen.getByRole('link', { name: /actions/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /timeline/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /habits/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /log/i })).toBeInTheDocument();
  });
});
