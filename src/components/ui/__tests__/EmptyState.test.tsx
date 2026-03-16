import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the icon prop', () => {
    render(
      <EmptyState
        icon={<svg data-testid="test-icon" />}
        title="No items"
        description="Add one to get started"
      />
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('renders the title prop text', () => {
    render(
      <EmptyState icon={<span />} title="No actions yet" description="desc" />
    );
    expect(screen.getByText('No actions yet')).toBeInTheDocument();
  });

  it('renders the description prop text', () => {
    render(
      <EmptyState icon={<span />} title="Title" description="Add something to begin" />
    );
    expect(screen.getByText('Add something to begin')).toBeInTheDocument();
  });

  it('root element has animate-fade-in class', () => {
    const { container } = render(
      <EmptyState icon={<span />} title="T" description="D" />
    );
    expect(container.firstChild).toHaveClass('animate-fade-in');
  });
});
