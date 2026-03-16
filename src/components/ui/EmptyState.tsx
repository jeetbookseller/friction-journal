import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="animate-fade-in flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-on-surface-faint mb-4">{icon}</div>
      <p className="text-on-surface font-medium mb-1">{title}</p>
      <p className="text-on-surface-muted text-sm">{description}</p>
    </div>
  );
}
