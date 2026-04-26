import { supabase } from './supabase';

interface PHNote {
  id: string;
  text: string;
  date: string;
  crAt: string;
  struck: boolean;
}

export async function sendToProductivityHub(
  body: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  const { data, error: fetchErr } = await supabase
    .from('user_data')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'notes')
    .maybeSingle();

  if (fetchErr) return { success: false, error: fetchErr.message };

  const existingNotes: PHNote[] = Array.isArray(data?.value) ? data.value : [];
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const newNote: PHNote = {
    id: crypto.randomUUID(),
    text: body,
    date: today,
    crAt: now,
    struck: false,
  };

  const { error: upsertErr } = await supabase
    .from('user_data')
    .upsert(
      { user_id: userId, key: 'notes', value: [...existingNotes, newNote], updated_at: now },
      { onConflict: 'user_id,key' },
    );

  if (upsertErr) return { success: false, error: upsertErr.message };
  return { success: true };
}
