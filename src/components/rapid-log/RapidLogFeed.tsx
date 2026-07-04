import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { useRapidLogs } from '../../hooks/useRapidLogs';
import { useAuthContext } from '../AuthProvider';
import { useToast } from '../ui/ToastContext';
import { sendToProductivityHub } from '../../lib/sendToProductivityHub';
import { db } from '../../db/database';
import { weekStartString, weekRangeLabel, dayLabel } from '../../lib/dates';
import { RapidLogEntry } from './RapidLogEntry';
import { AddRapidLogForm } from './AddRapidLogForm';
import { EmptyState } from '../ui/EmptyState';
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

interface DayGroup {
  date: string;
  label: string;
  entries: RapidLog[];
}

interface WeekGroup {
  weekStart: string;
  label: string;
  count: number;
  days: DayGroup[];
}

function groupLogsByWeek(logs: RapidLog[]): WeekGroup[] {
  const weeks: WeekGroup[] = [];
  // logs arrive newest-first, so weeks/days build in display order
  for (const log of logs) {
    const weekStart = weekStartString(log.created_at);
    let week = weeks[weeks.length - 1];
    if (!week || week.weekStart !== weekStart) {
      week = { weekStart, label: weekRangeLabel(weekStart), count: 0, days: [] };
      weeks.push(week);
    }
    week.count++;

    const date = format(log.created_at, 'yyyy-MM-dd');
    let day = week.days[week.days.length - 1];
    if (!day || day.date !== date) {
      day = { date, label: dayLabel(log.created_at), entries: [] };
      week.days.push(day);
    }
    day.entries.push(log);
  }
  return weeks;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={`transition-transform ${open ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function RapidLogFeed() {
  const [filter, setFilter] = useState<RapidLog['tag'] | undefined>(undefined);
  const { session } = useAuthContext();
  const userId = session!.user.id;
  const { logs, addRapidLog, updateRapidLogBody, deleteRapidLog } = useRapidLogs(userId, filter);
  const { showToast } = useToast();
  const [sendingUuid, setSendingUuid] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    () => new Set([weekStartString(Date.now())]),
  );

  const handleSendToWork = async (entry: RapidLog) => {
    if (!session || entry.sent_to_ph === 1 || sendingUuid !== null) return;
    setSendingUuid(entry.uuid);
    try {
      const result = await sendToProductivityHub(entry.body, session.user.id);
      if (result.success) {
        const now = Date.now();
        await db.rapid_logs
          .where('uuid').equals(entry.uuid)
          .modify({ sent_to_ph: 1, sent_to_ph_at: now, updated_at: now });
        showToast('Sent to Work');
      } else {
        showToast(`Failed to send: ${result.error}`);
      }
    } finally {
      setSendingUuid(null);
    }
  };

  const weeks = useMemo(() => groupLogsByWeek([...logs].reverse()), [logs]);

  function toggleWeek(weekStart: string) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(weekStart)) {
        next.delete(weekStart);
      } else {
        next.add(weekStart);
      }
      return next;
    });
  }

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

      {/* Log entries — scrollable, grouped by week */}
      <div className="flex-1 overflow-y-auto">
        {weeks.length === 0 ? (
          <EmptyState
            icon={<PenIcon />}
            title="No log entries yet"
            description="Add your first log below."
          />
        ) : (
          weeks.map((week) => {
            const isOpen = expandedWeeks.has(week.weekStart);
            return (
              <section key={week.weekStart}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => toggleWeek(week.weekStart)}
                  className="w-full flex items-center gap-2 px-3 py-2 border-b border-border
                             bg-surface-raised text-sm font-medium text-on-surface
                             hover:bg-surface-overlay transition-colors"
                >
                  <ChevronIcon open={isOpen} />
                  <span>{week.label}</span>
                  <span className="ml-auto text-xs rounded-full bg-surface-overlay text-on-surface-muted px-2 py-0.5">
                    {week.count}
                  </span>
                </button>
                {isOpen &&
                  week.days.map((day) => (
                    <div key={day.date}>
                      <div className="px-3 py-1 text-xs font-medium text-on-surface-muted bg-surface-overlay">
                        {day.label}
                      </div>
                      <ul>
                        {day.entries.map((log) => (
                          <li key={log.id} className="animate-slide-up border-b border-border">
                            <RapidLogEntry
                              entry={log}
                              onDelete={deleteRapidLog}
                              onUpdateBody={updateRapidLogBody}
                              onSendToWork={handleSendToWork}
                              isSending={sendingUuid === log.uuid}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </section>
            );
          })
        )}
      </div>

      {/* Input form pinned at bottom */}
      <AddRapidLogForm onAdd={addRapidLog} />
    </div>
  );
}
