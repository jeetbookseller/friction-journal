# The Friction Journal

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
| Testing | Vitest + Testing Library + fake-indexeddb |
| Future sync | Supabase PostgreSQL |

## Project Structure

```
src/
├── main.tsx                          # App entry point
├── App.tsx                           # HashRouter with 4 routes + layout
├── db/
│   ├── models.ts                     # TypeScript interfaces (Action, TimelineEvent, Habit, HabitLog, RapidLog)
│   ├── database.ts                   # Dexie instance with schema for all 5 tables
│   └── sync.ts                       # Supabase sync stub (future)
├── hooks/
│   ├── useActions.ts                 # CRUD for daily actions (date-scoped, priority cap)
│   ├── useTimeline.ts                # CRUD for timeline events (month queries, upsert)
│   ├── useHabits.ts                  # CRUD for habits + habit logs (active cap, test run)
│   └── useRapidLogs.ts              # CRUD for rapid log entries (tag filter, soft delete)
├── components/
│   ├── layout/AppShell.tsx           # Main layout with bottom tab navigation
│   ├── actions/
│   │   ├── ActionList.tsx            # Today's action list with priority counter
│   │   ├── ActionItem.tsx            # Checkbox, priority toggle, delete
│   │   └── AddActionForm.tsx         # Single-line input for new actions
│   ├── timeline/
│   │   ├── TimelineView.tsx          # Month view with prev/next navigation
│   │   └── TimelineDay.tsx           # Day row with inline event editing
│   ├── habits/
│   │   ├── HabitTracker.tsx          # Active habits list with slot indicator
│   │   ├── HabitCard.tsx             # Habit with test run badge + day dots
│   │   └── AddHabitForm.tsx          # New habit input (blocked at cap)
│   └── rapid-log/
│       ├── RapidLogFeed.tsx          # Chronological feed with tag filters
│       ├── RapidLogEntry.tsx         # Tag pill, body, timestamp, delete
│       └── AddRapidLogForm.tsx       # Tag selector + text input
├── lib/
│   ├── constants.ts                  # MAX_TOP_PRIORITIES=3, MAX_ACTIVE_HABITS=3, TEST_RUN_DAYS=7, TAG_OPTIONS
│   └── dates.ts                      # todayString(), getMonthRange(), daysActiveCount()
└── styles/
    └── index.css                     # Tailwind imports

supabase/
└── migrations/
    └── 001_initial_schema.sql        # PostgreSQL schema with RLS, triggers, indexes, pull_changes RPC

.github/
└── workflows/
    └── deploy.yml                    # GitHub Actions: build & deploy to gh-pages

public/
├── manifest.json                     # PWA manifest
└── icons/                            # 192x192 and 512x512 app icons
```

## Key Data Models

Defined in `src/db/models.ts`:

- **Action** — Daily task with `is_completed`, `is_top_priority`, `sort_order`, scoped by `date`
- **TimelineEvent** — One note per day (unique `date` index), month-navigable
- **Habit** — Max 3 active (`is_active` cap), with 7-day "Test Run" badge
- **HabitLog** — Daily completion per habit, compound index `[habit_uuid+date]`
- **RapidLog** — Tagged entries (`note` | `event` | `mood`), chronological feed

All models use soft deletes (`deleted_at`) for future sync compatibility and UUIDs for cross-device identity.

## Business Logic Constraints

- **Actions:** Max 3 top priorities per day. No rollover — queries scoped to exact date.
- **Habits:** Max 3 active habits. Test Run badge auto-shown for first 7 days.
- **Timeline:** One entry per day enforced by unique Dexie index. Upsert via `put()`.
- **Rapid Log:** Tags restricted to `note` | `event` | `mood`. Body max ~280 chars.

## Scripts

```bash
npm run dev        # Start dev server
npm run build      # TypeScript check + Vite build
npm run preview    # Preview production build
npm run test       # Run Vitest test suite
npm run test:watch # Run tests in watch mode
```

## Implementation Status

All work packages are **complete**:

- [x] **WP-0:** Project scaffolding & shared infrastructure
- [x] **WP-1:** Daily Action List (hooks, components, priority cap logic)
- [x] **WP-2:** Reality Timeline (month navigation, upsert, inline editing)
- [x] **WP-3:** Minimalist Habit Tracker (active cap, test run badge, day dots)
- [x] **WP-4:** Contextual Rapid Logging (tag filtering, chronological feed)
- [x] **WP-5:** Supabase SQL migrations & sync stub
- [x] **WP-6:** PWA configuration & GitHub Pages deployment workflow

## Verification Checklist

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
