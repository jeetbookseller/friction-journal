Copyright © 2026 Jeet Bookseller. All Rights Reserved. This code is for demonstration purposes only. It may not be used, modified, or distributed for commercial or non-commercial purposes without my explicit written permission.

# Friction Journal

A personal journaling PWA that enforces analog Bullet Journal friction — slowing you down just enough to think.

**Live app:** https://jeetbookseller.github.io/friction-journal/

---

## Features

### Four journaling sections

| Section | What it does |
|---------|-------------|
| **Actions** | Daily task list with max 3 top priorities; no automatic rollover |
| **Timeline** | One note per day, month-navigable with inline editing |
| **Habits** | Max 3 active habits with 7-day Test Run badge and daily completion dots |
| **Rapid Log** | Tagged quick-capture entries (`note` / `event` / `mood`) with filter chips |

### Cross-cutting capabilities

- **Authentication** — email/password via Supabase; same project and credentials as Productivity Hub
- **Offline-first** — all reads/writes go to local IndexedDB (Dexie.js); Supabase sync runs in the background
- **Cross-device sync** — Supabase LWW sync (pull → apply → push → confirm)
- **Productivity Hub integration** — send any Rapid Log entry to PH’s Capture tab; sent entries show a checkmark and cannot be re-sent
- **Work link** — one-tap navigation to Productivity Hub via the `Work` button in the header
- **Dark mode** — auto-detects system preference via `prefers-color-scheme`
- **Toast notifications** — auto-dismissing feedback on add/delete
- **Soft deletes** — all records carry `deleted_at` for reliable cross-device sync
- **PWA** — installable, works offline after first visit

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite + TypeScript |
| Offline DB | Dexie.js (IndexedDB) + dexie-react-hooks |
| Auth & sync | Supabase (same project as Productivity Hub) |
| Styling | Tailwind CSS 4 |
| Routing | React Router v7 (HashRouter for GH Pages) |
| Dates | date-fns |
| PWA | vite-plugin-pwa |
| Testing | Vitest + Testing Library + fake-indexeddb |

---

## Local development

```bash
npm install
npm run dev        # dev server at localhost:5174
npm run build      # TypeScript check + Vite build → dist/
npm test           # run Vitest test suite
```

Copy `.env.example` to `.env.local` and add your Supabase credentials (same project as Productivity Hub). Set `VITE_OTHER_APP_URL=http://localhost:5173` for local cross-app testing.

> Deployed to GitHub Pages at the base path `/friction-journal/`.
