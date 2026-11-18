'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CommentForm } from '@/components/admin/reviews/CommentForm';
import styles from '@/components/admin/reviews/styles';
import { Textarea } from '@/components/ui/Textarea';
import { canResolveThread, type AdminRole } from '@/lib/admin/access';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  commentInputHasErrors,
  validateCommentInput,
  type FeedbackComment,
  type FeedbackStatus,
} from '@/lib/firebase/adviserFeedback';

function formatWhen(ms: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString(undefined, {
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

function CommentBlock({
  row,
  currentUid,
  isSuperadmin,
  busy,
  canDelete,
  root = false,
  deleteHint,
  onEdit,
  onRequestDelete,
}: {
  row: FeedbackComment;
  currentUid: string;
  isSuperadmin: boolean;
  busy: boolean;
  canDelete: boolean;
  root?: boolean;
  deleteHint?: string | null;
  onEdit: (id: string, comment: string) => Promise<void>;
  onRequestDelete: (row: FeedbackComment) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row.comment);
  const [error, setError] = useState<string | null>(null);
  const mine = row.authorUid === currentUid;
  const mayDelete = mine || isSuperadmin;

  const save = async () => {
    const fieldErrors = validateCommentInput({ comment: draft }, { mode: 'reply' });
    if (commentInputHasErrors(fieldErrors)) {
      setError(fieldErrors.comment || 'Fix the highlighted fields.');
      return;
    }
    setError(null);
    try {
      await onEdit(row.id, draft.trim());
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not update that comment.');
    }
  };

  return (
    <article className={`${styles.comment} ${root ? styles.commentRoot : styles.commentReply}`}>
      {editing ? (
        <Textarea
          label="Comment"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          error={error}
          helperText={`${draft.trim().length}/1000`}
          disabled={busy}
        />
      ) : (
        <p className={styles.commentBody}>{row.comment}</p>
      )}
      <p className={styles.meta}>
        {root && row.severity ? (
          <>
            {row.severity === 'required_fix' ? (
              <strong>{SEVERITY_LABELS[row.severity]}</strong>
            ) : (
              SEVERITY_LABELS[row.severity]
            )}
            {' · '}
          </>
        ) : null}
        {root && row.status ? `${STATUS_LABELS[row.status]} · ` : null}
        {row.authorName}
        {' · '}
        {formatWhen(row.updatedAtMs)}
        {row.edited ? ' · Edited' : null}
      </p>
      <div className={styles.actions}>
        {mine && !editing ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => {
              setDraft(row.comment);
              setError(null);
              setEditing(true);
            }}>
            Edit
          </button>
        ) : null}
        {mine && editing ? (
          <>
            <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} disabled={busy} onClick={() => void save()}>
              Save
            </button>
            <button type="button" className={styles.btn} disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </>
        ) : null}
        {mayDelete ? (
          <button type="button" className={`${styles.btn} ${styles.btnDanger}`} disabled={busy || !canDelete} onClick={() => onRequestDelete(row)}>
            Delete
          </button>
        ) : null}
      </div>
      {mayDelete && !canDelete && deleteHint ? (
        <p className={styles.meta}>{deleteHint}</p>
      ) : null}
    </article>
  );
}

/**
 * One review thread: root comment, chronological replies, and status actions.
 */
export function ThreadPanel({
  root,
  replies,
  role,
  currentUid,
  isSuperadmin,
  busy,
  targetLabel,
  noteHref,
  onReply,
  onEdit,
  onStatus,
  onRequestDelete,
}: {
  root: FeedbackComment;
  replies: FeedbackComment[];
  role: AdminRole | null;
  currentUid: string;
  isSuperadmin: boolean;
  busy: boolean;
  targetLabel: string;
  noteHref?: string | null;
  onReply: (parentId: string, comment: string) => Promise<void>;
  onEdit: (id: string, comment: string) => Promise<void>;
  onStatus: (id: string, status: FeedbackStatus) => Promise<void>;
  onRequestDelete: (row: FeedbackComment) => void;
}) {
  const canResolve = canResolveThread(role);
  const staff = role === 'admin' || role === 'adviser' || role === 'superadmin';
  const resolved = root.status === 'resolved';
  const replyCount = Math.max(root.replyCount, replies.length);
  const rootDeleteBlocked = replyCount > 0;

  return (
    <div className={styles.thread}>
      <header className={styles.threadHead}>
        <h2 className={styles.heading}>{targetLabel}</h2>
        {noteHref ? (
          <p className={styles.meta}>
            <Link className={styles.link} href={noteHref}>
              Open in Findings Log
            </Link>
          </p>
        ) : null}
      </header>
      <CommentBlock
        row={root}
        root
        currentUid={currentUid}
        isSuperadmin={isSuperadmin}
        busy={busy}
        canDelete={!rootDeleteBlocked}
        deleteHint="Delete the replies before deleting this review. A thread with replies cannot be removed."
        onEdit={onEdit}
        onRequestDelete={onRequestDelete}
      />
      <div className={styles.actions}>
        {root.status === 'open' && staff ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => void onStatus(root.id, 'addressed')}>
            Mark addressed
          </button>
        ) : null}
        {root.status === 'addressed' && canResolve ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => void onStatus(root.id, 'resolved')}>
            Resolve
          </button>
        ) : null}
        {resolved && canResolve ? (
          <button type="button" className={styles.btn} disabled={busy} onClick={() => void onStatus(root.id, 'open')}>
            Reopen
          </button>
        ) : null}
      </div>
      {replies.length > 0 ? (
        <ul className={styles.replies} aria-label="Replies">
          {replies.map((reply) => (
            <li key={reply.id}>
              <CommentBlock
                row={reply}
                currentUid={currentUid}
                isSuperadmin={isSuperadmin}
                busy={busy}
                canDelete
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {resolved ? (
        <p className={styles.empty}>
          This thread is resolved. An adviser can reopen it before anyone replies.
        </p>
      ) : staff ? (
        <CommentForm
          mode="reply"
          busy={busy}
          onSubmit={async (input) => {
            await onReply(root.id, input.comment);
          }}
        />
      ) : null}
    </div>
  );
}
