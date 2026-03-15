# The Friction Journal — Parallelized Implementation Plan

## Context

Offline-first personal journaling web app enforcing analog Bullet Journal friction. Deployed as a static SPA to GitHub Pages. No auth for v1 — Supabase sync is a future phase.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite + TypeScript |
| Offline DB | Dexie.js (IndexedDB) + dexie-react-hooks |
| Styling | Tailwind CSS 4 |
| Routing | React Router v7 (HashRouter for GH Pages) |
| Dates | date-fns |
| PWA | vite-plugin-pwa |
| Future sync | Supabase PostgreSQL |

---

## Work Packages (Parallelizable)

Each package is **fully independent** and can be implemented by a separate agent or in a separate session. Dependencies between packages are minimal — they connect through well-defined interfaces (TypeScript types + Dexie DB instance).

---

### WP-0: Project Scaffolding & Shared Infrastructure
**Priority:** Must be done FIRST (all other WPs depend on this)
**Estimated scope:** ~10 files

**Deliverables:**
1. `package.json` — Vite + React + TS project with all deps
2. `vite.config.ts` — configured with Tailwind plugin, PWA plugin, `base` for GH Pages
3. `tsconfig.json` + `tsconfig.app.json` — strict TS config
4. `tailwind.config.ts` — minimal config
5. `index.html` — app shell
6. `src/main.tsx` — entry point
7. `src/App.tsx` — HashRouter with 4 routes (Actions `/`, Timeline `/timeline`, Habits `/habits`, Log `/log`) + layout wrapper
8. `src/styles/index.css` — Tailwind imports
9. `src/db/models.ts` — ALL TypeScript interfaces (shared contract for all WPs)
10. `src/db/database.ts` — Dexie instance with complete schema for all 5 tables
11. `src/lib/constants.ts` — `MAX_TOP_PRIORITIES = 3`, `MAX_ACTIVE_HABITS = 3`, `TEST_RUN_DAYS = 7`, `TAG_OPTIONS`
12. `src/lib/dates.ts` — `todayString()`, `getMonthRange(year, month)`, `daysActiveCount(createdAt)`
13. `src/components/layout/AppShell.tsx` — main layout with bottom tab nav
14. `public/manifest.json` — PWA manifest

**Interfaces defined here that other WPs consume:**
```typescript
// src/db/models.ts
export interface Action {
  id?: number;
  uuid: string;
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
  date: string;          // Unique — one per day
  note: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface Habit {
  id?: number;
  uuid: string;
  name: string;
  is_active: 0 | 1;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}

export interface HabitLog {
  id?: number;
  uuid: string;
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
  tag: 'note' | 'event' | 'mood';
  body: string;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
}
```

```typescript
// src/db/database.ts — Dexie schema
db.version(1).stores({
  actions:         '++id, uuid, date, is_top_priority, deleted_at',
  timeline_events: '++id, uuid, &date, deleted_at',
  habits:          '++id, uuid, is_active, deleted_at',
  habit_logs:      '++id, uuid, habit_uuid, date, [habit_uuid+date], deleted_at',
  rapid_logs:      '++id, uuid, tag, created_at, deleted_at',
});
```

---

### WP-1: Daily Action List Feature
**Depends on:** WP-0 (types + DB instance)
**Can parallel with:** WP-2, WP-3, WP-4, WP-5

**Deliverables:**
1. `src/hooks/useActions.ts`
   - `useActionsForDate(date: string)` — live query filtering by exact date, excluding soft-deleted
   - `addAction(date, title)` — insert with UUID, timestamp, sort_order
   - `toggleComplete(id)` — flip is_completed
   - `togglePriority(id)` — flip is_top_priority **with cap check**: count priorities for that date, reject if >= 3
   - `deleteAction(id)` — soft delete (set deleted_at)
   - `reorderActions(ids: number[])` — update sort_order

2. `src/components/actions/ActionList.tsx`
   - Uses `useLiveQuery()` with `useActionsForDate(todayString())`
   - **NO rollover logic** — only queries exact today's date
   - Date display header showing current date
   - Priority count indicator (e.g., "2/3 priorities used")

3. `src/components/actions/ActionItem.tsx`
   - Checkbox for completion
   - Star/flag toggle for priority (disabled when cap reached and item is not already priority)
   - Swipe-to-delete or delete button
   - Visual distinction for priority items (bold, accent color)
   - Strikethrough for completed items

4. `src/components/actions/AddActionForm.tsx`
   - Single-line text input
   - Submit adds action for today's date only
   - Optional priority toggle on creation

**Business logic constraints enforced:**
- Query scoped to exact date string — no rollover by design
- Priority toggle checks: `db.actions.where({date, is_top_priority: 1}).count() < 3`
- All mutations go through hook functions that enforce constraints before DB writes

---

### WP-2: Reality Timeline Feature
**Depends on:** WP-0 (types + DB instance)
**Can parallel with:** WP-1, WP-3, WP-4, WP-5

**Deliverables:**
1. `src/hooks/useTimeline.ts`
   - `useTimelineForMonth(year: number, month: number)` — live query for all events in month range
   - `upsertEvent(date: string, note: string)` — insert or update (leveraging unique date index)
   - Returns a `Map<string, TimelineEvent>` keyed by date for O(1) lookup

2. `src/components/timeline/TimelineView.tsx`
   - Month/year header with prev/next month navigation
   - Generates array of all dates in current month using `getMonthRange()`
   - Renders vertical scrolling list (NOT a grid calendar)
   - Each day rendered as a row regardless of whether it has data

3. `src/components/timeline/TimelineDay.tsx`
   - Date label (day number + day name, e.g., "15 Sun")
   - If event exists: display note text, tap to edit inline
   - If no event: show placeholder input field
   - Single-line text input only (no multiline)
   - Visual distinction for today's row
   - Past/future day visual dimming

**Business logic constraints enforced:**
- Unique index `&date` on Dexie prevents duplicate entries at DB level
- UI uses `put()` (upsert) so editing existing day replaces, not duplicates
- Single-line input (`<input>` not `<textarea>`)

---

### WP-3: Minimalist Habit Tracker Feature
**Depends on:** WP-0 (types + DB instance)
**Can parallel with:** WP-1, WP-2, WP-4, WP-5

**Deliverables:**
1. `src/hooks/useHabits.ts`
   - `useActiveHabits()` — live query for `is_active = 1`, excluding soft-deleted
   - `useHabitLogs(habitUuid: string, startDate: string, endDate: string)` — logs for date range
   - `addHabit(name)` — **cap check**: count active habits, reject if >= 3
   - `deactivateHabit(id)` — set `is_active = 0`
   - `reactivateHabit(id)` — **cap check** then set `is_active = 1`
   - `toggleHabitLog(habitUuid, date)` — toggle daily completion
   - `isTestRun(habit)` — `Date.now() - habit.created_at <= 7 * 86400000`

2. `src/components/habits/HabitTracker.tsx`
   - Lists active habits (max 3)
   - Shows slot indicator (e.g., "2/3 habit slots used")
   - Last 7 or 14 days completion dots per habit
   - "Add Habit" button (disabled when 3 active)

3. `src/components/habits/HabitCard.tsx`
   - Habit name with "Test Run" badge (auto-calculated, shown when <= 7 days old)
   - Row of day-dots for recent completion history
   - Today's toggle button (large, tappable)
   - Deactivate/archive action

4. `src/components/habits/AddHabitForm.tsx`
   - Single text input for habit name
   - Submit blocked if 3 active habits exist
   - Clear error message explaining the cap

**Business logic constraints enforced:**
- Active count check before insert: `db.habits.where({is_active: 1}).count() < 3`
- Test Run badge: pure function comparing `created_at` to `Date.now()`
- HabitLog unique per `[habit_uuid+date]` compound index

---

### WP-4: Contextual Rapid Logging Feature
**Depends on:** WP-0 (types + DB instance)
**Can parallel with:** WP-1, WP-2, WP-3, WP-5

**Deliverables:**
1. `src/hooks/useRapidLogs.ts`
   - `useRapidLogs(filter?: 'note' | 'event' | 'mood')` — live query, chronological, excluding soft-deleted
   - `addRapidLog(tag, body)` — insert with validation
   - `deleteRapidLog(id)` — soft delete

2. `src/components/rapid-log/RapidLogFeed.tsx`
   - Vertical chronological feed (newest first or oldest first — configurable)
   - Tag filter chips at top: All | Note | Event | Mood
   - Infinite scroll or "load more" pattern
   - Input form pinned at bottom

3. `src/components/rapid-log/RapidLogEntry.tsx`
   - Tag indicator (color-coded pill: note=blue, event=green, mood=purple)
   - Single-sentence body text
   - Relative timestamp (e.g., "2h ago", "Yesterday")
   - Delete action

4. Input form:
   - Tag selector (3 buttons/chips, one must be selected)
   - Single-line text input (max ~280 chars)
   - Submit button

**Business logic constraints enforced:**
- Tag restricted to TypeScript union type + UI selector (no free-text tags)
- Body length validation at hook level
- Single-line input enforced via `<input>` element

---

### WP-5: Supabase SQL Migrations & Sync Stub
**Depends on:** WP-0 (types only, for reference)
**Can parallel with:** WP-1, WP-2, WP-3, WP-4

**Deliverables:**
1. `supabase/migrations/001_initial_schema.sql`
   - All 5 tables with proper types, constraints, foreign keys
   - RLS enabled on all tables with user-scoped policies
   - `updated_at` auto-trigger on all tables
   - Indexes on `updated_at` for efficient sync pulls
   - `pull_changes` RPC function for sync

2. `src/db/sync.ts`
   - Stub/scaffold for future Supabase sync
   - Exported `syncWithSupabase()` function (no-op for now, with TODO comments)
   - Documents the LWW sync protocol in code comments
   - Outlines the pull → apply → push → confirm flow

3. Sync architecture documentation as code comments explaining:
   - Last-write-wins strategy and why it was chosen
   - Alternative: field-level merge (described, not implemented)
   - The `deleted_at` soft-delete pattern for sync consistency

---

### WP-6: PWA & GitHub Pages Deployment
**Depends on:** WP-0 (vite config)
**Can parallel with:** WP-1, WP-2, WP-3, WP-4, WP-5

**Deliverables:**
1. `vite.config.ts` updates for `vite-plugin-pwa` (icons, service worker config)
2. `public/manifest.json` — app name, icons, theme color, display: standalone
3. `.github/workflows/deploy.yml` — GitHub Actions workflow:
   - Trigger: push to main
   - Steps: checkout → setup node → install → build → deploy to gh-pages branch
4. Offline capability verification notes

---

## Execution Order

```
Session/Agent 1: WP-0 (Scaffolding) ← DO THIS FIRST
         ↓
    ┌────┼────┬────┬────┬────┐
    ↓    ↓    ↓    ↓    ↓    ↓
  WP-1 WP-2 WP-3 WP-4 WP-5 WP-6
  Actions Timeline Habits RapidLog SQL  PWA/Deploy
```

- **WP-0** must complete first (creates shared files all others import)
- **WP-1 through WP-6** are fully independent and can run in parallel
- Each WP agent should be told: "WP-0 is already complete. Import types from `src/db/models.ts`, DB from `src/db/database.ts`, helpers from `src/lib/`."

## Merge Strategy

Each WP writes to its own set of files (no overlap):
- WP-1: `src/hooks/useActions.ts`, `src/components/actions/*`
- WP-2: `src/hooks/useTimeline.ts`, `src/components/timeline/*`
- WP-3: `src/hooks/useHabits.ts`, `src/components/habits/*`
- WP-4: `src/hooks/useRapidLogs.ts`, `src/components/rapid-log/*`
- WP-5: `supabase/*`, `src/db/sync.ts`
- WP-6: `.github/*`, `public/manifest.json`, vite config updates

**One shared file needs integration after all WPs:** `src/App.tsx` — each feature WP creates its page component, and App.tsx routes need to import them. This is a trivial 4-line integration step after all WPs merge.

---

## Verification

After all WPs merge:
1. `npm run build` — zero TS errors, zero warnings
2. `npm run dev` — app loads, all 4 tabs navigate correctly
3. **Actions tab:** Add 3 actions, mark 3 as priority (4th blocked), complete one, verify no rollover to next day
4. **Timeline tab:** See all days of current month, add events to 2-3 days, verify one-per-day
5. **Habits tab:** Add 3 habits (4th blocked), toggle today's completion, verify Test Run badge on new habits
6. **Rapid Log tab:** Add entries with each tag, filter by tag, verify chronological order
7. **Offline:** Kill network in DevTools, verify all CRUD still works
8. `npm run build` output in `dist/` is a valid static site for GH Pages
