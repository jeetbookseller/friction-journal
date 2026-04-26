import { HashRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/ui/ToastContext';
import { AuthProvider, useAuthContext } from './components/AuthProvider';
import { AuthForm } from './components/AuthForm';
import { AppShell } from './components/layout/AppShell';
import { ActionList } from './components/actions/ActionList';
import { TimelineView } from './components/timeline/TimelineView';
import { HabitTracker } from './components/habits/HabitTracker';
import { RapidLogFeed } from './components/rapid-log/RapidLogFeed';

function AppContent() {
  const { session, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <span className="text-sm text-on-surface-muted">Loading…</span>
      </div>
    );
  }

  if (!session) return <AuthForm />;

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ActionList />} />
          <Route path="timeline" element={<TimelineView />} />
          <Route path="habits" element={<HabitTracker />} />
          <Route path="log" element={<RapidLogFeed />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}
