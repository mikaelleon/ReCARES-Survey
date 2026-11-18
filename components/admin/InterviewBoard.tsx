'use client';

import { formatClock, formatDate } from '@/survey/interviewSchedule';
import { useEffect, useMemo, useState } from 'react';
import { InterviewNotesDrawer } from '@/components/admin/InterviewNotesDrawer';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';
import type { InterviewContactStatus } from '@/survey/schema';

type BoardColumnId = Exclude<InterviewContactStatus, 'withdrawn'>;

const COLUMNS: { id: BoardColumnId; title: string }[] = [
  { id: 'not_contacted', title: 'Not contacted' },
  { id: 'pending_confirmation', title: 'Pending' },
  { id: 'confirmed', title: 'Confirmed' },
];

function formatSubmitted(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function timeLabel(row: InterviewInviteRow): string {
  if (row.preferredClock) return formatClock(row.preferredClock);
  if (row.preferredTime === 'Other' && row.preferredTimeOther) {
    return row.preferredTimeOther;
  }
  return row.preferredTime;
}

/** One phrase per invite: format, when, time. */
function whenLabel(row: InterviewInviteRow): string {
  const day = row.preferredDate
    ? formatDate(row.preferredDate)
    : row.preferredDays.length > 0
      ? row.preferredDays.map((d) => d.slice(0, 3)).join(', ')
      : '';
  return [row.interviewFormat, day, timeLabel(row)].filter(Boolean).join(' · ');
}

/** Legacy `withdrawn` invites stay visible under Not contacted so they can be deleted. */
function boardColumnFor(status: InterviewContactStatus): BoardColumnId {
  if (status === 'pending_confirmation' || status === 'confirmed') return status;
  return 'not_contacted';
}

function InviteRow({
  row,
  columnId,
  busyId,
  onMarkContacted,
  onConfirm,
  onRequestDelete,
  onOpenNotes,
  canDelete,
  selection,
  enter,
}: {
  enter: boolean;
  selection?: InviteSelection;
  row: InterviewInviteRow;
  canDelete: boolean;
  columnId: BoardColumnId;
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onRequestDelete: (row: InterviewInviteRow) => void;
  onOpenNotes: (row: InterviewInviteRow) => void;
}) {
  const noteCount = row.notes?.length ?? 0;
  const selecting = Boolean(selection?.active);
  const isSelected = Boolean(selection?.selected.has(row.id));
  const busy = busyId === row.id;
  return (
    <li
      className={`iv-row${isSelected ? ' is-selected' : ''}${enter ? ' is-entering' : ''}${busy ? ' is-busy' : ''}`}
      aria-busy={busy || undefined}
    >
      {selecting ? (
        <label className="iv-select" title={`Select ${row.email}`}>
          <input
            type="checkbox"
            checked={isSelected}
            disabled={busyId === '__bulk__'}
            aria-label={`Select ${row.email}`}
            onChange={() => selection?.onToggle(row.id)}
          />
        </label>
      ) : null}
      <div className="iv-row__body">
        <div className="iv-row__main">
          <p className="iv-row__email" title={row.email}>
            {row.email}
          </p>
          <p className="iv-row__when">{whenLabel(row)}</p>
          <p className="iv-row__meta">
            {columnId === 'confirmed' && row.confirmedDateTime
              ? `Confirmed ${formatSubmitted(row.confirmedDateTime)}`
              : `Submitted ${formatSubmitted(row.submittedAt)}`}
          </p>
        </div>
        <div className="iv-row__actions">
          {columnId === 'not_contacted' ? (
            <button
              type="button"
              className="iv-act iv-act--primary"
              disabled={busy}
              onClick={() => onMarkContacted(row.id, row.email)}
            >
              {busy ? 'Saving…' : 'Mark contacted'}
            </button>
          ) : null}
          {columnId === 'pending_confirmation' ? (
            <button
              type="button"
              className="iv-act iv-act--primary"
              disabled={busy}
              onClick={() => onConfirm(row.id, row.email)}
            >
              {busy ? 'Saving…' : 'Confirm'}
            </button>
          ) : null}
          <button type="button" className="iv-act" onClick={() => onOpenNotes(row)}>
            Notes{noteCount > 0 ? ` (${noteCount})` : ''}
          </button>
          {canDelete ? (
            <button
              type="button"
              className="iv-act iv-act--danger"
              disabled={busy}
              onClick={() => onRequestDelete(row)}
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export interface InviteSelection {
  active: boolean;
  selected: ReadonlySet<string>;
  onToggle: (id: string) => void;
}

/**
 * Interview pipeline: three ruled lists, one invite per line. Columns on desktop,
 * stacked on narrow screens. No tabs, no cards.
 */
export function InterviewBoard({
  rows,
  busyId,
  onMarkContacted,
  onConfirm,
  onRequestDelete,
  onAddNote,
  canDelete = true,
  selection,
}: {
  selection?: InviteSelection;
  canDelete?: boolean;
  rows: InterviewInviteRow[];
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onRequestDelete: (row: InterviewInviteRow) => void;
  onAddNote: (id: string, existing: InterviewInviteRow['notes'], text: string) => void;
}) {
  const [notesRow, setNotesRow] = useState<InterviewInviteRow | null>(null);
  /** Rows that exist at first paint stay still; only rows that arrive or move afterwards ease in. */
  const [settled, setSettled] = useState(false);
  useEffect(() => setSettled(true), []);

  useEffect(() => {
    setNotesRow((current) => {
      if (!current) return null;
      return rows.find((r) => r.id === current.id) ?? current;
    });
  }, [rows]);

  const byColumn = useMemo(() => {
    const map: Record<BoardColumnId, InterviewInviteRow[]> = {
      not_contacted: [],
      pending_confirmation: [],
      confirmed: [],
    };
    for (const row of rows) {
      map[boardColumnFor(row.contactStatus)].push(row);
    }
    return map;
  }, [rows]);

  const rowProps = {
    busyId,
    onMarkContacted,
    onConfirm,
    onRequestDelete,
    onOpenNotes: setNotesRow,
    canDelete,
    selection,
    enter: settled,
  };

  return (
    <div className="interview-board" role="region" aria-label="Interview invites pipeline">
      <div className="iv-stages">
        {COLUMNS.map((col) => {
          const list = byColumn[col.id];
          return (
            <section key={col.id} className="iv-stage" aria-labelledby={`interview-col-${col.id}`}>
              <h2 id={`interview-col-${col.id}`} className="iv-stage__title">
                {col.title}
              </h2>
              {list.length === 0 ? (
                <p className="iv-stage__empty">None</p>
              ) : (
                <ul className="iv-list">
                  {list.map((row) => (
                    <InviteRow key={row.id} row={row} columnId={col.id} {...rowProps} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>

      <InterviewNotesDrawer
        row={notesRow}
        busy={Boolean(notesRow && busyId === notesRow.id)}
        onClose={() => setNotesRow(null)}
        onAddNote={(text) => {
          if (!notesRow) return;
          onAddNote(notesRow.id, notesRow.notes, text);
        }}
      />
    </div>
  );
}
