import { useState } from 'react';
import { format } from 'date-fns';
import { getMonthRange, todayString } from '../../lib/dates';
import { useTimelineForMonth } from '../../hooks/useTimeline';
import { TimelineDay } from './TimelineDay';

interface TimelineViewProps {
  initialYear?: number;
  initialMonth?: number;
}

export function TimelineView({ initialYear, initialMonth }: TimelineViewProps = {}) {
  const today = todayString();
  const [year, setYear] = useState(initialYear ?? parseInt(today.slice(0, 4)));
  const [month, setMonth] = useState(initialMonth ?? parseInt(today.slice(5, 7)));

  const { events, upsertEvent } = useTimelineForMonth(year, month);
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
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <button
          aria-label="Previous month"
          onClick={goToPrev}
          className="px-2 py-1 text-gray-400 hover:text-gray-200"
        >
          ←
        </button>
        <span className="font-semibold text-gray-200">{headerLabel}</span>
        <button
          aria-label="Next month"
          onClick={goToNext}
          className="px-2 py-1 text-gray-400 hover:text-gray-200"
        >
          →
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-gray-800">
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
