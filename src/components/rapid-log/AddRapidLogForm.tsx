import { useState } from 'react';
import type { RapidLog } from '../../db/models';

const TAGS: { value: RapidLog['tag']; label: string }[] = [
  { value: 'note',  label: 'Note' },
  { value: 'event', label: 'Event' },
  { value: 'mood',  label: 'Mood' },
];

const TAG_ACTIVE_STYLES: Record<RapidLog['tag'], string> = {
  note:  'bg-tag-note text-on-accent',
  event: 'bg-tag-event text-on-accent',
  mood:  'bg-tag-mood text-on-accent',
};

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 p-3 border-t border-border">
      <div className="flex gap-2">
        {TAGS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={tag === value}
            onClick={() => setTag(value)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium',
              tag === value
                ? TAG_ACTIVE_STYLES[value]
                : 'bg-surface-overlay text-on-surface-muted hover:bg-accent-subtle',
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
          className="flex-1 rounded-lg border border-border bg-surface-raised px-3 py-1.5 text-sm text-on-surface placeholder:text-on-surface-faint focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-on-accent hover:bg-accent-hover active:scale-95"
        >
          Add
        </button>
      </div>
    </form>
  );
}
