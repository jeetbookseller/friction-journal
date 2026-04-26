import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase?.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    }) ?? { data: { subscription: { unsubscribe: () => {} } } };

    return () => listener.subscription.unsubscribe();
  }, []);

  const signIn = (email: string, password: string) =>
    supabase!.auth.signInWithPassword({ email, password });

  const signUp = (email: string, password: string) =>
    supabase!.auth.signUp({ email, password });

  const signOut = async () => {
    await supabase?.auth.signOut();
    localStorage.removeItem('last_sync_timestamp');
  };

  return { session, loading, signIn, signUp, signOut };
}
