import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
  subYears,
} from 'date-fns';
import { useMetrics } from '../../hooks/useMetrics';
import { weekRangeLabel } from '../../lib/dates';
import { MetricsTable } from './MetricsTable';
import { ExportCsvDialog } from './ExportCsvDialog';
import { ResetDataDialog } from './ResetDataDialog';
import { Skeleton } from '../ui/Skeleton';

type ViewMode = 'week' | 'month';

const WEEK_OPTS = { weekStartsOn: 0 } as const;

export function MetricsView() {
  const [mode, setMode] = useState<ViewMode>('week');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [exportOpen, setExportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const rangeStart =
    mode === 'week' ? startOfWeek(anchor, WEEK_OPTS) : startOfMonth(anchor);
  const rangeEnd =
    mode === 'week' ? endOfWeek(anchor, WEEK_OPTS) : endOfMonth(anchor);

  const startDate = format(rangeStart, 'yyyy-MM-dd');
  const endDate = format(rangeEnd, 'yyyy-MM-dd');
  const data = useMetrics(startDate, endDate);

  const now = new Date();
  const nextDisabled = rangeEnd >= now;
  const prevDisabled = rangeStart <= subYears(now, 5);

  const periodLabel =
    mode === 'week' ? weekRangeLabel(startDate) : format(anchor, 'MMMM yyyy');

  function shift(direction: 1 | -1) {
    setAnchor((a) => (mode === 'week' ? addWeeks(a, direction) : addMonths(a, direction)));
  }

  return (
    <div className="animate-fade-in flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              aria-label="Back to journal"
              className="text-sm text-on-surface-muted hover:text-on-surface transition-colors"
            >
              ← Back
            </Link>
            <h1 className="text-xl font-semibold text-on-surface" role="heading">
              Metrics
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExportOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-overlay text-on-surface hover:bg-accent-subtle"
            >
              Export CSV
            </button>
            <button
              onClick={() => setResetOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-surface-overlay text-danger hover:bg-accent-subtle"
            >
              Reset data
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div role="toolbar" aria-label="View mode" className="flex gap-2">
            {(['week', 'month'] as const).map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={[
                  'rounded-full px-3 py-1 text-xs font-medium capitalize',
                  mode === m
                    ? 'bg-accent text-on-accent'
                    : 'bg-surface-overlay text-on-surface-muted hover:bg-accent-subtle',
                ].join(' ')}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Previous period"
              disabled={prevDisabled}
              onClick={() => shift(-1)}
              className="px-2 py-1 rounded-lg text-on-surface-muted hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ‹
            </button>
            <span className="text-sm font-medium text-on-surface whitespace-nowrap">
              {periodLabel}
            </span>
            <button
              aria-label="Next period"
              disabled={nextDisabled}
              onClick={() => shift(1)}
              className="px-2 py-1 rounded-lg text-on-surface-muted hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {data === undefined ? (
          <div className="p-4 flex flex-col gap-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : (
          <MetricsTable days={data.days} habits={data.habits} />
        )}
      </div>

      <ExportCsvDialog open={exportOpen} onClose={() => setExportOpen(false)} />
      <ResetDataDialog open={resetOpen} onClose={() => setResetOpen(false)} />
    </div>
  );
}
