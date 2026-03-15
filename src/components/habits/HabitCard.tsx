import { format, subDays, parseISO } from 'date-fns';
import { isTestRun } from '../../hooks/useHabits';
import type { Habit, HabitLog } from '../../db/models';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  today: string;
  onToggleToday: (habitUuid: string, date: string) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
}

const DOT_COUNT = 14;

export function HabitCard({ habit, logs, today, onToggleToday, onDeactivate }: HabitCardProps) {
  const completedDates = new Set(
    logs.filter((l) => l.completed === 1).map((l) => l.date),
  );

  const todayCompleted = completedDates.has(today);

  const dots: string[] = [];
  for (let i = DOT_COUNT - 1; i >= 0; i--) {
    dots.push(format(subDays(parseISO(today), i), 'yyyy-MM-dd'));
  }

  return (
    <div className="p-4 border-b border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{habit.name}</span>
          {isTestRun(habit) && (
            <span className="text-xs bg-amber-700 text-amber-200 px-1.5 py-0.5 rounded">
              Test Run
            </span>
          )}
        </div>
        <button
          aria-label="Deactivate habit"
          onClick={() => onDeactivate(habit.id!)}
          className="text-xs text-gray-500 hover:text-red-400"
        >
          Deactivate
        </button>
      </div>

      <div className="flex gap-1 mb-3">
        {dots.map((date) => (
          <span
            key={date}
            role="img"
            aria-label={date}
            className={[
              'w-4 h-4 rounded-full inline-block',
              completedDates.has(date) ? 'bg-green-500' : 'bg-gray-700',
            ].join(' ')}
          />
        ))}
      </div>

      <button
        aria-label="Toggle today"
        aria-pressed={todayCompleted}
        onClick={() => onToggleToday(habit.uuid, today)}
        className={[
          'w-full py-2 rounded text-sm font-medium',
          todayCompleted
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-700 hover:bg-gray-600 text-gray-200',
        ].join(' ')}
      >
        {todayCompleted ? 'Done ✓' : 'Mark Done'}
      </button>
    </div>
  );
}
