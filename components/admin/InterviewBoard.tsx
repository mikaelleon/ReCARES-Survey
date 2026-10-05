'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Inbox,
  Mail,
  MessageCircle,
  StickyNote,
  UserRoundX,
} from 'lucide-react';
import { InterviewNotesDrawer } from '@/components/admin/InterviewNotesDrawer';
import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';
import type { InterviewContactStatus } from '@/survey/schema';

const COLUMNS: {
  id: InterviewContactStatus;
  title: string;
  shortTitle: string;
}[] = [
  {
    id: 'not_contacted',
    title: 'Not Yet Contacted',
    shortTitle: 'Not contacted',
  },
  {
    id: 'pending_confirmation',
    title: 'Pending Confirmation',
    shortTitle: 'Pending',
  },
  {
    id: 'confirmed',
    title: 'Confirmed',
    shortTitle: 'Confirmed',
  },
  {
    id: 'withdrawn',
    title: 'Withdrawn',
    shortTitle: 'Withdrawn',
  },
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
  if (row.preferredTime === 'Other' && row.preferredTimeOther) {
    return row.preferredTimeOther;
  }
  return row.preferredTime;
}

function emailInitials(email: string): string {
  const local = email.split('@')[0] || email;
  return local.slice(0, 2).toUpperCase();
}

function ColumnIcon({ id }: { id: InterviewContactStatus }) {
  if (id === 'not_contacted') return <Mail size={16} strokeWidth={2.2} aria-hidden="true" />;
  if (id === 'pending_confirmation') {
    return <MessageCircle size={16} strokeWidth={2.2} aria-hidden="true" />;
  }
  if (id === 'withdrawn') return <UserRoundX size={16} strokeWidth={2.2} aria-hidden="true" />;
  return <CalendarCheck size={16} strokeWidth={2.2} aria-hidden="true" />;
}

function InviteCard({
  row,
  columnId,
  busyId,
  onMarkContacted,
  onConfirm,
  onWithdraw,
  onRestore,
  onOpenNotes,
}: {
  row: InterviewInviteRow;
  columnId: InterviewContactStatus;
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onWithdraw: (id: string, email: string) => void;
  onRestore: (id: string, email: string) => void;
  onOpenNotes: (row: InterviewInviteRow) => void;
}) {
  const noteCount = row.notes?.length ?? 0;
  return (
    <article className="admin-kanban-card">
      <div className="admin-kanban-card__top admin-kanban-card__top--polish">
        <span className="admin-avatar admin-kanban-card__avatar" aria-hidden="true">
          {emailInitials(row.email)}
        </span>
        <div className="admin-kanban-card__meta">
          <div className="admin-kanban-card__name">{row.email}</div>
          <div className="admin-kanban-card__muted">
            Submitted {formatSubmitted(row.submittedAt)}
          </div>
        </div>
        <span className="admin-kanban-role">{row.interviewFormat}</span>
      </div>
      <dl className="interview-board__details">
        <div>
          <dt>Preferred days</dt>
          <dd>{row.preferredDays.length > 0 ? row.preferredDays.join(', ') : '—'}</dd>
        </div>
        <div>
          <dt>Preferred time</dt>
          <dd>{timeLabel(row)}</dd>
        </div>
        {row.contactStatus === 'confirmed' && row.confirmedDateTime ? (
          <div>
            <dt>Confirmed</dt>
            <dd>{formatSubmitted(row.confirmedDateTime)}</dd>
          </div>
        ) : null}
      </dl>
      <div className="admin-kanban-card__actions">
        {columnId === 'not_contacted' ? (
          <button
            type="button"
            className="admin-kanban-icon-btn admin-kanban-icon-btn--primary"
            disabled={busyId === row.id}
            onClick={() => onMarkContacted(row.id, row.email)}
          >
            Mark Contacted
          </button>
        ) : null}
        {columnId === 'pending_confirmation' ? (
          <button
            type="button"
            className="admin-kanban-icon-btn admin-kanban-icon-btn--primary"
            disabled={busyId === row.id}
            onClick={() => onConfirm(row.id, row.email)}
          >
            <CheckCircle2 size={14} aria-hidden="true" />
            Confirm
          </button>
        ) : null}
        {columnId === 'withdrawn' ? (
          <button
            type="button"
            className="admin-kanban-icon-btn admin-kanban-icon-btn--primary"
            disabled={busyId === row.id}
            onClick={() => onRestore(row.id, row.email)}
          >
            Restore
          </button>
        ) : (
          <button
            type="button"
            className="admin-kanban-icon-btn"
            disabled={busyId === row.id}
            onClick={() => {
              if (
                !window.confirm(
                  `Mark ${row.email} as withdrawn? Their contact details stay here so you do not reach out again by mistake.`,
                )
              ) {
                return;
              }
              onWithdraw(row.id, row.email);
            }}
          >
            Withdraw
          </button>
        )}
        <button
          type="button"
          className="admin-kanban-icon-btn"
          onClick={() => onOpenNotes(row)}
        >
          <StickyNote size={14} aria-hidden="true" />
          Notes{noteCount > 0 ? ` (${noteCount})` : ''}
        </button>
      </div>
    </article>
  );
}

/**
 * Interview Invites Kanban — four columns on desktop; tabbed single column on mobile.
 */
export function InterviewBoard({
  rows,
  busyId,
  onMarkContacted,
  onConfirm,
  onWithdraw,
  onRestore,
  onAddNote,
}: {
  rows: InterviewInviteRow[];
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onWithdraw: (id: string, email: string) => void;
  onRestore: (id: string, email: string) => void;
  onAddNote: (id: string, existing: InterviewInviteRow['notes'], text: string) => void;
}) {
  const [notesRow, setNotesRow] = useState<InterviewInviteRow | null>(null);

  useEffect(() => {
    setNotesRow((current) => {
      if (!current) return null;
      return rows.find((r) => r.id === current.id) ?? current;
    });
  }, [rows]);

  const byColumn = useMemo(() => {
    const map: Record<InterviewContactStatus, InterviewInviteRow[]> = {
      not_contacted: [],
      pending_confirmation: [],
      confirmed: [],
      withdrawn: [],
    };
    for (const row of rows) {
      map[row.contactStatus].push(row);
    }
    return map;
  }, [rows]);

  const defaultTab = useMemo<InterviewContactStatus>(() => {
    if (byColumn.not_contacted.length > 0) return 'not_contacted';
    if (byColumn.pending_confirmation.length > 0) return 'pending_confirmation';
    if (byColumn.confirmed.length > 0) return 'confirmed';
    return 'withdrawn';
  }, [byColumn]);

  const [mobileTab, setMobileTab] = useState<InterviewContactStatus>(defaultTab);

  useEffect(() => {
    setMobileTab(defaultTab);
  }, [defaultTab]);

  const mobileList = byColumn[mobileTab];

  const cardProps = {
    busyId,
    onMarkContacted,
    onConfirm,
    onWithdraw,
    onRestore,
    onOpenNotes: setNotesRow,
  };

  return (
    <div className="interview-board">
      <div
        className="admin-kanban interview-board__desktop"
        role="region"
        aria-label="Interview invites pipeline"
      >
        <div className="admin-kanban__scroller">
          {COLUMNS.map((col) => {
            const list = byColumn[col.id];
            return (
              <section
                key={col.id}
                className="admin-kanban-col"
                aria-labelledby={`interview-col-${col.id}`}
              >
                <header className="admin-kanban-col__head">
                  <ColumnIcon id={col.id} />
                  <h2 id={`interview-col-${col.id}`} className="admin-kanban-col__title">
                    {col.title}
                  </h2>
                  <span className="admin-kanban-col__count">{list.length}</span>
                </header>
                <div className="admin-kanban-col__body">
                  {list.length === 0 ? (
                    <div className="admin-kanban-empty">
                      <span className="admin-kanban-empty__icon" aria-hidden="true">
                        <Inbox size={22} />
                      </span>
                      <p className="admin-kanban-empty__msg">No invites here</p>
                    </div>
                  ) : (
                    list.map((row) => (
                      <InviteCard key={row.id} row={row} columnId={col.id} {...cardProps} />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <div
        className="interview-board__mobile"
        role="region"
        aria-label="Interview invites pipeline"
      >
        <div className="interview-board__tabs" role="tablist" aria-label="Pipeline stage">
          {COLUMNS.map((col) => {
            const count = byColumn[col.id].length;
            const selected = mobileTab === col.id;
            return (
              <button
                key={col.id}
                type="button"
                role="tab"
                aria-selected={selected}
                className={`interview-board__tab${selected ? ' is-active' : ''}`}
                onClick={() => setMobileTab(col.id)}
              >
                <span className="interview-board__tab-label">{col.shortTitle}</span>
                <span className="interview-board__tab-count">{count}</span>
              </button>
            );
          })}
        </div>
        <div key={mobileTab} className="interview-board__mobile-body admin-view-transition" role="tabpanel">
          {mobileList.length === 0 ? (
            <div className="admin-kanban-empty">
              <span className="admin-kanban-empty__icon" aria-hidden="true">
                <Inbox size={22} />
              </span>
              <p className="admin-kanban-empty__msg">No invites in this stage</p>
            </div>
          ) : (
            mobileList.map((row) => (
              <InviteCard key={row.id} row={row} columnId={mobileTab} {...cardProps} />
            ))
          )}
        </div>
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
