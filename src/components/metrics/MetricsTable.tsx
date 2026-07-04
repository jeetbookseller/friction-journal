import { shortDayLabel, todayString } from '../../lib/dates';
import type { Habit } from '../../db/models';
import type { MetricsDay } from '../../hooks/useMetrics';

interface MetricsTableProps {
  days: MetricsDay[];
  habits: Habit[];
}

export function MetricsTable({ days, habits }: MetricsTableProps) {
  const today = todayString();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-on-surface-muted">
            <th scope="col" className="px-3 py-2 font-medium">Day</th>
            <th scope="col" className="px-3 py-2 font-medium">Actions</th>
            {habits.map((h) => (
              <th scope="col" key={h.uuid} className="px-3 py-2 font-medium">
                {h.name}
              </th>
            ))}
            <th scope="col" className="px-3 py-2 font-medium">Timeline</th>
          </tr>
        </thead>
        <tbody>
          {days.map((day) => (
            <tr
              key={day.date}
              className={[
                'border-b border-border',
                day.date === today ? 'bg-accent-subtle' : '',
              ].join(' ')}
            >
              <td className="px-3 py-2 whitespace-nowrap text-on-surface">
                {shortDayLabel(day.date)}
              </td>
              <td className="px-3 py-2 text-on-surface">
                {day.actionsTotal === 0
                  ? '—'
                  : `${day.actionsCompleted}/${day.actionsTotal}`}
              </td>
              {habits.map((h) => (
                <td key={h.uuid} className="px-3 py-2 text-success">
                  {day.habitDone[h.uuid] ? '✓' : ''}
                </td>
              ))}
              <td
                className="px-3 py-2 max-w-[16rem] truncate text-on-surface-muted"
                title={day.timelineNote}
              >
                {day.timelineNote}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
