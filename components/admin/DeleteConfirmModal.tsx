'use client';

import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { formatSubmissionLabel } from '@/lib/admin/submissionLabel';

/**
 * Confirm delete of a survey response (live Firestore or demo sample).
 */
export function DeleteConfirmModal({
  record,
  live,
  busy = false,
  error = null,
  onCancel,
  onConfirm,
}: {
  record: SampleRecord | null;
  live: boolean;
  busy?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!record) return null;

  const label = formatSubmissionLabel(record.submissionNumber ?? 0, record.phase);

  return (
    <ConfirmDeleteModal
      open
      title={`Delete ${label}?`}
      body={
        live
          ? `Permanently deletes response ${record.id} from Firestore. Dashboard charts and exports will update. This cannot be undone.`
          : `Removes ${record.id} from the local demo dataset only. You can undo for a few seconds after confirm.`
      }
      busy={busy}
      error={error}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  );
}
