'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/**
 * Confirm local delete of a sample response.
 */
export function DeleteConfirmModal({
  record,
  onCancel,
  onConfirm,
}: {
  record: SampleRecord | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!record) return null;

  return (
    <Modal open onClose={onCancel}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Delete {record.id}?</h2>
      <p style={{ margin: '0 0 20px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
        Removes this row from the local demo dataset only. You can undo for a few seconds after
        confirm. Firestore is not called.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
