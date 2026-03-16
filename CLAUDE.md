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
├── App.tsx                           # HashRouter with 4 routes + layout, wrapped in ToastProvider
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
│   ├── ui/                           # Shared design system components (RWP-0)
│   │   ├── ToastContext.tsx          # Toast notifications context + provider (auto-dismiss 3s)
│   │   ├── EmptyState.tsx            # Reusable empty state with icon/title/description
│   │   ├── Card.tsx                  # Surface-raised card wrapper with hover shadow
│   │   ├── AnimatedList.tsx          # Staggered animation wrapper (50ms delay per child)
│   │   └── Skeleton.tsx              # Animated loading placeholder
│   ├── layout/AppShell.tsx           # Header bar + bottom tab nav with SVG icons
│   ├── actions/
│   │   ├── ActionList.tsx            # Today's action list with priority counter
│   │   ├── ActionItem.tsx            # Custom checkbox, SVG star/trash, token colors
│   │   └── AddActionForm.tsx         # Single-line input for new actions
│   ├── timeline/
│   │   ├── TimelineView.tsx          # Month view with SVG chevron nav, sticky header
│   │   └── TimelineDay.tsx           # Day row with accent highlight + inline editing
│   ├── habits/
│   │   ├── HabitTracker.tsx          # Active habits list with slot indicator + empty state
│   │   ├── HabitCard.tsx             # Rounded-square dots, test run badge, success colors
│   │   └── AddHabitForm.tsx          # New habit input with cap warning
│   └── rapid-log/
│       ├── RapidLogFeed.tsx          # Sticky filter chips, chronological feed, empty state
│       ├── RapidLogEntry.tsx         # Tag-colored pills, SVG trash, hover delete
│       └── AddRapidLogForm.tsx       # Tag selector + text input with token colors
├── lib/
│   ├── constants.ts                  # MAX_TOP_PRIORITIES=3, MAX_ACTIVE_HABITS=3, TEST_RUN_DAYS=7, TAG_OPTIONS
│   └── dates.ts                      # todayString(), getMonthRange(), daysActiveCount()
└── styles/
    └── index.css                     # Full design system: Tailwind @theme tokens, dark/light mode, animations

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

All work packages and redesign work packages are **complete**:

### Core Work Packages
- [x] **WP-0:** Project scaffolding & shared infrastructure
- [x] **WP-1:** Daily Action List (hooks, components, priority cap logic)
- [x] **WP-2:** Reality Timeline (month navigation, upsert, inline editing)
- [x] **WP-3:** Minimalist Habit Tracker (active cap, test run badge, day dots)
- [x] **WP-4:** Contextual Rapid Logging (tag filtering, chronological feed)
- [x] **WP-5:** Supabase SQL migrations & sync stub
- [x] **WP-6:** PWA configuration & GitHub Pages deployment workflow

### Redesign Work Packages
- [x] **RWP-0:** Design system (`src/styles/index.css` with `@theme` tokens, dark/light mode via `prefers-color-scheme`, animations, custom checkbox) + shared UI components (`ToastContext`, `EmptyState`, `Card`, `AnimatedList`, `Skeleton`) + `index.html` theme-color meta tags
- [x] **RWP-1:** AppShell redesign (top header bar, SVG bottom nav icons, active dot indicator) + App.tsx wrapped in `<ToastProvider>`
- [x] **RWP-2:** Actions tab (custom checkboxes, SVG star/trash icons, token-based colors, toasts on add/delete, empty states, skeletons)
- [x] **RWP-3:** Timeline tab (sticky header with SVG chevrons, accent highlight for today, left border for days with notes)
- [x] **RWP-4:** Habits tab (rounded-square completion dots, warning badge for test run, success/accent button colors)
- [x] **RWP-5:** Rapid Log tab (tag-colored pills, sticky filter chips, hover-reveal delete, empty states)

## Verification Checklist

### Functional
1. `npm run build` — zero TS errors, zero warnings
2. `npm run dev` — app loads, all 4 tabs navigate correctly
3. **Actions tab:** Add 3 actions, mark 3 as priority (4th blocked), complete one, verify no rollover to next day
4. **Timeline tab:** See all days of current month, add events to 2-3 days, verify one-per-day
5. **Habits tab:** Add 3 habits (4th blocked), toggle today's completion, verify Test Run badge on new habits
6. **Rapid Log tab:** Add entries with each tag, filter by tag, verify chronological order
7. **Offline:** Kill network in DevTools, verify all CRUD still works
8. `npm run build` output in `dist/` is a valid static site for GH Pages

### Redesign
9. `npm run dev` — app auto-detects system theme (dark/light) via `prefers-color-scheme`
10. Toggle OS dark/light mode — all colors switch seamlessly (no hard-coded colors remain)
11. All 4 tabs: empty states display correctly when no data, skeletons show during load
12. Add/delete actions → toast appears at bottom-center and auto-dismisses after 3s
13. Animations: staggered list fade-in on page load, button press `active:scale-95` feedback, nav transitions
14. Keyboard nav: `focus-visible` outlines visible on all interactive elements

---

## Future Phases

- **Supabase sync** — implement `src/db/sync.ts` stub using the `supabase/migrations/001_initial_schema.sql` schema (RLS, triggers, `pull_changes` RPC). Requires Supabase project setup and auth.
- **Auth (v2)** — user authentication layer before enabling multi-device sync.
