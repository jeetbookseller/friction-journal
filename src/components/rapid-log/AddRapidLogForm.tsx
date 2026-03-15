import { useState } from 'react';
import type { RapidLog } from '../../db/models';

const TAGS: { value: RapidLog['tag']; label: string }[] = [
  { value: 'note',  label: 'Note' },
  { value: 'event', label: 'Event' },
  { value: 'mood',  label: 'Mood' },
];

interface AddRapidLogFormProps {
  onAdd: (tag: RapidLog['tag'], body: string) => void;
}

export function AddRapidLogForm({ onAdd }: AddRapidLogFormProps) {
  const [tag, setTag] = useState<RapidLog['tag']>('note');
  const [body, setBody] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    onAdd(tag, trimmed);
    setBody('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 border-t border-gray-700">
      <div className="flex gap-2">
        {TAGS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tag === value}
            onClick={() => setTag(value)}
            className={[
              'rounded px-2.5 py-1 text-xs font-medium',
              tag === value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Log something..."
          maxLength={280}
          className="flex-1 rounded border border-gray-600 bg-gray-800 px-3 py-1.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="rounded bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Add
        </button>
      </div>
    </form>
  );
}
