'use client';

import { NoteFeedbackSection } from '@/components/admin/reviews/NoteFeedbackSection';
import { Button } from '@/components/ui/Button';
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

/**
 * Read-only detail panel for one finding note, including its adviser review thread.
 */
export function FindingNoteDetail({
  note,
  canWrite,
  onEdit,
  onDelete,
  onClose,
}: {
  note: FindingNoteRow;
  canWrite: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const question = getQuestionById(note.questionId);
  const locked = note.status === 'final';

  return (
    <article className="finding-note-detail" aria-labelledby="finding-detail-title">
      <header className="finding-note-detail__head">
        <div>
          <h2 id="finding-detail-title" className="finding-note-detail__title">
            {note.title}
          </h2>
          <p className="finding-note-detail__meta">
            {FINDING_TAG_LABELS[note.tag]} · {FINDING_STATUS_LABELS[note.status]} ·{' '}
            {note.authorName}
          </p>
        </div>
        <button type="button" className="admin-drawer__close finding-note-detail__close" onClick={onClose}>
          Close
        </button>
      </header>

      <dl className="finding-note-detail__dl">
        <div>
          <dt>Question</dt>
          <dd>{question?.title || note.questionId}</dd>
        </div>
        <div>
          <dt>Updated</dt>
          <dd>{formatWhen(note.updatedAt)}</dd>
        </div>
        <div>
          <dt>Created</dt>
          <dd>{formatWhen(note.createdAt)}</dd>
        </div>
      </dl>

      <div className="finding-note-detail__body">
        <h3 className="finding-note-detail__sub">Finding</h3>
        <p className="finding-note-detail__text">{note.body}</p>
      </div>

      <div className="finding-note-detail__feedback">
        <h3 className="finding-note-detail__sub">Adviser feedback</h3>
        <NoteFeedbackSection noteId={note.id} noteTitle={note.title} />
      </div>

      {canWrite ? (
        <div className="finding-note-detail__actions">
          <Button variant="secondary" onClick={onEdit}>
            {locked ? 'Revert / edit' : 'Edit'}
          </Button>
          <Button variant="secondary" onClick={onDelete} disabled={locked}>
            Delete
          </Button>
        </div>
      ) : null}
    </article>
  );
}
