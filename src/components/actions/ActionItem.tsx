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
    <div className="group flex items-center gap-3 py-3 px-4">
      <input
        type="checkbox"
        checked={action.is_completed === 1}
        onChange={() => onToggleComplete(action.id!)}
        className="custom-checkbox"
      />
      <span
        className={[
          'flex-1 text-sm text-on-surface',
          action.is_completed === 1 ? 'line-through text-on-surface-faint' : '',
          action.is_top_priority === 1 ? 'font-semibold' : '',
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
          'flex-shrink-0 transition-colors',
          action.is_top_priority === 1 ? 'text-warning' : 'text-on-surface-faint',
          isPriorityDisabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={action.is_top_priority === 1 ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </button>
      <button
        aria-label="Delete action"
        onClick={() => onDelete(action.id!)}
        className="flex-shrink-0 text-on-surface-faint hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  );
}
