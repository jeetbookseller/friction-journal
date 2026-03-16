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

---

## Redesign Work Packages (Parallelizable)

### Design Goals
- **Aesthetic:** Minimal + Clean (Notion/Things 3 style) — whitespace, crisp typography, subtle shadows
- **Theme:** Auto dark/light mode via `prefers-color-scheme` media query + CSS custom properties
- **Scope:** Visual polish + new shared UI components (toasts, empty states, skeletons, animations)
- **Constraints:** No new npm dependencies. All existing hooks/business logic untouched. Only visual/component layer changes.

---

### RWP-0: Design System & Shared UI Components
**Priority:** Must be done FIRST (all other RWPs depend on this)
**Estimated scope:** ~7 files

**Deliverables:**

1. `src/styles/index.css` — Full design system:
   - Tailwind CSS 4 `@theme` directive registering semantic color tokens as utilities (`bg-surface`, `text-on-surface`, `shadow-card`, etc.)
   - `:root` CSS custom properties for light mode palette (white surfaces, indigo-600 accent, subtle gray borders)
   - `@media (prefers-color-scheme: dark)` block swapping to dark palette (deep navy #0f0f17/#1a1a2e, indigo-400 accent)
   - Semantic tokens: `--surface`, `--surface-raised`, `--surface-overlay`, `--border`, `--border-subtle`, `--on-surface`, `--on-surface-muted`, `--on-surface-faint`, `--accent`, `--accent-hover`, `--accent-subtle`, `--on-accent`, `--success`, `--success-subtle`, `--warning`, `--warning-subtle`, `--danger`, `--danger-subtle`, `--tag-note`, `--tag-note-subtle`, `--tag-event`, `--tag-event-subtle`, `--tag-mood`, `--tag-mood-subtle`, `--nav-bg`, `--nav-active`, `--nav-inactive`
   - Shadow tokens: `--sh-card`, `--sh-card-hover`, `--sh-nav`
   - Keyframe animations: `fade-in`, `slide-up`, `toast-in`, `toast-out`, `dot-pop` + utility classes
   - Custom checkbox CSS (`.custom-checkbox`) — styled appearance:none with accent color checkmark
   - Body base styles: system font stack, antialiasing, `background-color: var(--surface)`

2. `src/components/ui/ToastContext.tsx` — React context + provider:
   - `showToast(message: string)` function via context
   - Fixed pill at bottom-center (above nav), auto-dismiss 3s
   - `animate-toast-in` / `animate-toast-out` CSS animations
   - Queue management for multiple toasts

3. `src/components/ui/EmptyState.tsx` — Reusable empty state:
   - Props: `icon` (ReactNode SVG), `title`, `description`
   - Centered column with muted styling and `animate-fade-in`

4. `src/components/ui/Card.tsx` — Card wrapper:
   - `bg-surface-raised rounded-xl shadow-card` with hover shadow transition

5. `src/components/ui/AnimatedList.tsx` — Staggered animation wrapper:
   - Clones children with incrementing `animation-delay` (50ms per item)

6. `src/components/ui/Skeleton.tsx` — Loading placeholder:
   - `animate-pulse rounded bg-surface-overlay` with configurable className

7. `index.html` — Update:
   - Add `class="bg-surface"` to `<body>`
   - Replace single `<meta name="theme-color">` with two (light/dark media variants)

**Interfaces/exports other RWPs consume:**
- All `bg-*`, `text-*`, `border-*`, `shadow-*` semantic utility classes from @theme
- `<ToastProvider>`, `useToast()` from ToastContext
- `<EmptyState>`, `<Card>`, `<AnimatedList>`, `<Skeleton>` components

---

### RWP-1: AppShell & App.tsx Redesign
**Depends on:** RWP-0 (design tokens + ToastProvider)
**Can parallel with:** RWP-2, RWP-3, RWP-4, RWP-5

**Files to modify:**
- `src/components/layout/AppShell.tsx`
- `src/App.tsx`

**Deliverables:**

1. **Top header bar** — "Friction Journal" in `text-sm font-semibold tracking-wide text-on-surface-muted uppercase`, `border-b border-border bg-surface`

2. **Bottom nav redesign:**
   - Background: `bg-nav-bg shadow-nav border-t border-border`
   - 4 inline SVG icons (check, calendar, target, pen) defined in-file — `width="20" height="20"`, `stroke="currentColor"`, `strokeWidth="1.5"`
   - Vertical stack: icon above label per tab
   - Active: `text-nav-active` + small animated dot indicator
   - Inactive: `text-nav-inactive`
   - `transition-colors duration-150` on all links

3. **App.tsx** — Wrap route content with `<ToastProvider>`

---

### RWP-2: Actions Tab Redesign
**Depends on:** RWP-0 (tokens + shared components)
**Can parallel with:** RWP-1, RWP-3, RWP-4, RWP-5

**Files to modify:**
- `src/components/actions/ActionList.tsx`
- `src/components/actions/ActionItem.tsx`
- `src/components/actions/AddActionForm.tsx`

**Deliverables:**

1. **ActionList.tsx:**
   - Date in `text-xl font-semibold text-on-surface`, priority count as `bg-accent-subtle text-accent rounded-full` pill
   - `<EmptyState>` with checkbox SVG, "No actions yet"
   - `<AnimatedList>` wrapper, `<Card>` per item
   - `<Skeleton>` fallback when useLiveQuery returns undefined
   - Toast notifications on add/delete via `useToast()`
   - Root div gets `animate-fade-in` for page transition

2. **ActionItem.tsx:**
   - `.custom-checkbox` class instead of default checkbox
   - SVG star icon for priority (filled `text-warning`, empty `text-on-surface-faint`)
   - SVG trash icon for delete — `opacity-0 group-hover:opacity-100` on desktop
   - Token colors: `text-on-surface`, completed = `line-through text-on-surface-faint`, priority = `font-semibold`

3. **AddActionForm.tsx:**
   - Input: `bg-surface-raised border-border rounded-lg focus:ring-2 focus:ring-accent/30 focus:border-accent`
   - Button: `bg-accent text-on-accent rounded-lg hover:bg-accent-hover active:scale-95`

---

### RWP-3: Timeline Tab Redesign
**Depends on:** RWP-0 (tokens)
**Can parallel with:** RWP-1, RWP-2, RWP-4, RWP-5

**Files to modify:**
- `src/components/timeline/TimelineView.tsx`
- `src/components/timeline/TimelineDay.tsx`

**Deliverables:**

1. **TimelineView.tsx:**
   - Sticky header: `bg-surface sticky top-0 z-10 border-b border-border`
   - SVG chevron icons for prev/next buttons
   - `hover:bg-surface-overlay transition-colors` on nav buttons
   - Root div gets `animate-fade-in`

2. **TimelineDay.tsx:**
   - Today: `bg-accent-subtle rounded-lg mx-2 my-1` (soft highlight, not ring)
   - Days with notes: `border-l-2 border-accent` left accent
   - Date label split: bold day number + faint day name
   - Row hover: `hover:bg-surface-overlay transition-colors`
   - All colors token-based

---

### RWP-4: Habits Tab Redesign
**Depends on:** RWP-0 (tokens + shared components)
**Can parallel with:** RWP-1, RWP-2, RWP-3, RWP-5

**Files to modify:**
- `src/components/habits/HabitTracker.tsx`
- `src/components/habits/HabitCard.tsx`
- `src/components/habits/AddHabitForm.tsx`

**Deliverables:**

1. **HabitTracker.tsx:**
   - Header: `text-xl font-semibold`, slot count as accent pill badge
   - `<EmptyState>` with target SVG, "No active habits"
   - `<Card className="mb-3 mx-4">` per habit
   - Root div gets `animate-fade-in`

2. **HabitCard.tsx:**
   - Completion dots → rounded squares `w-3 h-3 rounded-sm` (`bg-success` / `bg-surface-overlay`)
   - Test Run badge: `rounded-full bg-warning-subtle text-warning`
   - Today button: done = `bg-success`, not done = `bg-surface-overlay hover:bg-accent-subtle`
   - `active:scale-[0.98]` press feedback

3. **AddHabitForm.tsx:**
   - Token-based input/button styling
   - Cap warning: `bg-warning-subtle text-warning rounded-lg px-3 py-2`

---

### RWP-5: Rapid Log Tab Redesign
**Depends on:** RWP-0 (tokens + shared components)
**Can parallel with:** RWP-1, RWP-2, RWP-3, RWP-4

**Files to modify:**
- `src/components/rapid-log/RapidLogFeed.tsx`
- `src/components/rapid-log/RapidLogEntry.tsx`
- `src/components/rapid-log/AddRapidLogForm.tsx`

**Deliverables:**

1. **RapidLogFeed.tsx:**
   - Sticky filter header: `bg-surface sticky top-0 z-10 border-b border-border`
   - Chips: `rounded-full`, active = `bg-accent text-on-accent`, inactive = `bg-surface-overlay text-on-surface-muted`
   - `<EmptyState>` with pen SVG, "No log entries yet"
   - `<AnimatedList>` wrapper
   - Root div gets `animate-fade-in`

2. **RapidLogEntry.tsx:**
   - Tag pills: `rounded-full` with token colors (`bg-tag-note-subtle text-tag-note`, `bg-tag-event-subtle text-tag-event`, `bg-tag-mood-subtle text-tag-mood`)
   - Delete: SVG trash, `opacity-0 group-hover:opacity-100`

3. **AddRapidLogForm.tsx:**
   - Tag selectors: tag-specific active colors (`bg-tag-note`, `bg-tag-event`, `bg-tag-mood`)
   - Same input/button token treatment as other forms

---

### Redesign Execution Order

```
Agent 1: RWP-0 (Design System + Shared UI) ← DO THIS FIRST
              ↓
    ┌─────────┼─────────┬─────────┬─────────┐
    ↓         ↓         ↓         ↓         ↓
  RWP-1     RWP-2     RWP-3     RWP-4     RWP-5
  AppShell  Actions   Timeline  Habits    RapidLog
```

- **RWP-0** must complete first (creates tokens + shared components all others import)
- **RWP-1 through RWP-5** are fully independent and can run in parallel
- Each agent should be told: "RWP-0 is complete. Use semantic token classes (`bg-surface`, `text-on-surface`, etc.) and import shared components from `src/components/ui/`."

### Redesign Merge Strategy

Each RWP writes to its own set of files (no overlap):
- RWP-0: `src/styles/index.css`, `src/components/ui/*`, `index.html`
- RWP-1: `src/components/layout/AppShell.tsx`, `src/App.tsx`
- RWP-2: `src/components/actions/*`
- RWP-3: `src/components/timeline/*`
- RWP-4: `src/components/habits/*`
- RWP-5: `src/components/rapid-log/*`

### Redesign Verification

After all RWPs merge:
1. `npm run build` — zero TS errors
2. `npm run dev` — app loads, auto-detects system theme
3. Toggle OS dark/light mode — all colors switch seamlessly
4. All 4 tabs: correct empty states, loading skeletons, token-based colors
5. Add/delete actions → toast appears and auto-dismisses
6. Animations: staggered list fade-in, button press feedback, nav transitions
7. Keyboard nav: focus-visible outlines on all interactive elements
