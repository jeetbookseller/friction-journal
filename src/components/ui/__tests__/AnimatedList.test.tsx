import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedList } from '../AnimatedList';

describe('AnimatedList', () => {
  it('renders all children', () => {
    render(
      <AnimatedList>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </AnimatedList>
    );
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('first child gets animation-delay of 0ms', () => {
    render(
      <AnimatedList>
        <div>First</div>
        <div>Second</div>
      </AnimatedList>
    );
    const first = screen.getByText('First');
    expect(first.style.animationDelay).toBe('0ms');
  });

  it('second child gets animation-delay of 50ms', () => {
    render(
      <AnimatedList>
        <div>First</div>
        <div>Second</div>
      </AnimatedList>
    );
    const second = screen.getByText('Second');
    expect(second.style.animationDelay).toBe('50ms');
  });

  it('third child gets animation-delay of 100ms', () => {
    render(
      <AnimatedList>
        <div>First</div>
        <div>Second</div>
        <div>Third</div>
      </AnimatedList>
    );
    const third = screen.getByText('Third');
    expect(third.style.animationDelay).toBe('100ms');
  });
});
