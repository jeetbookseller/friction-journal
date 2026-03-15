import { useState } from 'react';
import { useRapidLogs } from '../../hooks/useRapidLogs';
import { RapidLogEntry } from './RapidLogEntry';
import { AddRapidLogForm } from './AddRapidLogForm';
import type { RapidLog } from '../../db/models';

const FILTER_CHIPS: { value: RapidLog['tag'] | undefined; label: string }[] = [
  { value: undefined, label: 'All' },
  { value: 'note',    label: 'Note' },
  { value: 'event',   label: 'Event' },
  { value: 'mood',    label: 'Mood' },
];

export function RapidLogFeed() {
  const [filter, setFilter] = useState<RapidLog['tag'] | undefined>(undefined);
  const { logs, addRapidLog, deleteRapidLog } = useRapidLogs(filter);

  // Show newest first
  const displayLogs = [...logs].reverse();

  return (
    <div className="flex flex-col h-full">
      {/* Filter chips */}
      <div role="toolbar" aria-label="Filter logs" className="flex gap-2 p-3 border-b border-gray-700">
        {FILTER_CHIPS.map(({ value, label }) => (
          <button
            key={label}
            type="button"
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
            className={[
              'rounded px-2.5 py-1 text-xs font-medium',
              filter === value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Log entries — scrollable */}
      <div className="flex-1 overflow-y-auto">
        {displayLogs.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">
            No entries yet. Add your first log below.
          </p>
        ) : (
          <ul>
            {displayLogs.map((log) => (
              <li key={log.id} className="border-b border-gray-800">
                <RapidLogEntry entry={log} onDelete={deleteRapidLog} />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Input form pinned at bottom */}
      <AddRapidLogForm onAdd={addRapidLog} />
    </div>
  );
}
