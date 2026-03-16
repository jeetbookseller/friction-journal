import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('has animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('has rounded class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('rounded');
  });

  it('has bg-surface-overlay class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('bg-surface-overlay');
  });

  it('merges additional className prop', () => {
    const { container } = render(<Skeleton className="h-6 w-32" />);
    expect(container.firstChild).toHaveClass('h-6');
    expect(container.firstChild).toHaveClass('w-32');
  });
});
