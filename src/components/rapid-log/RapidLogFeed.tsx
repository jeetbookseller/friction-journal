import { useState } from 'react';
import { useRapidLogs } from '../../hooks/useRapidLogs';
import { RapidLogEntry } from './RapidLogEntry';
import { AddRapidLogForm } from './AddRapidLogForm';
import { EmptyState } from '../ui/EmptyState';
import { AnimatedList } from '../ui/AnimatedList';
import type { RapidLog } from '../../db/models';

const FILTER_CHIPS: { value: RapidLog['tag'] | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'note',    label: 'Note' },
  { value: 'event',   label: 'Event' },
  { value: 'mood',    label: 'Mood' },
];

const PenIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export function RapidLogFeed() {
  const [filter, setFilter] = useState<RapidLog['tag'] | undefined>(undefined);
  const { logs, addRapidLog, deleteRapidLog } = useRapidLogs(filter);

  // Show newest first
  const displayLogs = [...logs].reverse();

  return (
    <div className="animate-fade-in flex flex-col h-full">
      {/* Filter chips */}
      <div
        role="toolbar"
        aria-label="Filter logs"
        className="bg-surface sticky top-0 z-10 border-b border-border flex gap-2 p-3"
      >
        {FILTER_CHIPS.map(({ value, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium',
              filter === value
                ? 'bg-accent text-on-accent'
                : 'bg-surface-overlay text-on-surface-muted hover:bg-accent-subtle',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log entries — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {displayLogs.length === 0 ? (
          <EmptyState
            icon={<PenIcon />}
            title="No log entries yet"
            description="Add your first log below."
          />
        ) : (
          <ul>
            <AnimatedList>
              {displayLogs.map((log) => (
                <li key={log.id} className="animate-slide-up border-b border-border">
                  <RapidLogEntry entry={log} onDelete={deleteRapidLog} />
                </li>
              ))}
            </AnimatedList>
          </ul>
        )}
      </div>

      {/* Input form pinned at bottom */}
      <AddRapidLogForm onAdd={addRapidLog} />
    </div>
  );
}
