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
