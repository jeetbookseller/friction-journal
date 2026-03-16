import React from 'react';

interface AnimatedListProps {
  children: React.ReactNode;
}

export function AnimatedList({ children }: AnimatedListProps) {
  return (
    <>
      {React.Children.map(children, (child, i) =>
        React.cloneElement(child as React.ReactElement<{ style?: React.CSSProperties }>, {
          style: { animationDelay: `${i * 50}ms` },
        })
      )}
    </>
  );
}
