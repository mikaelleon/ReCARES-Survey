'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

/**
 * Shared permanent-delete confirmation for admin CRUD surfaces.
 */
export function ConfirmDeleteModal({
  open,
  title,
  body,
  busy = false,
  error = null,
  confirmLabel = 'Delete',
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  body: string;
  busy?: boolean;
  error?: string | null;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <Modal open onClose={busy ? () => undefined : onCancel}>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{title}</h2>
      <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
        {body}
      </p>
      {error ? (
        <p className="na-error" role="alert" style={{ margin: '0 0 16px' }}>
          {error}
        </p>
      ) : null}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm} loading={busy} disabled={busy}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
