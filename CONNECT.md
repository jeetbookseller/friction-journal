# Integration: Friction Journal ↔ Productivity Hub

This document is the authoritative implementation guide for connecting Friction Journal
with Productivity Hub. Both apps share one Supabase project, stay as separate PWAs,
but allow cross-app sending between FJ's Rapid Log and PH's Capture tab.

This file covers **work to be done in this repo (Friction Journal)**.
See `productivity/CONNECT.md` for the parallel work in that repo.

---

## Summary

- **Single connection point**: FJ Rapid Log entries ↔ PH Capture notes. No other data crosses.
- **Sending creates a copy** — source entry stays in FJ; a new independent note appears in PH Capture.
- **Sent indicator** — source entry shows a checkmark after sending; button becomes disabled.
- **Deep-link toggle** — a `Work` button in FJ's header opens Productivity Hub.

---

## Phase 1 — Auth + User Scoping (largest phase)

FJ currently has no auth (offline-first v1). This phase adds Supabase auth using
the **same Supabase project as PH** and adds `user_id` to all FJ tables.

### 1.1 Supabase credentials

FJ's `.env.local` (git-ignored) uses the **same values** as PH:
```
VITE_SUPABASE_URL=https://<same-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<same-key>
VITE_OTHER_APP_URL=https://jeetbookseller.github.io/productivity/
```

Update `.env.example`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OTHER_APP_URL=https://jeetbookseller.github.io/productivity/
```

### 1.2 Database migration: `supabase/migrations/002_user_scoping.sql`

No existing production data in FJ — the migration can treat tables as empty.

```sql
-- =============================================================================
-- Migration 002: Add user_id to all tables, update RLS to per-user policies,
-- update pull_changes RPC to filter by auth.uid().
-- Safe to run on empty tables (no backfill needed).
-- =============================================================================

-- Add user_id column to all 5 tables
ALTER TABLE actions         ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE timeline_events ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE habits          ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE habit_logs      ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;
ALTER TABLE rapid_logs      ADD COLUMN user_id UUID REFERENCES auth.users NOT NULL;

-- Drop old lax RLS policies (checked auth.uid() IS NOT NULL only)
DROP POLICY IF EXISTS "actions: authenticated users own their rows"         ON actions;
DROP POLICY IF EXISTS "timeline_events: authenticated users own their rows" ON timeline_events;
DROP POLICY IF EXISTS "habits: authenticated users own their rows"          ON habits;
DROP POLICY IF EXISTS "habit_logs: authenticated users own their rows"      ON habit_logs;
DROP POLICY IF EXISTS "rapid_logs: authenticated users own their rows"      ON rapid_logs;

-- Create per-user RLS policies
CREATE POLICY "actions: users own their rows"
  ON actions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "timeline_events: users own their rows"
  ON timeline_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: users own their rows"
  ON habits FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habit_logs: users own their rows"
  ON habit_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "rapid_logs: users own their rows"
  ON rapid_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Update pull_changes RPC to filter by the calling user's id
CREATE OR REPLACE FUNCTION pull_changes(since BIGINT)
  RETURNS JSON
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'actions', (
      SELECT json_agg(a ORDER BY a.updated_at)
      FROM actions a
      WHERE a.updated_at > since AND a.user_id = auth.uid()
    ),
    'timeline_events', (
      SELECT json_agg(te ORDER BY te.updated_at)
      FROM timeline_events te
      WHERE te.updated_at > since AND te.user_id = auth.uid()
    ),
    'habits', (
      SELECT json_agg(h ORDER BY h.updated_at)
      FROM habits h
      WHERE h.updated_at > since AND h.user_id = auth.uid()
    ),
    'habit_logs', (
      SELECT json_agg(hl ORDER BY hl.updated_at)
      FROM habit_logs hl
      WHERE hl.updated_at > since AND hl.user_id = auth.uid()
    ),
    'rapid_logs', (
      SELECT json_agg(rl ORDER BY rl.updated_at)
      FROM rapid_logs rl
      WHERE rl.updated_at > since AND rl.user_id = auth.uid()
    )
  );
$$;
```

### 1.3 Add `sent_to_ph` fields: `supabase/migrations/003_rapid_log_sent_flag.sql`

```sql
-- Add sent-to-PH tracking fields to rapid_logs.
-- Allows the UI to show a sent indicator without re-querying PH's database.
ALTER TABLE rapid_logs
  ADD COLUMN sent_to_ph     SMALLINT DEFAULT 0    CHECK (sent_to_ph IN (0, 1)),
  ADD COLUMN sent_to_ph_at  BIGINT   DEFAULT NULL;
```

### 1.4 Update TypeScript models: `src/db/models.ts`

Add `user_id: string` to all 5 interfaces, and the new sent fields to `RapidLog`:

```typescript
export interface Action {
  id?: number;
  uuid: string;
  user_id: string;        // NEW
  date: string;
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
  user_id: string;        // NEW
  date: string;
  note: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Habit {
  id?: number;
  uuid: string;
  user_id: string;        // NEW
  name: string;
  is_active: 0 | 1;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface HabitLog {
  id?: number;
  uuid: string;
  user_id: string;        // NEW
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
  user_id: string;        // NEW
  tag: 'note' | 'event' | 'mood';
  body: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  sent_to_ph: 0 | 1;         // NEW
  sent_to_ph_at: number | null;  // NEW
}
```

### 1.5 Update Dexie schema: `src/db/database.ts`

Bump the version number and add the new columns. Dexie handles non-indexed column
additions automatically via `upgrade()`. Only indexed columns need explicit entries.

```typescript
// Bump version from current to next (e.g. 1 → 2)
this.version(2).stores({
  actions:         '++id, uuid, user_id, date, updated_at, deleted_at',
  timeline_events: '++id, uuid, user_id, date, updated_at, deleted_at',
  habits:          '++id, uuid, user_id, is_active, updated_at, deleted_at',
  habit_logs:      '++id, uuid, user_id, [habit_uuid+date], updated_at, deleted_at',
  rapid_logs:      '++id, uuid, user_id, tag, updated_at, deleted_at',
});
// No upgrade() callback needed — new columns (user_id, sent_to_ph, sent_to_ph_at)
// are non-indexed additions that Dexie handles automatically.
```

### 1.6 Create `src/hooks/useAuth.ts`

Minimal auth hook. FJ v1 does not need password reset or email confirmation flows.

```typescript
import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading]  = useState(true);

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
    // Clear sync timestamp so the next user doesn't inherit this user's sync state
    localStorage.removeItem('last_sync_timestamp');
  };

  return { session, loading, signIn, signUp, signOut };
}
```

### 1.7 Create `src/components/AuthProvider.tsx`

```tsx
import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import { useAuth } from '../hooks/useAuth';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be inside AuthProvider');
  return ctx;
}
```

### 1.8 Create `src/components/AuthForm.tsx`

A simple full-screen form with two modes: `login` and `signup`.
Use FJ's existing design tokens from `src/styles/index.css` (`var(--color-accent)`, etc.).

Required behaviour:
- Default mode: `login`
- Toggle link: "Don't have an account? Sign up" / "Already have an account? Log in"
- Email + password fields, submit button with loading state
- Display error message from Supabase on failure
- On successful login: auth state change fires automatically via `onAuthStateChange` — no manual redirect needed
- On successful signup: show a "Check your email to confirm your account" message
  (Supabase sends a confirmation email by default)

```tsx
import { useState } from 'react';
import { useAuthContext } from './AuthProvider';

export function AuthForm() {
  const { signIn, signUp } = useAuthContext();
  const [mode, setMode]       = useState<'login' | 'signup'>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone]       = useState(false);  // signup confirmation state

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'login' ? signIn : signUp;
    const { error: err } = await fn(email, password);
    setLoading(false);
    if (err) { setError(err.message); return; }
    if (mode === 'signup') setDone(true);
    // login success: AuthProvider's onAuthStateChange fires — App re-renders automatically
  };

  // Render a centered card using FJ design tokens
  // Use className tokens matching src/styles/index.css conventions
}
```

### 1.9 Gate the app in `src/App.tsx`

```tsx
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import { AuthForm } from './components/AuthForm';
// ... existing imports

function AppContent() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        {/* spinner or skeleton */}
      </div>
    );
  }

  if (!session) return <AuthForm />;

  // Existing HashRouter + routes unchanged
  return (
    <HashRouter>
      {/* ... existing JSX ... */}
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
```

### 1.10 Update all hooks to stamp `user_id`

Each hook (`useActions.ts`, `useTimeline.ts`, `useHabits.ts`, `useRapidLogs.ts`)
creates new rows. All new rows need `user_id`. Pass `userId: string` as a parameter
to each hook and include it in every `db.<table>.add()` call.

Example pattern for `useActions.ts`:
```typescript
export function useActions(userId: string) {
  // ...
  const add = async (title: string, date: string) => {
    const now = Date.now();
    await db.actions.add({
      uuid: crypto.randomUUID(),
      user_id: userId,   // stamp every new row
      date,
      title,
      is_completed: 0,
      is_top_priority: 0,
      sort_order: now,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    });
  };
  // ...
}
```

The `userId` comes from `useAuthContext().session!.user.id` in whichever component
calls the hook (e.g. the page-level route components). Pass it down.

### 1.11 Update `src/db/sync.ts` to include `user_id` in pushes

```typescript
export async function syncWithSupabase(): Promise<SyncResult> {
  if (!supabase) return { pulled: 0, pushed: 0, conflicts: 0 };

  // Get the authenticated user's id
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  const userId = session.user.id;

  // ... existing pull/apply logic unchanged ...

  // In the push step, stamp user_id on every row:
  const rows = localChanges.map(({ id: _id, ...row }: WithId) => ({
    ...row,
    user_id: userId,  // ensure user_id is set on every pushed row
  }));
  // ... rest of push unchanged ...
}
```

---

## Phase 2 — "Send to Work" in Rapid Log

### 2.1 How sending works

FJ Rapid Log entry → PH Capture:
1. User clicks the "Send to Work" button on a `RapidLogEntry`.
2. FJ calls `sendToProductivityHub()` which reads PH's `user_data` blob for `key='notes'`,
   appends a new note object, and upserts it back. (Single-user; read-modify-write race
   is acceptable for v1.)
3. On success: FJ stamps the local Dexie row with `sent_to_ph: 1, sent_to_ph_at: now`
   and also pushes that update to Supabase via sync.
4. Button becomes disabled with a checkmark — cannot be sent again.

PH note schema (the objects inside the `value` jsonb array of `user_data`):
```
{ id: string, text: string, date: 'YYYY-MM-DD', crAt: string, struck: boolean }
```

### 2.2 Create `src/lib/sendToProductivityHub.ts`

```typescript
import { supabase } from './supabase';

interface PHNote {
  id: string;
  text: string;
  date: string;   // 'YYYY-MM-DD'
  crAt: string;   // ISO timestamp string
  struck: boolean;
}

/**
 * Copies a FJ rapid log body into PH's Capture (user_data notes blob).
 * Reads the current blob, appends, and upserts back.
 * Single-user assumption: read-modify-write race is acceptable for v1.
 */
export async function sendToProductivityHub(
  body: string,
  userId: string,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' };

  // Read current notes blob from PH's user_data table
  const { data, error: fetchErr } = await supabase
    .from('user_data')
    .select('value')
    .eq('user_id', userId)
    .eq('key', 'notes')
    .maybeSingle();  // returns null instead of error when no row found

  if (fetchErr) return { success: false, error: fetchErr.message };

  const existingNotes: PHNote[] = Array.isArray(data?.value) ? data.value : [];
  const today = new Date().toISOString().slice(0, 10);
  const now   = new Date().toISOString();

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
```

### 2.3 Modify `src/components/rapid-log/RapidLogEntry.tsx`

Add a "Send to Work" button that appears alongside the existing trash button.

**Props addition:**
```typescript
interface RapidLogEntryProps {
  entry: RapidLog;
  onDelete: (uuid: string) => void;
  onSendToWork: (entry: RapidLog) => void;  // NEW
  isSending?: boolean;                       // NEW — shows loading state
}
```

**Button JSX** (place before or after the trash button, inside the hover-reveal container):
```tsx
<button
  onClick={() => !entry.sent_to_ph && onSendToWork(entry)}
  disabled={entry.sent_to_ph === 1 || isSending}
  className={[
    'p-1 rounded transition-colors',
    entry.sent_to_ph === 1
      ? 'text-[var(--color-accent)] cursor-default'
      : 'text-[var(--color-foreground-muted)] hover:text-[var(--color-accent)]',
  ].join(' ')}
  aria-label={entry.sent_to_ph === 1 ? 'Already sent to Work' : 'Send to Work'}
  title={entry.sent_to_ph === 1 ? 'Sent to Work' : 'Send to Work'}
>
  {entry.sent_to_ph === 1 ? (
    <CheckIcon width={14} height={14} />
  ) : isSending ? (
    <SpinnerIcon width={14} height={14} />
  ) : (
    <BriefcaseIcon width={14} height={14} />
  )}
</button>
```

Add these inline SVG icon components at the bottom of the file (or in a shared icons file):

```tsx
function BriefcaseIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function CheckIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SpinnerIcon({ width = 16, height = 16 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} className="animate-spin">
      <path d="M21 12a9 9 0 11-6.219-8.56" />
    </svg>
  );
}
```

### 2.4 Wire up send logic in `src/components/rapid-log/RapidLogFeed.tsx`

```tsx
import { useState } from 'react';
import { sendToProductivityHub } from '../../lib/sendToProductivityHub';
import { useAuthContext } from '../AuthProvider';
import { db } from '../../db/database';
import { useToast } from '../ui/ToastContext';

// Inside the component:
const { session } = useAuthContext();
const { showToast } = useToast();           // if Toast API supports this
const [sendingUuid, setSendingUuid] = useState<string | null>(null);

const handleSendToWork = async (entry: RapidLog) => {
  if (!session || entry.sent_to_ph === 1 || sendingUuid) return;
  setSendingUuid(entry.uuid);

  const result = await sendToProductivityHub(entry.body, session.user.id);

  if (result.success) {
    const now = Date.now();
    // Stamp local Dexie row
    await db.rapid_logs
      .where('uuid').equals(entry.uuid)
      .modify({ sent_to_ph: 1, sent_to_ph_at: now, updated_at: now });
    // Toast success
    showToast('Sent to Work');
  } else {
    showToast(`Failed: ${result.error}`);
  }

  setSendingUuid(null);
};

// Pass to each RapidLogEntry:
// onSendToWork={handleSendToWork}
// isSending={sendingUuid === entry.uuid}
```

---

## Phase 3 — Deep-link toggle

### 3.1 Add "Work" link to `src/components/layout/AppShell.tsx`

Locate the header section of AppShell (the top bar with the app title).
Add a link on the right side:

```tsx
const otherAppUrl =
  import.meta.env.VITE_OTHER_APP_URL ||
  'https://jeetbookseller.github.io/productivity/';

// In the header JSX, on the right side of the header bar:
<a
  href={otherAppUrl}
  className="flex items-center gap-1 px-2 py-1 text-xs font-medium
             text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
             transition-colors rounded-lg"
  aria-label="Open Productivity Hub"
>
  <BriefcaseIcon width={14} height={14} />
  <span>Work</span>
</a>
```

Reuse the `BriefcaseIcon` from Phase 2, or inline it here. Open in **same tab**
(`href` with no `target="_blank"`) — both are PWAs and browser history handles
back-navigation correctly. Feels like one continuous app.

Also add a `Sign out` button somewhere accessible (Settings tab or the header).
Use `useAuthContext().signOut()`.

---

## Files changed in this repo

| File | Change |
|------|--------|
| `.env.example` | Add `VITE_OTHER_APP_URL` |
| `supabase/migrations/002_user_scoping.sql` | New — user_id columns + per-user RLS + updated RPC |
| `supabase/migrations/003_rapid_log_sent_flag.sql` | New — sent_to_ph fields on rapid_logs |
| `src/db/models.ts` | Add `user_id` to all interfaces; add `sent_to_ph*` to RapidLog |
| `src/db/database.ts` | Bump Dexie version, add user_id to indexed columns |
| `src/db/sync.ts` | Stamp `user_id` on push; require auth |
| `src/hooks/useAuth.ts` | New — minimal Supabase auth hook |
| `src/hooks/useActions.ts` | Accept `userId` param; stamp on add |
| `src/hooks/useTimeline.ts` | Accept `userId` param; stamp on add |
| `src/hooks/useHabits.ts` | Accept `userId` param; stamp on add |
| `src/hooks/useRapidLogs.ts` | Accept `userId` param; stamp on add |
| `src/components/AuthProvider.tsx` | New — React context wrapper for auth |
| `src/components/AuthForm.tsx` | New — login/signup form using FJ design tokens |
| `src/App.tsx` | Wrap in AuthProvider; gate behind session |
| `src/lib/sendToProductivityHub.ts` | New — read-modify-write PH notes blob |
| `src/components/rapid-log/RapidLogEntry.tsx` | Add send button + icon props |
| `src/components/rapid-log/RapidLogFeed.tsx` | Add send handler + wiring |
| `src/components/layout/AppShell.tsx` | Add `Work` deep-link button |

---

## Testing checklist

- [ ] `npm run build` — zero TypeScript errors
- [ ] `npm test` — all existing tests pass
- [ ] App loads → shows AuthForm (not the journal) when not signed in
- [ ] Sign in with same email/password as PH → journal loads
- [ ] Sign out clears `last_sync_timestamp` from localStorage
- [ ] Rapid Log: add an entry → "Send to Work" button (briefcase icon) visible
- [ ] Click "Send to Work" → spinner shows briefly → checkmark appears, button disabled
- [ ] "Sent to Work" toast appears
- [ ] Open Productivity Hub (same account) → note appears in Capture under today's date
- [ ] Sending fails gracefully (disable network in DevTools) → error toast, no checkmark
- [ ] `Work` header button navigates to PH URL
- [ ] Offline usage still works: add actions/habits/rapid logs without network → data persists in Dexie
- [ ] Sync still works: sign out, sign back in, trigger sync → data reappears
- [ ] Second test account cannot see first account's data (RLS verification)
