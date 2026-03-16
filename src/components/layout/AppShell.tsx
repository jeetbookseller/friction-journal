import { NavLink, Outlet } from 'react-router-dom';

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

const tabs = [
  { to: '/', label: 'Actions', icon: <CheckIcon /> },
  { to: '/timeline', label: 'Timeline', icon: <CalendarIcon /> },
  { to: '/habits', label: 'Habits', icon: <TargetIcon /> },
  { to: '/log', label: 'Log', icon: <PenIcon /> },
] as const;

export function AppShell() {
  return (
    <div className="flex flex-col md:flex-row h-svh">
      {/* Mobile-only top header */}
      <header className="md:hidden px-4 py-3 border-b border-border bg-surface">
        <span className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase">
          Friction Journal
        </span>
      </header>

      {/* Desktop-only left sidebar */}
      <aside className="hidden md:flex flex-col w-52 shrink-0 border-r border-border bg-surface py-6 px-3 gap-8">
        <div className="px-3">
          <span className="text-sm font-semibold tracking-wide text-on-surface-muted uppercase">
            Friction Journal
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
