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

  const dateLabel = format(parseISO(date), 'd EEE');

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

  return (
    <div className={`flex items-center gap-3 px-4 py-2 ${isToday ? 'today ring-1 ring-indigo-400' : ''}`}>
      <span className="w-14 shrink-0 text-sm text-gray-400">{dateLabel}</span>
      {showInput ? (
        <input
          type="text"
          className="flex-1 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none"
          placeholder="Add a note…"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoFocus={isEditing}
        />
      ) : (
        <span
          className="flex-1 cursor-pointer text-sm text-gray-200"
          onClick={handleClickNote}
        >
          {event!.note}
        </span>
      )}
    </div>
  );
}
