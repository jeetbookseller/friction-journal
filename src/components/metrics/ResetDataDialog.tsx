import { useState } from 'react';
import { format, subYears } from 'date-fns';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/ToastContext';
import { resetAllData } from '../../db/reset';
import { todayString } from '../../lib/dates';
import { ExportCsvDialog } from './ExportCsvDialog';

interface ResetDataDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ResetDataDialog({ open, onClose }: ResetDataDialogProps) {
  const { showToast } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  function close() {
    setConfirmText('');
    onClose();
  }

  async function handleDelete() {
    if (confirmText !== 'DELETE' || deleting) return;
    setDeleting(true);
    try {
      await resetAllData();
      showToast('All data deleted');
      close();
    } catch {
      // Local tombstones are written before sync, so the reset itself succeeded.
      showToast('Data deleted locally — cloud sync failed, will retry on next sync');
      close();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Modal open={open && !exportOpen} title="Delete all data?" onClose={close}>
        <p className="mb-3 text-sm text-on-surface-muted">
          This permanently deletes ALL journal data — actions, habits, habit
          history, timeline notes, and log entries — from this device and the
          cloud.
        </p>
        <button
          onClick={() => setExportOpen(true)}
          className="mb-3 w-full px-3 py-2 text-sm rounded-lg bg-surface-overlay text-on-surface hover:bg-accent-subtle"
        >
          Export to CSV first
        </button>
        <label className="mb-3 block text-sm text-on-surface">
          Type <span className="font-semibold">DELETE</span> to confirm:
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            aria-label="Type DELETE to confirm"
            className="mt-1 w-full bg-surface-raised text-sm text-on-surface rounded-lg px-3 py-2 border border-border focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent"
          />
        </label>
        <div className="flex justify-end gap-2">
          <button
            onClick={close}
            className="px-3 py-2 text-sm rounded-lg bg-surface-overlay text-on-surface hover:bg-accent-subtle"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={confirmText !== 'DELETE' || deleting}
            className="px-3 py-2 text-sm rounded-lg bg-danger text-on-accent hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? 'Deleting…' : 'Delete everything'}
          </button>
        </div>
      </Modal>

      <ExportCsvDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultFrom={format(subYears(new Date(), 5), 'yyyy-MM-dd')}
        defaultTo={todayString()}
      />
    </>
  );
}
