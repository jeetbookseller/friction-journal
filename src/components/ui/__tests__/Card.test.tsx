import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Hello</Card>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('has class bg-surface-raised', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass('bg-surface-raised');
  });

  it('has class rounded-xl', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass('rounded-xl');
  });

  it('has class shadow-card', () => {
    const { container } = render(<Card>x</Card>);
    expect(container.firstChild).toHaveClass('shadow-card');
  });

  it('merges additional className prop', () => {
    const { container } = render(<Card className="mb-3 mx-4">x</Card>);
    expect(container.firstChild).toHaveClass('mb-3');
    expect(container.firstChild).toHaveClass('mx-4');
  });
});
