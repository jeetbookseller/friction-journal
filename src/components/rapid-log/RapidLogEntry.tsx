import { formatDistanceToNow } from 'date-fns';
import type { RapidLog } from '../../db/models';

const TAG_STYLES: Record<RapidLog['tag'], { pill: string; label: string }> = {
  note:  { pill: 'bg-blue-800 text-blue-200',   label: 'Note' },
  event: { pill: 'bg-green-800 text-green-200',  label: 'Event' },
  mood:  { pill: 'bg-purple-800 text-purple-200', label: 'Mood' },
};

interface RapidLogEntryProps {
  entry: RapidLog;
  onDelete: (id: number) => void;
}

export function RapidLogEntry({ entry, onDelete }: RapidLogEntryProps) {
  const { pill, label } = TAG_STYLES[entry.tag];

  return (
    <div className="flex items-start gap-2 py-2 px-3">
      <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-xs font-medium ${pill}`}>
        {label}
      </span>
      <span className="flex-1 text-sm text-gray-200">{entry.body}</span>
      <span
        data-testid="relative-timestamp"
        className="shrink-0 text-xs text-gray-500"
      >
        {formatDistanceToNow(entry.created_at, { addSuffix: true })}
      </span>
      <button
        aria-label="Delete log entry"
        onClick={() => onDelete(entry.id!)}
        className="shrink-0 text-gray-400 hover:text-red-500 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
