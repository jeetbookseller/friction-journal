import { useState } from 'react';
import { MAX_ACTIVE_HABITS } from '../../lib/constants';

interface AddHabitFormProps {
  onAdd: (name: string) => Promise<void>;
  capReached: boolean;
}

export function AddHabitForm({ onAdd, capReached }: AddHabitFormProps) {
  const [value, setValue] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    await onAdd(trimmed);
    setValue('');
  }

  return (
    <form onSubmit={handleSubmit} className="p-3 flex flex-col gap-2">
      {capReached && (
        <p className="text-sm bg-warning-subtle text-warning rounded-lg px-3 py-2">
          All {MAX_ACTIVE_HABITS} habit slots are used. Deactivate one to add another.
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New habit name…"
          className="flex-1 bg-surface-raised text-sm text-on-surface rounded-lg px-3 py-2 placeholder:text-on-surface-faint border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <button
          type="submit"
          disabled={capReached}
          aria-label="Add Habit"
          className="px-3 py-2 text-sm bg-accent text-on-accent rounded-lg hover:bg-accent-hover active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Add Habit
        </button>
      </div>
    </form>
  );
}
