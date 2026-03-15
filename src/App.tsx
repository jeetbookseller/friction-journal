import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ActionList } from './components/actions/ActionList';
import { TimelineView } from './components/timeline/TimelineView';
import { RapidLogFeed } from './components/rapid-log/RapidLogFeed';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{title}</h1>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<ActionList />} />
          <Route path="timeline" element={<TimelineView />} />
          <Route path="habits" element={<PlaceholderPage title="Habits" />} />
          <Route path="log" element={<RapidLogFeed />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
