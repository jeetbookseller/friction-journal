import { formatDistanceToNow } from 'date-fns';
import type { RapidLog } from '../../db/models';

const TAG_STYLES: Record<RapidLog['tag'], { pill: string; label: string }> = {
  note:  { pill: 'bg-tag-note-subtle text-tag-note rounded-full',   label: 'Note' },
  event: { pill: 'bg-tag-event-subtle text-tag-event rounded-full', label: 'Event' },
  mood:  { pill: 'bg-tag-mood-subtle text-tag-mood rounded-full',   label: 'Mood' },
};

interface RapidLogEntryProps {
  entry: RapidLog;
  onDelete: (id: number) => void;
}

export function RapidLogEntry({ entry, onDelete }: RapidLogEntryProps) {
  const { pill, label } = TAG_STYLES[entry.tag];

  return (
    <div className="group flex items-start gap-2 py-2 px-3">
      <span className={`mt-0.5 shrink-0 px-1.5 py-0.5 text-xs font-medium ${pill}`}>
        {label}
      </span>
      <span className="flex-1 text-sm text-on-surface">{entry.body}</span>
      <span
        data-testid="relative-timestamp"
        className="shrink-0 text-xs text-on-surface-faint"
      >
        {formatDistanceToNow(entry.created_at, { addSuffix: true })}
      </span>
      <button
        aria-label="Delete log entry"
        onClick={() => onDelete(entry.id!)}
        className="opacity-0 group-hover:opacity-100 shrink-0 text-on-surface-faint hover:text-danger transition-opacity"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
          <path d="M10 11v6M14 11v6" />
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
        </svg>
      </button>
    </div>
  );
}
