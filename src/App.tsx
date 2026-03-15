import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { ActionList } from './components/actions/ActionList';
import { TimelineView } from './components/timeline/TimelineView';
import { HabitTracker } from './components/habits/HabitTracker';
import { RapidLogFeed } from './components/rapid-log/RapidLogFeed';

export default function App() {
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
