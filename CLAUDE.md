# The Friction Journal

## Context

Offline-first personal journaling web app enforcing analog Bullet Journal friction. Deployed as a static SPA to GitHub Pages. Uses Supabase for authentication and cross-device sync, sharing the same Supabase project as Productivity Hub.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite + TypeScript |
| Offline DB | Dexie.js (IndexedDB) + dexie-react-hooks |
| Styling | Tailwind CSS 4 |
| Routing | React Router v7 (HashRouter for GH Pages) |
| Dates | date-fns |
| PWA | vite-plugin-pwa |
| Testing | Vitest + Testing Library + fake-indexeddb |
| Sync | Supabase PostgreSQL + `@supabase/supabase-js` |

## Project Structure

```
src/
├── main.tsx
├── App.tsx                           # HashRouter with 5 routes + layout, wrapped in AuthProvider + ToastProvider
├── db/
│   ├── models.ts                     # TypeScript interfaces (Action, TimelineEvent, Habit, HabitLog, RapidLog)
│   ├── database.ts                   # Dexie instance with schema for all 5 tables (v3 backfills habits.details)
│   ├── sync.ts                       # Supabase LWW sync (pull → apply → push → confirm); stamps user_id on push
│   └── reset.ts                      # softDeleteAllData / resetAllData (tombstone all tables + sync)
├── hooks/
│   ├── useAuth.ts                    # Supabase auth hook (session, signIn, signUp, signOut)
│   ├── useActions.ts                 # CRUD for daily actions (date-scoped, priority cap); accepts userId param
│   ├── useTimeline.ts                # CRUD for timeline events (month queries, upsert); accepts userId param
│   ├── useHabits.ts                  # CRUD for habits + habit logs (details edit, soft delete, active cap, test run)
│   ├── useRapidLogs.ts               # CRUD for rapid log entries (tag filter, body edit, soft delete)
│   └── useMetrics.ts                 # gatherMetrics + useMetrics: per-day actions/habits/timeline aggregation
├── components/
│   ├── AuthProvider.tsx              # Auth context + useAuthContext()
│   ├── AuthForm.tsx                  # Login / signup form using FJ design tokens
│   ├── ui/
│   │   ├── Modal.tsx                 # Shared dialog (backdrop + Escape close), used by habits delete / export / reset
│   │   ├── ToastContext.tsx          # Toast notifications context + provider (auto-dismiss 3s)
│   │   ├── EmptyState.tsx            # Reusable empty state with icon/title/description
│   │   ├── Card.tsx                  # Surface-raised card wrapper with hover shadow
│   │   ├── AnimatedList.tsx          # Staggered animation wrapper (50ms delay per child)
│   │   └── Skeleton.tsx              # Animated loading placeholder
│   ├── layout/AppShell.tsx           # Header bar + bottom tab nav + Work deep-link to Productivity Hub
│   ├── actions/
│   │   ├── ActionList.tsx
│   │   ├── ActionItem.tsx
│   │   └── AddActionForm.tsx
│   ├── timeline/
│   │   ├── TimelineView.tsx
│   │   └── TimelineDay.tsx
│   ├── habits/
│   │   ├── HabitTracker.tsx
│   │   ├── HabitCard.tsx
│   │   └── AddHabitForm.tsx
│   ├── rapid-log/
│   │   ├── RapidLogFeed.tsx          # Weekly collapsible sections + day headers; Send to Work logic
│   │   ├── RapidLogEntry.tsx         # Tag-colored pills, click-to-edit body, trash, Send to Work button
│   │   └── AddRapidLogForm.tsx
│   └── metrics/
│       ├── MetricsView.tsx           # /metrics page: week/month toggle, prev/next nav (5 yr), export + reset
│       ├── MetricsTable.tsx          # Days × (Actions, per-habit ✓, Timeline) table
│       ├── ExportCsvDialog.tsx       # Date-range picker → CSV download (asked every export)
│       └── ResetDataDialog.tsx       # Type-DELETE gate, export-first option, calls resetAllData()
├── lib/
│   ├── constants.ts                  # MAX_TOP_PRIORITIES=3, MAX_ACTIVE_HABITS=3, TEST_RUN_DAYS=7, TAG_OPTIONS
│   ├── dates.ts                      # todayString(), getMonthRange(), week helpers (Sunday start), day labels
│   ├── csv.ts                        # gatherCsvData/buildCsv/downloadCsv (date,actions,habits ✓,timeline,rapid logs)
│   ├── sendToProductivityHub.ts      # Read-modify-write PH’s user_data notes blob via shared Supabase client
│   └── supabase.ts                   # Supabase client singleton (null when env vars absent)
└── styles/
    └── index.css                     # Full design system: Tailwind @theme tokens, dark/light mode, animations

supabase/
└── migrations/
    ├── 001_initial_schema.sql        # Base schema: 5 tables, RLS, triggers, indexes, pull_changes RPC
    ├── 002_user_scoping.sql          # Adds user_id to all tables; per-user RLS; updates pull_changes RPC
    ├── 003_rapid_log_sent_flag.sql   # Adds sent_to_ph + sent_to_ph_at to rapid_logs
    └── 004_habit_details.sql         # Adds details TEXT to habits

.github/
└── workflows/
    └── deploy.yml                    # GitHub Actions: build & deploy to gh-pages

public/
├── manifest.json
└── icons/
```

## Key Data Models

Defined in `src/db/models.ts`. All models include `user_id: string` for per-user RLS and use soft deletes (`deleted_at`) for sync compatibility.

- **Action** — Daily task with `is_completed`, `is_top_priority`, `sort_order`, scoped by `date`
- **TimelineEvent** — One note per day (unique `date` index), month-navigable
- **Habit** — Max 3 active, with 7-day "Test Run" badge; immutable `name` + editable `details`
- **HabitLog** — Daily completion per habit, compound index `[habit_uuid+date]`
- **RapidLog** — Tagged entries (`note` | `event` | `mood`), chronological feed; includes `sent_to_ph: 0 | 1` and `sent_to_ph_at: number | null` for cross-app tracking

## Business Logic Constraints

- **Auth:** App renders `AuthForm` until a Supabase session exists. Sign-out clears `last_sync_timestamp`.
- **Actions:** Max 3 top priorities per day. No rollover — queries scoped to exact date.
- **Habits:** Max 3 active habits. Test Run badge auto-shown for first 7 days. Name is NOT editable — delete (soft) and recreate to rename; `details` is editable inline. No deactivate/reactivate.
- **Timeline:** One entry per day enforced by unique Dexie index. Upsert via `put()`.
- **Rapid Log:** Tags restricted to `note` | `event` | `mood`. Body max ~280 chars, editable inline. `sent_to_ph` is a one-way flag — cannot be unset. Feed grouped into Sunday-start weekly sections; only the current week is expanded by default.
- **Metrics:** Reached from a header link (not a tab). Week/month views navigable back 5 years. CSV export always asks for a date range. Reset soft-deletes all data locally and (via sync) in Supabase, gated by typing `DELETE`.

## Scripts

```bash
npm run dev        # Start dev server (localhost:5174)
npm run build      # TypeScript check + Vite build
npm run preview    # Preview production build
npm run test       # Run Vitest test suite
npm run test:watch # Run tests in watch mode
```

## Implementation Status

All work packages are **complete**:

### Core Work Packages
- [x] **WP-0:** Project scaffolding & shared infrastructure
- [x] **WP-1:** Daily Action List (hooks, components, priority cap logic)
- [x] **WP-2:** Reality Timeline (month navigation, upsert, inline editing)
- [x] **WP-3:** Minimalist Habit Tracker (active cap, test run badge, day dots)
- [x] **WP-4:** Contextual Rapid Logging (tag filtering, chronological feed)
- [x] **WP-5:** Supabase SQL migrations & sync stub
- [x] **WP-6:** PWA configuration & GitHub Pages deployment workflow
- [x] **WP-7:** Supabase sync implementation (LWW pull/apply/push/confirm)

### Redesign Work Packages
- [x] **RWP-0:** Design system + shared UI components (ToastContext, EmptyState, Card, AnimatedList, Skeleton)
- [x] **RWP-1:** AppShell redesign (top header, SVG bottom nav, Work deep-link)
- [x] **RWP-2:** Actions tab (custom checkboxes, SVG icons, toasts, empty states, skeletons)
- [x] **RWP-3:** Timeline tab (sticky header, SVG chevrons, accent highlight)
- [x] **RWP-4:** Habits tab (rounded-square dots, test run badge, success colors)
- [x] **RWP-5:** Rapid Log tab (tag-colored pills, sticky filter chips, hover-reveal delete)

### Cross-App Integration
- [x] **Phase 1:** Supabase auth (email/password); `user_id` added to all tables; per-user RLS; `useAuth` hook + `AuthProvider` + `AuthForm`
- [x] **Phase 2:** Send to Work — Rapid Log entry → PH Capture via `sendToProductivityHub.ts`; `sent_to_ph` flag + checkmark UI
- [x] **Phase 3:** `Work` deep-link button in AppShell header

---

## Supabase Setup

The sync engine and auth are fully implemented. To activate on a new environment:

1. **Create a Supabase project** (or use the same one as Productivity Hub).

2. **Apply migrations in order** — paste each file into the Supabase SQL Editor and run:
   - `supabase/migrations/001_initial_schema.sql` — base tables, RLS, triggers, `pull_changes` RPC
   - `supabase/migrations/002_user_scoping.sql` — `user_id` columns, per-user policies, updated RPC
   - `supabase/migrations/003_rapid_log_sent_flag.sql` — `sent_to_ph` / `sent_to_ph_at` on `rapid_logs`
   - `supabase/migrations/004_habit_details.sql` — `details` on `habits` (**must be applied before deploying the habit-details app version**, or habit sync pushes fail on the unknown column)

3. **Add credentials** — create `.env.local` in the project root:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_OTHER_APP_URL=https://jeetbookseller.github.io/productivity/
   ```
   Use `VITE_OTHER_APP_URL=http://localhost:5173` for local cross-app dev.

4. **Restart the dev server** — `npm run dev`. Auth and sync activate automatically.

> Without `.env.local`, the app runs fully offline-only with no errors — sync and auth are no-ops when env vars are absent.

---

## Cross-App Integration

Friction Journal shares a Supabase project with Productivity Hub. Both apps use the same auth credentials, so a logged-in user can read/write across both apps’ tables within RLS bounds.

### Send to Work (Rapid Log → PH Capture)

- User taps the briefcase icon on any Rapid Log entry
- `sendToProductivityHub(body, userId)` (`src/lib/sendToProductivityHub.ts`) reads PH’s `user_data` notes blob, appends a new note, and upserts it back
- On success: local Dexie row is stamped `sent_to_ph: 1`; the row is pushed to Supabase sync; a toast confirms
- The icon becomes a checkmark and the button is disabled — cannot be re-sent
- Errors surface as a toast; no local state change on failure

### Work Link

A **Work** button in the AppShell header navigates to Productivity Hub (same tab). URL is read from `VITE_OTHER_APP_URL`.
