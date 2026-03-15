import { NavLink, Outlet } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Actions' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/habits', label: 'Habits' },
  { to: '/log', label: 'Log' },
] as const;

export function AppShell() {
  return (
    <div className="flex flex-col h-svh">
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <nav className="flex border-t border-gray-200 bg-white">
        {tabs.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex-1 py-3 text-center text-sm font-medium ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
