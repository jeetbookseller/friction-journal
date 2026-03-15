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
        <p className="text-xs text-amber-400">
          All {MAX_ACTIVE_HABITS} habit slots are used. Deactivate one to add another.
        </p>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="New habit name…"
          className="flex-1 bg-gray-800 text-sm text-white rounded px-3 py-2 placeholder-gray-500 border border-gray-600 focus:outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={capReached}
          aria-label="Add Habit"
          className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed rounded"
        >
          Add Habit
        </button>
      </div>
    </form>
  );
}
