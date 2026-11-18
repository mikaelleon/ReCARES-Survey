'use client';

import { RowMenu, type RowMenuItem } from '@/components/admin/RowMenu';
import type { InquiryRow } from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';
import { senderLabel, type InquiryHandlers } from './inquiryMeta';

interface StatusMove {
  to: InquiryStatus;
  label: string;
}

const MOVE_PROGRESS: StatusMove = { to: 'in_progress', label: 'Mark in progress' };
const MOVE_RESOLVED: StatusMove = { to: 'resolved', label: 'Mark resolved' };
const MOVE_REOPEN: StatusMove = { to: 'new', label: 'Reopen' };

/** One visible next step per status; the other moves live in the overflow menu. */
function movesFor(status: InquiryStatus): { primary: StatusMove; more: StatusMove[] } {
  if (status === 'new') return { primary: MOVE_PROGRESS, more: [MOVE_RESOLVED] };
  if (status === 'in_progress') return { primary: MOVE_RESOLVED, more: [] };
  return { primary: MOVE_REOPEN, more: [MOVE_PROGRESS] };
}

/**
 * Reply and the next status step are text; Delete and the rarer moves sit in the menu.
 * Reply comes first because answering is the job.
 */
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

  const items: RowMenuItem[] = more.map((move) => ({
    key: move.to,
    label: move.label,
    onSelect: () => onStatus(row, move.to),
  }));
  items.push({
    key: 'delete',
    label: 'Delete…',
    danger: true,
    onSelect: () => onDelete(row),
  });

  return (
    <div className="inq-actions">
      {row.email ? (
        <a className="inq-act" href={`mailto:${row.email}`} aria-label={`Reply by email to ${who}`}>
          Reply
        </a>
      ) : null}
      <button
        type="button"
        className="inq-act inq-act--primary"
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
