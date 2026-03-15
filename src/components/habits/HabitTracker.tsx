import { format, subDays, parseISO } from 'date-fns';
import { useActiveHabits, useHabitLogs } from '../../hooks/useHabits';
import { todayString } from '../../lib/dates';
import { MAX_ACTIVE_HABITS } from '../../lib/constants';
import { HabitCard } from './HabitCard';
import { AddHabitForm } from './AddHabitForm';
import type { Habit } from '../../db/models';

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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold" role="heading">
          Habits
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{activeCount}/3 habit slots used</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {habits.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No active habits. Add one below.</p>
        ) : (
          <ul>
            {habits.map((habit) => (
              <li key={habit.id}>
                <HabitSlot
                  habit={habit}
                  today={today}
                  onToggleToday={toggleHabitLog}
                  onDeactivate={deactivateHabit}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-700">
        <AddHabitForm onAdd={addHabit} capReached={capReached} />
      </div>
    </div>
  );
}
