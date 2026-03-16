import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-surface-raised rounded-xl shadow-card ${className}`}>
      {children}
    </div>
  );
}
