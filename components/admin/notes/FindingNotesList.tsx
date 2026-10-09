'use client';

import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { getQuestionById } from '@/lib/admin/responseQuestions';
import {
  FINDING_STATUS_LABELS,
  FINDING_TAG_LABELS,
  type FindingNoteRow,
} from '@/lib/firebase/findingNotes';

function formatWhen(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function snippet(body: string, max = 140): string {
  const t = body.trim().replace(/\s+/g, ' ');
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

/**
 * Card grid of finding notes — Dashboard insight-card language.
 */
export function FindingNotesList({
  rows,
  currentUid,
  canWrite,
  approvedIds,
  onOpen,
  onEdit,
  onDelete,
}: {
  rows: FindingNoteRow[];
  currentUid: string;
  canWrite: boolean;
  /** Note ids that have an adviser comment with severity approved. */
  approvedIds?: ReadonlySet<string>;
  onOpen: (row: FindingNoteRow) => void;
  onEdit: (row: FindingNoteRow) => void;
  onDelete: (row: FindingNoteRow) => void;
}) {
  return (
    <ul className="finding-notes-grid">
      {rows.map((row, index) => {
        const question = getQuestionById(row.questionId);
        const isMine = row.authorUid === currentUid;
        const locked = row.status === 'final';
        const mayEdit = canWrite && isMine;
        return (
          <li key={row.id} style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}>
            <article className="finding-note-card" aria-labelledby={`finding-card-${row.id}`}>
              <header className="finding-note-card__head">
                <div className="finding-note-card__chips">
                  <span className={`finding-tag finding-tag--${row.tag}`}>
                    {FINDING_TAG_LABELS[row.tag]}
                  </span>
                  <span className={`finding-status finding-status--${row.status}`}>
                    {FINDING_STATUS_LABELS[row.status]}
                  </span>
                  {approvedIds?.has(row.id) ? (
                    <StatusBadge tone="emerald">Approved</StatusBadge>
                  ) : null}
                </div>
                <h3 id={`finding-card-${row.id}`} className="finding-note-card__title">
                  <button type="button" onClick={() => onOpen(row)}>
                    {row.title}
                  </button>
                </h3>
              </header>

              <p className="finding-note-card__body">{snippet(row.body)}</p>

              <dl className="finding-note-card__meta">
                <div>
                  <dt>Question</dt>
                  <dd>{question?.title || row.questionId}</dd>
                </div>
                <div>
                  <dt>Author</dt>
                  <dd>{row.authorName}</dd>
                </div>
                <div>
                  <dt>Updated</dt>
                  <dd>{formatWhen(row.updatedAt)}</dd>
                </div>
              </dl>

              <footer className="finding-note-card__foot">
                <Button variant="secondary" size="sm" onClick={() => onOpen(row)}>
                  View
                </Button>
                {mayEdit ? (
                  <>
                    <Button variant="secondary" size="sm" onClick={() => onEdit(row)}>
                      {locked ? 'Unlock' : 'Edit'}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={locked}
                      onClick={() => onDelete(row)}
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
              </footer>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
