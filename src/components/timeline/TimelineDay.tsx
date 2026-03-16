import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import type { TimelineEvent } from '../../db/models';

interface TimelineDayProps {
  date: string;
  event?: TimelineEvent;
  isToday: boolean;
  onUpsert: (date: string, note: string) => Promise<void>;
}

export function TimelineDay({ date, event, isToday, onUpsert }: TimelineDayProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const dayNum = format(parseISO(date), 'd');
  const dayName = format(parseISO(date), 'EEE');

  function handleBlur() {
    const trimmed = editValue.trim();
    if (trimmed) {
      onUpsert(date, trimmed);
    }
    setIsEditing(false);
    setEditValue('');
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      const trimmed = editValue.trim();
      if (trimmed) {
        onUpsert(date, trimmed);
      }
      setIsEditing(false);
      setEditValue('');
    }
  }

  function handleClickNote() {
    setIsEditing(true);
    setEditValue(event?.note ?? '');
  }

  const showInput = !event || isEditing;
  const hasNote = !!event && !isEditing;

  const rootClass = [
    'flex items-center gap-3 px-4 py-2 hover:bg-surface-overlay transition-colors',
    isToday ? 'today bg-accent-subtle rounded-lg mx-2 my-1' : '',
    hasNote ? 'border-l-2 border-accent' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClass}>
      <span className="w-14 shrink-0 text-sm">
        <span className="font-semibold text-on-surface">{dayNum}</span>
        {' '}
        <span className="text-on-surface-faint">{dayName}</span>
      </span>
      {showInput ? (
        <input
          type="text"
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-faint outline-none"
          placeholder="Add a note…"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={isEditing}
        />
      ) : (
        <span
          className="flex-1 cursor-pointer text-sm text-on-surface"
          onClick={handleClickNote}
        >
          {event!.note}
        </span>
      )}
    </div>
  );
}
