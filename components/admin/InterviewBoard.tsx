'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Inbox,
  Mail,
  MessageCircle,
  Trash2,
} from 'lucide-react';
import {
  deleteInterviewInvite,
  listInterviewInvites,
  updateInterviewContactStatus,
  type InterviewInviteRow,
} from '@/lib/firebase/interviewManage';
import type { InterviewContactStatus } from '@/survey/schema';

const COLUMNS: {
  id: InterviewContactStatus;
  title: string;
  hint: string;
}[] = [
  {
    id: 'not_contacted',
    title: 'Not Yet Contacted',
    hint: 'Interest saved — no outreach logged yet',
  },
  {
    id: 'pending_confirmation',
    title: 'Pending Confirmation',
    hint: 'Contacted — awaiting resident confirmation',
  },
  {
    id: 'confirmed',
    title: 'Confirmed',
    hint: 'Resident confirmed a specific time',
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

/**
 * Interview Invites Kanban — separate from Members & Invites.
 * Cards use InterviewInvitation fields only (never anonymous survey answers).
 */
export function InterviewBoard() {
  const [rows, setRows] = useState<InterviewInviteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const next = await listInterviewInvites();
    setRows(next);
  }, []);

  useEffect(() => {
    setLoading(true);
    void refresh()
      .catch(() => setError('Could not load interview invites from Firestore.'))
      .finally(() => setLoading(false));
  }, [refresh]);

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

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusyId(id);
    setError(null);
    setNote(null);
    try {
      await action();
      await refresh();
      setNote(success);
    } catch {
      setError('That action failed. Check your connection and permissions.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="admin-section__lead">Loading interview invites…</p>;
  }

  return (
    <div className="interview-board">
      <p className="admin-section__lead">
        Resident-provided contact preferences only. These records are never joined to anonymous
        survey responses.
      </p>

      {error ? (
        <p className="na-error" role="alert">
          {error}
        </p>
      ) : null}
      {note ? (
        <p role="status" className="admin-kanban-note">
          {note}
        </p>
      ) : null}

      <div className="admin-kanban" role="region" aria-label="Interview invites pipeline">
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
                  {col.id === 'not_contacted' ? (
                    <Mail size={16} strokeWidth={2.2} aria-hidden="true" />
                  ) : col.id === 'pending_confirmation' ? (
                    <MessageCircle size={16} strokeWidth={2.2} aria-hidden="true" />
                  ) : (
                    <CalendarCheck size={16} strokeWidth={2.2} aria-hidden="true" />
                  )}
                  <h2 id={`interview-col-${col.id}`} className="admin-kanban-col__title">
                    {col.title}
                  </h2>
                  <span className="admin-kanban-col__count">{list.length}</span>
                </header>
                <p className="interview-board__col-hint">{col.hint}</p>
                <div className="admin-kanban-col__body">
                  {list.length === 0 ? (
                    <div className="admin-kanban-empty">
                      <span className="admin-kanban-empty__icon" aria-hidden="true">
                        <Inbox size={24} />
                      </span>
                      <p className="admin-kanban-empty__msg">No invites in this column</p>
                    </div>
                  ) : (
                    list.map((row) => (
                      <article key={row.id} className="admin-kanban-card">
                        <div className="admin-kanban-card__top admin-kanban-card__top--polish">
                          <span
                            className="admin-avatar admin-kanban-card__avatar"
                            aria-hidden="true"
                          >
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
                            <dd>
                              {row.preferredDays.length > 0
                                ? row.preferredDays.join(', ')
                                : '—'}
                            </dd>
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
                          {col.id === 'not_contacted' ? (
                            <button
                              type="button"
                              className="admin-kanban-icon-btn admin-kanban-icon-btn--primary"
                              disabled={busyId === row.id}
                              onClick={() =>
                                void run(
                                  row.id,
                                  () =>
                                    updateInterviewContactStatus(
                                      row.id,
                                      'pending_confirmation',
                                    ),
                                  `Marked ${row.email} as contacted.`,
                                )
                              }
                            >
                              Mark Contacted
                            </button>
                          ) : null}
                          {col.id === 'pending_confirmation' ? (
                            <button
                              type="button"
                              className="admin-kanban-icon-btn admin-kanban-icon-btn--primary"
                              disabled={busyId === row.id}
                              onClick={() =>
                                void run(
                                  row.id,
                                  () => updateInterviewContactStatus(row.id, 'confirmed'),
                                  `Confirmed interview for ${row.email}.`,
                                )
                              }
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
                              void run(
                                row.id,
                                () => deleteInterviewInvite(row.id),
                                `Withdrew invite for ${row.email}.`,
                              );
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
