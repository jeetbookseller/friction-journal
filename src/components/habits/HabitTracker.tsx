import { format, subDays, parseISO } from 'date-fns';
import { useActiveHabits, useHabitLogs } from '../../hooks/useHabits';
import { todayString } from '../../lib/dates';
import { MAX_ACTIVE_HABITS } from '../../lib/constants';
import { HabitCard } from './HabitCard';
import { AddHabitForm } from './AddHabitForm';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import type { Habit } from '../../db/models';

const TargetIcon = (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    role="img"
    aria-label="target"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

interface HabitSlotProps {
  habit: Habit;
  today: string;
  onToggleToday: (habitUuid: string, date: string) => Promise<void>;
  onDeactivate: (id: number) => Promise<void>;
}

function HabitSlot({ habit, today, onToggleToday, onDeactivate }: HabitSlotProps) {
  const startDate = format(subDays(parseISO(today), 13), 'yyyy-MM-dd');
  const logs = useHabitLogs(habit.uuid, startDate, today);
  return (
    <HabitCard
      habit={habit}
      logs={logs}
      today={today}
      onToggleToday={onToggleToday}
      onDeactivate={onDeactivate}
    />
  );
}

export function HabitTracker() {
  const today = todayString();
  const { habits, activeCount, addHabit, deactivateHabit, toggleHabitLog } = useActiveHabits();
  const capReached = activeCount >= MAX_ACTIVE_HABITS;

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-on-surface" role="heading">
            Habits
          </h1>
          <span className="text-sm rounded-full bg-accent-subtle text-accent px-3 py-0.5 font-medium">
            {activeCount}/3 habit slots used
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {habits.length === 0 ? (
          <EmptyState
            icon={TargetIcon}
            title="No active habits"
            description="Add up to 3 habits to track below."
          />
        ) : (
          <ul>
            {habits.map((habit) => (
              <li key={habit.id}>
                <Card className="mb-3 mx-4">
                  <HabitSlot
                    habit={habit}
                    today={today}
                    onToggleToday={toggleHabitLog}
                    onDeactivate={deactivateHabit}
                  />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-border">
        <AddHabitForm onAdd={addHabit} capReached={capReached} />
      </div>
    </div>
  );
}
