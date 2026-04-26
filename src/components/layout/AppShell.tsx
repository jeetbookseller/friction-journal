import { NavLink, Outlet } from 'react-router-dom';
import { useAuthContext } from '../AuthProvider';

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M7 12l4 4 6-7" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function BriefcaseIcon({ width = 14, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" />
    </svg>
  );
}

function LogOutIcon({ width = 14, height = 14 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         aria-hidden="true">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

const otherAppUrl =
  import.meta.env.VITE_OTHER_APP_URL ||
  'https://jeetbookseller.github.io/productivity/';

const tabs = [
  { to: '/', label: 'Actions', icon: <CheckIcon /> },
  { to: '/timeline', label: 'Timeline', icon: <CalendarIcon /> },
  { to: '/habits', label: 'Habits', icon: <TargetIcon /> },
  { to: '/log', label: 'Log', icon: <PenIcon /> },
] as const;

export function AppShell() {
  const { signOut } = useAuthContext();

  return (
    <div className="flex flex-col md:flex-row h-svh">
      {/* Mobile-only top header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-surface">
        <span className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase">
          Personal Journal
        </span>
        <div className="flex items-center gap-1">
          <a
            href={otherAppUrl}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium
                       text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
                       transition-colors rounded-lg"
            aria-label="Open Productivity Hub"
          >
            <BriefcaseIcon />
            <span>Work</span>
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium
                       text-[var(--color-foreground-muted)] hover:text-[var(--color-foreground)]
                       transition-colors rounded-lg"
            aria-label="Sign out"
          >
            <LogOutIcon />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Desktop-only left sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-surface py-6 px-3 gap-8">
        <div className="px-3">
          <span className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase">
            Personal Journal
          </span>
        </div>
        <nav aria-label="Sidebar navigation" className="flex flex-col gap-1">
          {tabs.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium ${
                  isActive
                    ? 'bg-accent-subtle text-nav-active'
                    : 'text-nav-inactive hover:bg-surface-overlay'
                }`
              }
            >
              {icon}
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-1 px-0">
          <a
            href={otherAppUrl}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
                       text-sm font-medium text-nav-inactive hover:bg-surface-overlay"
            aria-label="Open Productivity Hub"
          >
            <BriefcaseIcon width={20} height={20} />
            <span>Work</span>
          </a>
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150
                       text-sm font-medium text-nav-inactive hover:bg-surface-overlay w-full text-left"
            aria-label="Sign out"
          >
            <LogOutIcon width={20} height={20} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>

      {/* Mobile-only bottom tab nav */}
      <nav aria-label="Tab navigation" className="md:hidden flex bg-nav-bg shadow-nav border-t border-border">
        {tabs.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors duration-150 ${
                isActive ? 'text-nav-active' : 'text-nav-inactive'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon}
                <span className="text-xs font-medium">{label}</span>
                {isActive && (
                  <span
                    data-testid="nav-dot"
                    className="w-1 h-1 rounded-full bg-nav-active animate-dot-pop"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
