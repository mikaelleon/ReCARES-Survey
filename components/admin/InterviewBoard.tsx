'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Inbox,
  Mail,
  MessageCircle,
  Trash2,
} from 'lucide-react';
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
  return <CalendarCheck size={16} strokeWidth={2.2} aria-hidden="true" />;
}

function InviteCard({
  row,
  columnId,
  busyId,
  onMarkContacted,
  onConfirm,
  onWithdraw,
}: {
  row: InterviewInviteRow;
  columnId: InterviewContactStatus;
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onWithdraw: (id: string, email: string) => void;
}) {
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
        <button
          type="button"
          className="admin-kanban-icon-btn admin-kanban-icon-btn--danger"
          aria-label={`Withdraw invite for ${row.email}`}
          title="Withdraw"
          disabled={busyId === row.id}
          onClick={() => {
            if (
              !window.confirm(
                `Withdraw interview interest for ${row.email}? This deletes the invite record.`,
              )
            ) {
              return;
            }
            onWithdraw(row.id, row.email);
          }}
        >
          <Trash2 size={14} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

/**
 * Interview Invites Kanban — three columns on desktop; tabbed single column on mobile.
 */
export function InterviewBoard({
  rows,
  busyId,
  onMarkContacted,
  onConfirm,
  onWithdraw,
}: {
  rows: InterviewInviteRow[];
  busyId: string | null;
  onMarkContacted: (id: string, email: string) => void;
  onConfirm: (id: string, email: string) => void;
  onWithdraw: (id: string, email: string) => void;
}) {
  const byColumn = useMemo(() => {
    const map: Record<InterviewContactStatus, InterviewInviteRow[]> = {
      not_contacted: [],
      pending_confirmation: [],
      confirmed: [],
    };
    for (const row of rows) {
      map[row.contactStatus].push(row);
    }
    return map;
  }, [rows]);

  const defaultTab = useMemo<InterviewContactStatus>(() => {
    if (byColumn.not_contacted.length > 0) return 'not_contacted';
    if (byColumn.pending_confirmation.length > 0) return 'pending_confirmation';
    return 'confirmed';
  }, [byColumn]);

  const [mobileTab, setMobileTab] = useState<InterviewContactStatus>(defaultTab);

  useEffect(() => {
    setMobileTab(defaultTab);
  }, [defaultTab]);

  const mobileList = byColumn[mobileTab];

  return (
    <div className="interview-board">
      {/* Desktop: three-column board */}
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
                      <InviteCard
                        key={row.id}
                        row={row}
                        columnId={col.id}
                        busyId={busyId}
                        onMarkContacted={onMarkContacted}
                        onConfirm={onConfirm}
                        onWithdraw={onWithdraw}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {/* Mobile: tabbed single column */}
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
              <InviteCard
                key={row.id}
                row={row}
                columnId={mobileTab}
                busyId={busyId}
                onMarkContacted={onMarkContacted}
                onConfirm={onConfirm}
                onWithdraw={onWithdraw}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
