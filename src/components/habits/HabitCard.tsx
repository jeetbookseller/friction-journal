import { useState } from 'react';
import { format, subDays, parseISO } from 'date-fns';
import { isTestRun } from '../../hooks/useHabits';
import { Modal } from '../ui/Modal';
import type { Habit, HabitLog } from '../../db/models';

interface HabitCardProps {
  habit: Habit;
  logs: HabitLog[];
  today: string;
  onToggleToday: (habitUuid: string, date: string) => Promise<void>;
  onUpdateDetails: (id: number, details: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

const DOT_COUNT = 14;

export function HabitCard({
  habit,
  logs,
  today,
  onToggleToday,
  onUpdateDetails,
  onDelete,
}: HabitCardProps) {
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const completedDates = new Set(
    logs.filter((l) => l.completed === 1).map((l) => l.date),
  );

  const todayCompleted = completedDates.has(today);

  const dots: string[] = [];
  for (let i = DOT_COUNT - 1; i >= 0; i--) {
    dots.push(format(subDays(parseISO(today), i), 'yyyy-MM-dd'));
  }

  function startEditingDetails() {
    setEditValue(habit.details);
    setIsEditingDetails(true);
  }

  function commitDetails() {
    const trimmed = editValue.trim();
    if (trimmed !== habit.details) {
      onUpdateDetails(habit.id!, trimmed);
    }
    setIsEditingDetails(false);
    setEditValue('');
  }

  function handleDetailsKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      commitDetails();
    } else if (e.key === 'Escape') {
      setIsEditingDetails(false);
      setEditValue('');
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-on-surface">{habit.name}</span>
          {isTestRun(habit) && (
            <span className="text-xs rounded-full bg-warning-subtle text-warning px-2 py-0.5">
              Test Run
            </span>
          )}
        </div>
        <button
          aria-label="Delete habit"
          onClick={() => setConfirmingDelete(true)}
          className="text-xs text-on-surface-faint hover:text-danger transition-colors"
        >
          Delete
        </button>
      </div>

      {isEditingDetails ? (
        <input
          type="text"
          aria-label="Edit habit details"
          className="w-full mb-3 bg-transparent text-xs text-on-surface outline-none border-b border-accent"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitDetails}
          onKeyDown={handleDetailsKeyDown}
          autoFocus
        />
      ) : (
        <p
          onClick={startEditingDetails}
          className={[
            'mb-3 text-xs cursor-text',
            habit.details ? 'text-on-surface-muted' : 'text-on-surface-faint italic',
          ].join(' ')}
        >
          {habit.details || 'Add details…'}
        </p>
      )}

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

      <Modal
        open={confirmingDelete}
        title="Delete habit?"
        onClose={() => setConfirmingDelete(false)}
      >
        <p className="mb-4 text-sm text-on-surface-muted">
          '{habit.name}' will be removed. To rename a habit, delete it and create a
          new one.
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="px-3 py-2 text-sm rounded-lg bg-surface-overlay text-on-surface hover:bg-accent-subtle"
          >
            Cancel
          </button>
          <button
            aria-label="Confirm delete habit"
            onClick={() => {
              setConfirmingDelete(false);
              onDelete(habit.id!);
            }}
            className="px-3 py-2 text-sm rounded-lg bg-danger text-on-accent hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
