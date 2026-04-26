export interface Action {
  id?: number;
  uuid: string;
  user_id: string;
  date: string;          // 'YYYY-MM-DD'
  title: string;
  is_completed: 0 | 1;
  is_top_priority: 0 | 1;
  sort_order: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface TimelineEvent {
  id?: number;
  uuid: string;
  user_id: string;
  date: string;          // Unique — one per day
  note: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Habit {
  id?: number;
  uuid: string;
  user_id: string;
  name: string;
  is_active: 0 | 1;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface HabitLog {
  id?: number;
  uuid: string;
  user_id: string;
  habit_uuid: string;
  date: string;
  completed: 0 | 1;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface RapidLog {
  id?: number;
  uuid: string;
  user_id: string;
  tag: 'note' | 'event' | 'mood';
  body: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sent_to_ph: 0 | 1;
  sent_to_ph_at: number | null;
}
