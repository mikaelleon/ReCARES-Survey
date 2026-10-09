'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CommentForm } from '@/components/admin/reviews/CommentForm';
import styles from '@/components/admin/reviews/reviews.module.css';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { canResolveThread, type AdminRole } from '@/lib/admin/access';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  commentInputHasErrors,
  validateCommentInput,
  type FeedbackComment,
  type FeedbackSeverity,
  type FeedbackStatus,
} from '@/lib/firebase/adviserFeedback';

function severityTone(severity: FeedbackSeverity): 'amber' | 'danger' | 'emerald' {
  if (severity === 'required_fix') return 'danger';
  if (severity === 'approved') return 'emerald';
  return 'amber';
}

function statusTone(status: FeedbackStatus): 'amber' | 'neutral' | 'emerald' {
  if (status === 'resolved') return 'emerald';
  if (status === 'addressed') return 'neutral';
  return 'amber';
}

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
  deleteHint,
  onEdit,
  onRequestDelete,
}: {
  row: FeedbackComment;
  currentUid: string;
  isSuperadmin: boolean;
  busy: boolean;
  canDelete: boolean;
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
    <article className={styles.comment}>
      <div className={styles.badges}>
        {row.severity ? (
          <StatusBadge tone={severityTone(row.severity)}>{SEVERITY_LABELS[row.severity]}</StatusBadge>
        ) : null}
        {row.status ? (
          <StatusBadge tone={statusTone(row.status)}>{STATUS_LABELS[row.status]}</StatusBadge>
        ) : null}
      </div>
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
        {row.authorName}
        {' · '}
        {formatWhen(row.updatedAtMs)}
        {row.edited ? <span className={styles.edited}> · Edited</span> : null}
      </p>
      <div className={styles.actions}>
        {mine && !editing ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => {
              setDraft(row.comment);
              setError(null);
              setEditing(true);
            }}
          >
            Edit
          </Button>
        ) : null}
        {mine && editing ? (
          <>
            <Button variant="primary" size="sm" disabled={busy} onClick={() => void save()}>
              Save
            </Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </>
        ) : null}
        {mayDelete ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={busy || !canDelete}
            onClick={() => onRequestDelete(row)}
          >
            Delete
          </Button>
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
    <div className={styles.threadPanel}>
      <header className={styles.threadPanelHead}>
        <h2 className={styles.panelTitle}>Thread</h2>
        <p className={styles.meta}>
          {targetLabel}
          {noteHref ? (
            <>
              {' · '}
              <span className={styles.noteLink}>
                <Link href={noteHref}>Open in Findings Log</Link>
              </span>
            </>
          ) : null}
        </p>
      </header>
      <CommentBlock
        row={root}
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
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onStatus(root.id, 'addressed')}>
            Mark addressed
          </Button>
        ) : null}
        {root.status === 'addressed' && canResolve ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onStatus(root.id, 'resolved')}>
            Resolve
          </Button>
        ) : null}
        {resolved && canResolve ? (
          <Button variant="secondary" size="sm" disabled={busy} onClick={() => void onStatus(root.id, 'open')}>
            Reopen
          </Button>
        ) : null}
      </div>
      {replies.length > 0 ? (
        <div>
          <h3 className={styles.columnTitle}>Replies</h3>
          {replies.map((reply) => (
            <div key={reply.id} className={styles.reply}>
              <CommentBlock
                row={reply}
                currentUid={currentUid}
                isSuperadmin={isSuperadmin}
                busy={busy}
                canDelete
                onEdit={onEdit}
                onRequestDelete={onRequestDelete}
              />
            </div>
          ))}
        </div>
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
