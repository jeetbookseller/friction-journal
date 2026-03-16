import { useState, useEffect } from 'react';
import { useActionsForDate } from '../../hooks/useActions';
import { todayString } from '../../lib/dates';
import { MAX_TOP_PRIORITIES } from '../../lib/constants';
import { ActionItem } from './ActionItem';
import { AddActionForm } from './AddActionForm';
import { format, parseISO } from 'date-fns';
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

export function ActionList() {
  const today = todayString();
  const { actions, priorityCount, addAction, toggleComplete, togglePriority, deleteAction } =
    useActionsForDate(today);
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const priorityCapReached = priorityCount >= MAX_TOP_PRIORITIES;

  async function handleAdd(title: string) {
    await addAction(title);
    showToast('Action added');
  }

  async function handleDelete(id: number) {
    await deleteAction(id);
    showToast('Action deleted');
  }

  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-semibold text-on-surface" role="heading">
          {format(parseISO(today), 'EEEE, MMMM d')}
        </h1>
        <span className="mt-1 inline-block text-sm bg-accent-subtle text-accent rounded-full px-2 py-0.5">
          {priorityCount}/3 priorities
        </span>
      </div>

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
            description="Add your first action for today below"
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
