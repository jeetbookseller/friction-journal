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
  onSendToWork?: (entry: RapidLog) => void;
  isSending?: boolean;
}

export function RapidLogEntry({
  entry,
  onDelete,
  onSendToWork = () => {},
  isSending = false,
}: RapidLogEntryProps) {
  const { pill, label } = TAG_STYLES[entry.tag];
  const alreadySent = entry.sent_to_ph === 1;

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
        aria-label={alreadySent ? 'Already sent to Work' : 'Send to Work'}
        title={alreadySent ? 'Sent to Work' : 'Send to Work'}
        disabled={alreadySent || isSending}
        onClick={() => onSendToWork(entry)}
        className={[
          'shrink-0 transition-colors',
          alreadySent
            ? 'text-accent'
            : 'opacity-0 group-hover:opacity-100 text-on-surface-faint hover:text-accent transition-opacity',
          alreadySent || isSending ? 'cursor-default' : '',
        ].filter(Boolean).join(' ')}
      >
        {alreadySent ? (
          <CheckIcon width={14} height={14} />
        ) : isSending ? (
          <SpinnerIcon width={14} height={14} />
        ) : (
          <BriefcaseIcon width={14} height={14} />
        )}
      </button>
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

function BriefcaseIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function CheckIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
