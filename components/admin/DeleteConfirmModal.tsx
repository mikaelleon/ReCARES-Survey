'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/**
 * Confirm delete of a survey response (live Firestore or demo sample).
 */
export function DeleteConfirmModal({
  record,
  live,
  busy = false,
  onCancel,
  onConfirm,
}: {
  record: SampleRecord | null;
  live: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!record) return null;

  return (
    <Modal open onClose={busy ? () => undefined : onCancel}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Delete {record.id}?</h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
        {live
          ? 'Permanently deletes this submission from Firestore. Charts and exports will update. This cannot be undone.'
          : 'Removes this row from the local demo dataset only. You can undo for a few seconds after confirm.'}
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={busy} disabled={busy}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
