import { useState } from 'react';

interface AddActionFormProps {
  onAdd: (title: string) => void;
}

export function AddActionForm({ onAdd }: AddActionFormProps) {
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setTitle('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Add action..."
        className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
      />
      <button
        type="submit"
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-on-accent hover:bg-accent-hover active:scale-95 transition-colors"
      >
        Add
      </button>
    </form>
  );
}
