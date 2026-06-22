import { useState, useEffect } from 'react';
import { useActionsForDate, usePendingMigrationCount } from '../../hooks/useActions';
import { useAuthContext } from '../AuthProvider';
import { todayString } from '../../lib/dates';
import { MAX_TOP_PRIORITIES } from '../../lib/constants';
import { ActionItem } from './ActionItem';
import { AddActionForm } from './AddActionForm';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { EmptyState } from '../ui/EmptyState';
import { AnimatedList } from '../ui/AnimatedList';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { useToast } from '../ui/ToastContext';

function CheckboxIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12.5 15l-5-5 5-5" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
         stroke="currentColor" strokeWidth="1.5"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M7.5 5l5 5-5 5" />
    </svg>
  );
}

export function ActionList() {
  const today = todayString();
  const [selectedDate, setSelectedDate] = useState(today);
  const { session } = useAuthContext();
  const userId = session!.user.id;
  const {
    actions,
    priorityCount,
    addAction,
    toggleComplete,
    togglePriority,
    deleteAction,
    updateActionTitle,
    clearCompleted,
    carryForwardAction,
  } = useActionsForDate(selectedDate, userId);
  const pendingMigrationCount = usePendingMigrationCount(today, userId);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const priorityCapReached = priorityCount >= MAX_TOP_PRIORITIES;
  const isToday = selectedDate === today;
  const isPastDay = selectedDate < today;
  const completedCount = actions.filter((a) => a.is_completed === 1).length;

  function goToPrevDay() {
    setSelectedDate(format(subDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  }

  function goToNextDay() {
    setSelectedDate(format(addDays(parseISO(selectedDate), 1), 'yyyy-MM-dd'));
  }

  async function handleAdd(title: string) {
    await addAction(title);
    showToast('Action added');
  }

  async function handleDelete(id: number) {
    await deleteAction(id);
    showToast('Action deleted');
  }

  async function handleClearCompleted() {
    await clearCompleted();
    showToast('Completed cleared');
  }

  async function handleCarryForward(id: number) {
    await carryForwardAction(id, today);
    showToast('Carried forward to today');
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <button
            aria-label="Previous day"
            onClick={goToPrevDay}
            className="p-2 -ml-2 rounded-lg text-on-surface-muted hover:bg-surface-overlay transition-colors"
          >
            <ChevronLeft />
          </button>
          <h1 className="text-xl font-semibold text-on-surface text-center" role="heading">
            {isToday ? 'Today' : format(parseISO(selectedDate), 'EEEE, MMMM d')}
          </h1>
          <button
            aria-label="Next day"
            onClick={goToNextDay}
            className="p-2 -mr-2 rounded-lg text-on-surface-muted hover:bg-surface-overlay transition-colors"
          >
            <ChevronRight />
          </button>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-block text-sm bg-accent-subtle text-accent rounded-full px-2 py-0.5">
            {priorityCount}/3 priorities
          </span>
          <div className="flex items-center gap-2">
            {!isToday && (
              <button
                onClick={() => setSelectedDate(today)}
                className="text-sm text-accent hover:underline"
              >
                Today
              </button>
            )}
            {completedCount > 0 && (
              <button
                onClick={handleClearCompleted}
                className="text-sm text-on-surface-muted hover:text-danger transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>
        </div>
      </div>

      {isToday && pendingMigrationCount > 0 && (
        <div className="px-4 pt-3">
          <Card>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-on-surface">
                {pendingMigrationCount} unfinished from earlier
              </span>
              <button
                onClick={goToPrevDay}
                className="flex-shrink-0 text-sm font-medium text-accent hover:underline"
              >
                Review
              </button>
            </div>
          </Card>
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2">
        {isLoading ? (
          <div className="px-4 space-y-3 pt-2">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : actions.length === 0 ? (
          <EmptyState
            icon={<CheckboxIcon />}
            title="No actions yet"
            description={isToday ? 'Add your first action for today below' : 'No actions on this day'}
          />
        ) : (
          <ul>
            <AnimatedList>
              {actions.map((action) => (
                <li key={action.id} className="animate-slide-up px-4 mb-2">
                  <Card>
                    <ActionItem
                      action={action}
                      priorityCapReached={priorityCapReached}
                      onToggleComplete={toggleComplete}
                      onTogglePriority={togglePriority}
                      onDelete={handleDelete}
                      onUpdateTitle={updateActionTitle}
                      onCarryForward={isPastDay ? handleCarryForward : undefined}
                    />
                  </Card>
                </li>
              ))}
            </AnimatedList>
          </ul>
        )}
      </div>

      <div className="border-t border-border">
        <AddActionForm onAdd={handleAdd} />
      </div>
    </div>
  );
}
