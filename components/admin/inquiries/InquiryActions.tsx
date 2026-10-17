'use client';

import { CheckCircle2, Clock, Mail, RotateCcw, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { RowMenu, type RowMenuItem } from '@/components/admin/RowMenu';
import type { InquiryRow } from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';
import { senderLabel, type InquiryHandlers } from './inquiryMeta';

interface StatusMove {
  to: InquiryStatus;
  label: string;
  icon: ReactNode;
}

const MOVE_PROGRESS: StatusMove = { to: 'in_progress', label: 'Mark in progress', icon: <Clock size={16} aria-hidden="true" /> };
const MOVE_RESOLVED: StatusMove = { to: 'resolved', label: 'Mark resolved', icon: <CheckCircle2 size={16} aria-hidden="true" /> };
const MOVE_REOPEN: StatusMove = { to: 'new', label: 'Reopen', icon: <RotateCcw size={16} aria-hidden="true" /> };

/** One visible primary move per status; the other moves live in the overflow menu. */
function movesFor(status: InquiryStatus): { primary: StatusMove; more: StatusMove[] } {
  if (status === 'new') return { primary: MOVE_PROGRESS, more: [MOVE_RESOLVED] };
  if (status === 'in_progress') return { primary: MOVE_RESOLVED, more: [] };
  return { primary: MOVE_REOPEN, more: [MOVE_PROGRESS] };
}

export function InquiryActions({
  row,
  busyId,
  locked,
  onStatus,
  onDelete,
}: { row: InquiryRow } & InquiryHandlers) {
  const busy = busyId === row.id;
  const disabled = busy || locked;
  const { primary, more } = movesFor(row.status);
  const who = senderLabel(row);

  const items: RowMenuItem[] = [];
  if (row.email) {
    items.push({
      key: 'reply',
      label: 'Reply by email',
      icon: <Mail size={16} aria-hidden="true" />,
      href: `mailto:${row.email}`,
    });
  }
  for (const move of more) {
    items.push({
      key: move.to,
      label: move.label,
      icon: move.icon,
      onSelect: () => onStatus(row, move.to),
    });
  }
  items.push({
    key: 'delete',
    label: 'Delete…',
    icon: <Trash2 size={16} aria-hidden="true" />,
    danger: true,
    onSelect: () => onDelete(row),
  });

  return (
    <div className="inq-actions">
      <button
        type="button"
        className="inq-btn"
        disabled={disabled}
        aria-busy={busy || undefined}
        aria-label={`${primary.label}: ${who}`}
        onClick={() => onStatus(row, primary.to)}
      >
        {busy ? 'Saving…' : primary.label}
      </button>
      <RowMenu label={`More actions for ${who}`} items={items} disabled={disabled} />
    </div>
  );
}
