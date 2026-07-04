import { useState } from 'react';
import { format, subDays } from 'date-fns';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/ToastContext';
import { gatherCsvData, buildCsv, downloadCsv } from '../../lib/csv';
import { todayString } from '../../lib/dates';

interface ExportCsvDialogProps {
  open: boolean;
  onClose: () => void;
  defaultFrom?: string;
  defaultTo?: string;
}

export function ExportCsvDialog({
  open,
  onClose,
  defaultFrom,
  defaultTo,
}: ExportCsvDialogProps) {
  const { showToast } = useToast();
  const [from, setFrom] = useState(
    () => defaultFrom ?? format(subDays(new Date(), 30), 'yyyy-MM-dd'),
  );
  const [to, setTo] = useState(() => defaultTo ?? todayString());
  const [exporting, setExporting] = useState(false);

  const rangeInvalid = from > to;

  async function handleExport() {
    if (rangeInvalid || exporting) return;
    setExporting(true);
    try {
      const days = await gatherCsvData(from, to);
      downloadCsv(`friction-journal_${from}_${to}.csv`, buildCsv(days));
      showToast('CSV exported');
      onClose();
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal open={open} title="Export CSV" onClose={onClose}>
      <p className="mb-3 text-sm text-on-surface-muted">
        Select the date range to export.
      </p>
      <div className="mb-3 flex flex-col gap-2">
        <label className="flex items-center justify-between gap-2 text-sm text-on-surface">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="bg-surface-raised text-sm text-on-surface rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm text-on-surface">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="bg-surface-raised text-sm text-on-surface rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </label>
      </div>
      {rangeInvalid && (
        <p className="mb-3 text-sm bg-warning-subtle text-warning rounded-lg px-3 py-2">
          The start date must be on or before the end date.
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-3 py-2 text-sm rounded-lg bg-surface-overlay text-on-surface hover:bg-accent-subtle"
        >
          Cancel
        </button>
        <button
          onClick={handleExport}
          disabled={rangeInvalid || exporting}
          className="px-3 py-2 text-sm rounded-lg bg-accent text-on-accent hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {exporting ? 'Exporting…' : 'Export'}
        </button>
      </div>
    </Modal>
  );
}
