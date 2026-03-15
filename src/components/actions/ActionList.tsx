import { useActionsForDate } from '../../hooks/useActions';
import { todayString } from '../../lib/dates';
import { MAX_TOP_PRIORITIES } from '../../lib/constants';
import { ActionItem } from './ActionItem';
import { AddActionForm } from './AddActionForm';
import { format, parseISO } from 'date-fns';

export function ActionList() {
  const today = todayString();
  const { actions, priorityCount, addAction, toggleComplete, togglePriority, deleteAction } =
    useActionsForDate(today);

  const priorityCapReached = priorityCount >= MAX_TOP_PRIORITIES;

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-lg font-semibold" role="heading">
          {format(parseISO(today), 'EEEE, MMMM d')}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">{priorityCount}/3 priorities</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {actions.length === 0 ? (
          <p className="p-4 text-sm text-gray-500">No actions for today.</p>
        ) : (
          <ul>
            {actions.map((action) => (
              <li key={action.id}>
                <ActionItem
                  action={action}
                  priorityCapReached={priorityCapReached}
                  onToggleComplete={toggleComplete}
                  onTogglePriority={togglePriority}
                  onDelete={deleteAction}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-700">
        <AddActionForm onAdd={addAction} />
      </div>
    </div>
  );
}
