import type { Action } from '../../db/models';

interface ActionItemProps {
  action: Action;
  priorityCapReached: boolean;
  onToggleComplete: (id: number) => void;
  onTogglePriority: (id: number) => void;
  onDelete: (id: number) => void;
}

export function ActionItem({
  action,
  priorityCapReached,
  onToggleComplete,
  onTogglePriority,
  onDelete,
}: ActionItemProps) {
  const isPriorityDisabled = priorityCapReached && action.is_top_priority === 0;

  return (
    <div className="flex items-center gap-2 py-2 px-3">
      <input
        type="checkbox"
        checked={action.is_completed === 1}
        onChange={() => onToggleComplete(action.id!)}
        className="h-4 w-4 flex-shrink-0"
      />
      <span
        className={[
          'flex-1 text-sm',
          action.is_completed === 1 ? 'line-through text-gray-400' : '',
          action.is_top_priority === 1 ? 'font-bold' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {action.title}
      </span>
      <button
        aria-label={action.is_top_priority === 1 ? 'Remove priority' : 'Set priority'}
        disabled={isPriorityDisabled}
        onClick={() => onTogglePriority(action.id!)}
        className={[
          'text-lg leading-none',
          action.is_top_priority === 1 ? 'text-yellow-500' : 'text-gray-400',
          isPriorityDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {action.is_top_priority === 1 ? '★' : '☆'}
      </button>
      <button
        aria-label="Delete action"
        onClick={() => onDelete(action.id!)}
        className="text-gray-400 hover:text-red-500 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
