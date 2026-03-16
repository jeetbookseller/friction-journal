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
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-on-surface">{habit.name}</span>
          {isTestRun(habit) && (
            <span className="text-xs rounded-full bg-warning-subtle text-warning px-2 py-0.5">
              Test Run
            </span>
          )}
        </div>
        <button
          aria-label="Deactivate habit"
          onClick={() => onDeactivate(habit.id!)}
          className="text-xs text-on-surface-faint hover:text-danger transition-colors"
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
              'w-3 h-3 rounded-sm inline-block',
              completedDates.has(date) ? 'bg-success' : 'bg-surface-overlay',
            ].join(' ')}
          />
        ))}
      </div>

      <button
        aria-label="Toggle today"
        aria-pressed={todayCompleted}
        onClick={() => onToggleToday(habit.uuid, today)}
        className={[
          'w-full py-2 rounded-lg text-sm font-medium transition-colors active:scale-[0.98]',
          todayCompleted
            ? 'bg-success text-on-accent hover:opacity-90'
            : 'bg-surface-overlay hover:bg-accent-subtle text-on-surface',
        ].join(' ')}
      >
        {todayCompleted ? 'Done ✓' : 'Mark Done'}
      </button>
    </div>
  );
}
