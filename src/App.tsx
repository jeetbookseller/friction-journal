import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';

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
          <Route index element={<PlaceholderPage title="Actions" />} />
          <Route path="timeline" element={<PlaceholderPage title="Timeline" />} />
          <Route path="habits" element={<PlaceholderPage title="Habits" />} />
          <Route path="log" element={<PlaceholderPage title="Log" />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
