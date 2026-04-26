import { useState } from 'react';
import { format } from 'date-fns';
import { getMonthRange, todayString } from '../../lib/dates';
import { useTimelineForMonth } from '../../hooks/useTimeline';
import { useAuthContext } from '../AuthProvider';
import { TimelineDay } from './TimelineDay';

interface TimelineViewProps {
  initialYear?: number;
  initialMonth?: number;
}

export function TimelineView({ initialYear, initialMonth }: TimelineViewProps = {}) {
  const today = todayString();
  const [year, setYear] = useState(initialYear ?? parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(initialMonth ?? parseInt(today.slice(5, 7)));

  const { session } = useAuthContext();
  const userId = session!.user.id;
  const { events, upsertEvent } = useTimelineForMonth(year, month, userId);
  const dates = getMonthRange(year, month);
  const headerLabel = format(new Date(year, month - 1), 'MMMM yyyy');

  function goToPrev() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNext() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="flex items-center justify-between px-4 py-3 bg-surface sticky top-0 z-10 border-b border-border">
        <button
          aria-label="Previous month"
          onClick={goToPrev}
          className="p-2 rounded-lg text-on-surface-muted hover:bg-surface-overlay transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12.5 15l-5-5 5-5" />
          </svg>
        </button>
        <span className="font-semibold text-on-surface">{headerLabel}</span>
        <button
          aria-label="Next month"
          onClick={goToNext}
          className="p-2 rounded-lg text-on-surface-muted hover:bg-surface-overlay transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
               stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M7.5 5l5 5-5 5" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {dates.map((date) => (
          <div key={date} data-testid={`day-${date}`}>
            <TimelineDay
              date={date}
              event={events.get(date)}
              isToday={date === today}
              onUpsert={upsertEvent}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
