'use client';

import { useEffect, useMemo, useState } from 'react';
import { CountLedger } from '@/components/admin/CountLedger';
import { CommentForm, type ReviewNoteOption } from '@/components/admin/reviews/CommentForm';
import styles from '@/components/admin/reviews/styles';
import { ThreadList } from '@/components/admin/reviews/ThreadList';
import { ThreadPanel } from '@/components/admin/reviews/ThreadPanel';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { Select } from '@/components/ui/Select';
import { canCreateRootFeedback, type AdminRole } from '@/lib/admin/access';
import { getQuestionById } from '@/lib/admin/responseQuestions';
import { useSurveyWindow } from '@/lib/admin/useSurveyWindow';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  SEVERITY_RANK,
  STATUS_LABELS,
  TARGET_LABELS,
  createComment,
  createReply,
  deleteComment,
  setThreadStatus,
  subscribeFeedback,
  subscribeFeedbackForTarget,
  updateComment,
  type FeedbackAuthor,
  type FeedbackComment,
  type FeedbackSeverity,
  type FeedbackStatus,
  type FeedbackTargetType,
  type RootCommentInput,
} from '@/lib/firebase/adviserFeedback';
import { subscribeNotes } from '@/lib/firebase/findingNotes';
import { useQueryParam } from '@/lib/navigation/useQueryParam';

const SEVERITY_FILTERS = ['All severities', 'Suggestion', 'Required fix', 'Approved'];
const TARGET_FILTERS = ['All targets', 'Note', 'Question', 'Instrument'];
const SORTS = ['Newest', 'Oldest', 'Severity', 'Most replies'];

function statusFromFilter(label: string): FeedbackStatus | 'all' {
  if (label === 'Open') return 'open';
  if (label === 'Addressed') return 'addressed';
  if (label === 'Resolved') return 'resolved';
  return 'all';
}

function severityFromFilter(label: string): FeedbackSeverity | 'all' {
  if (label === 'Suggestion') return 'suggestion';
  if (label === 'Required fix') return 'required_fix';
  if (label === 'Approved') return 'approved';
  return 'all';
}

function targetFromFilter(label: string): FeedbackTargetType | 'all' {
  if (label === 'Note') return 'note';
  if (label === 'Question') return 'question';
  if (label === 'Instrument') return 'instrument';
  return 'all';
}

function authorFrom(user: {
  uid: string;
  email: string;
  name?: string;
  role: AdminRole | null;
}): FeedbackAuthor | null {
  if (user.role !== 'admin' && user.role !== 'adviser' && user.role !== 'superadmin') return null;
  const name = (user.name || user.email || 'Staff').trim().slice(0, 120);
  return { uid: user.uid, name: name || 'Staff', role: user.role };
}

/**
 * Review inbox. Pass `fixedTarget` to embed the same thread UI on a finding note.
 */
export function ReviewInbox({
  fixedTarget,
  compact = false,
}: {
  fixedTarget?: { targetType: FeedbackTargetType; targetId: string; label?: string };
  compact?: boolean;
}) {
  const { user, isSuperadmin } = useAuth();
  const { config } = useSurveyWindow();
  const threadParam = useQueryParam('thread');
  const role = user?.role ?? null;
  const canStart = canCreateRootFeedback(role);
  const fixedId = fixedTarget?.targetId ?? '';

  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [notes, setNotes] = useState<ReviewNoteOption[]>([]);
  const [notesLoading, setNotesLoading] = useState(!fixedTarget);
  const [notesError, setNotesError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [severityFilter, setSeverityFilter] = useState('All severities');
  const [targetFilter, setTargetFilter] = useState('All targets');
  const [sortBy, setSortBy] = useState('Newest');
  const [mineOnly, setMineOnly] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FeedbackComment | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  /** Full-page: composer collapsed so the inbox stays above the fold. Compact keeps it open. */
  const [composerOpen, setComposerOpen] = useState(compact);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const onRows = (rows: FeedbackComment[]) => {
      setComments(rows);
      setLoading(false);
    };
    const onError = (message: string) => {
      setError(message);
      setLoading(false);
    };
    const unsub = fixedId
      ? subscribeFeedbackForTarget(fixedId, onRows, onError)
      : subscribeFeedback(onRows, onError);
    return () => unsub();
  }, [user, fixedId]);

  useEffect(() => {
    if (!user || fixedId) {
      setNotesLoading(false);
      return;
    }
    setNotesLoading(true);
    const unsub = subscribeNotes(
      (rows) => {
        setNotes(rows.map((row) => ({ id: row.id, title: row.title })));
        setNotesError(null);
        setNotesLoading(false);
      },
      (message) => {
        setNotesError(message);
        setNotesLoading(false);
      },
    );
    return () => unsub();
  }, [user, fixedId]);

  const noteTitle = useMemo(() => {
    const map = new Map(notes.map((note) => [note.id, note.title]));
    return map;
  }, [notes]);

  const targetLabelFor = (row: FeedbackComment) => {
    if (fixedTarget && row.targetId === fixedTarget.targetId && fixedTarget.label) {
      return fixedTarget.label;
    }
    if (row.targetType === 'note') return noteTitle.get(row.targetId) || 'Finding note';
    if (row.targetType === 'question') return getQuestionById(row.targetId)?.title || row.targetId;
    return `Instrument ${row.targetId}`;
  };

  const replyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const row of comments) {
      if (!row.parentId) continue;
      counts.set(row.parentId, (counts.get(row.parentId) ?? 0) + 1);
    }
    return counts;
  }, [comments]);

  const roots = useMemo(() => {
    const status = statusFromFilter(statusFilter);
    const severity = severityFromFilter(severityFilter);
    const target = fixedTarget ? fixedTarget.targetType : targetFromFilter(targetFilter);
    let list = comments.filter((row) => {
      if (row.parentId) return false;
      if (fixedTarget && (row.targetType !== fixedTarget.targetType || row.targetId !== fixedTarget.targetId)) {
        return false;
      }
      if (status !== 'all' && row.status !== status) return false;
      if (severity !== 'all' && row.severity !== severity) return false;
      if (!fixedTarget && target !== 'all' && row.targetType !== target) return false;
      if (mineOnly && user && row.authorUid !== user.uid) return false;
      return true;
    });
    list = [...list];
    list.sort((a, b) => {
      if (sortBy === 'Oldest') return a.createdAtMs - b.createdAtMs;
      if (sortBy === 'Severity') {
        const rankA = a.severity ? SEVERITY_RANK[a.severity] : 9;
        const rankB = b.severity ? SEVERITY_RANK[b.severity] : 9;
        if (rankA !== rankB) return rankA - rankB;
        return b.updatedAtMs - a.updatedAtMs;
      }
      if (sortBy === 'Most replies') {
        const countA = replyCounts.get(a.id) ?? a.replyCount;
        const countB = replyCounts.get(b.id) ?? b.replyCount;
        if (countA !== countB) return countB - countA;
        return b.updatedAtMs - a.updatedAtMs;
      }
      return b.updatedAtMs - a.updatedAtMs;
    });
    return list;
  }, [
    comments,
    statusFilter,
    severityFilter,
    targetFilter,
    sortBy,
    mineOnly,
    user,
    fixedTarget,
    replyCounts,
  ]);

  useEffect(() => {
    if (!threadParam || fixedTarget) return;
    if (roots.some((row) => row.id === threadParam)) setSelectedId(threadParam);
  }, [threadParam, roots, fixedTarget]);

  useEffect(() => {
    if (loading || !selectedId) return;
    if (roots.some((row) => row.id === selectedId)) return;
    setSelectedId(null);
  }, [loading, roots, selectedId]);

  useEffect(() => {
    if (!compact || selectedId || threadParam) return;
    if (roots.length === 1) setSelectedId(roots[0]?.id ?? null);
  }, [compact, selectedId, threadParam, roots]);

  const selected = roots.find((row) => row.id === selectedId) ?? null;
  const replies = useMemo(() => {
    if (!selected) return [];
    return comments
      .filter((row) => row.parentId === selected.id)
      .sort((a, b) => a.createdAtMs - b.createdAtMs || a.id.localeCompare(b.id));
  }, [comments, selected]);

  const approved =
    fixedTarget?.targetType === 'note' &&
    comments.some(
      (row) =>
        !row.parentId &&
        row.targetType === 'note' &&
        row.targetId === fixedTarget.targetId &&
        row.severity === 'approved',
    );

  const author = user ? authorFrom(user) : null;
  const instrumentId = config.instrumentVersion || 'v1';
  const lockedNotes: ReviewNoteOption[] | undefined = fixedTarget
    ? [{ id: fixedTarget.targetId, title: fixedTarget.label || targetLabelFor({
        id: fixedTarget.targetId,
        targetType: fixedTarget.targetType,
        targetId: fixedTarget.targetId,
        comment: '',
        severity: null,
        status: null,
        parentId: null,
        authorUid: '',
        authorName: '',
        authorRole: '',
        createdAtMs: 0,
        updatedAtMs: 0,
        resolvedAtMs: null,
        replyCount: 0,
        edited: false,
      }) }]
    : notes;

  const run = async (work: () => Promise<void>, success: string) => {
    if (!author) throw new Error('Sign in again before commenting.');
    setBusy(true);
    setBanner(null);
    setError(null);
    try {
      await work();
      setBanner(success);
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = (input: RootCommentInput) =>
    run(async () => {
      if (!author) return;
      const id = await createComment(input, author, {
        noteIds:
          input.targetType === 'note'
            ? (lockedNotes ?? []).map((note) => note.id)
            : undefined,
      });
      setSelectedId(id);
      if (!compact) setComposerOpen(false);
    }, 'Review comment saved.');

  const handleReply = (parentId: string, comment: string) =>
    run(async () => {
      if (!author) return;
      await createReply(parentId, comment, author);
    }, 'Reply saved.');

  const handleEdit = (id: string, comment: string) =>
    run(() => updateComment(id, comment), 'Comment updated.');

  const handleStatus = async (id: string, status: FeedbackStatus) => {
    setBusy(true);
    setBanner(null);
    setError(null);
    try {
      await setThreadStatus(id, status, role);
      setBanner(`Marked ${STATUS_LABELS[status].toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not update that thread.');
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    try {
      await deleteComment(deleteTarget.id);
      if (selectedId === deleteTarget.id) setSelectedId(null);
      setBanner('Comment deleted.');
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error && err.message ? err.message : 'Could not delete that comment.');
    } finally {
      setDeleteBusy(false);
    }
  };

  const filtersActive =
    statusFilter !== 'All statuses' ||
    severityFilter !== 'All severities' ||
    targetFilter !== 'All targets' ||
    mineOnly;

  const shellClass = [styles.shell, compact ? styles.compact : null].filter(Boolean).join(' ');
  const allRoots = useMemo(
    () => comments.filter((row) => !row.parentId),
    [comments],
  );
  const kpis = useMemo(() => {
    const open = allRoots.filter((r) => r.status === 'open').length;
    const addressed = allRoots.filter((r) => r.status === 'addressed').length;
    const resolved = allRoots.filter((r) => r.status === 'resolved').length;
    return { total: allRoots.length, open, addressed, resolved };
  }, [allRoots]);
  const emptyDataset = !loading && !error && allRoots.length === 0;

  const toggleStatus = (label: string) =>
    setStatusFilter((current) => (current === label ? 'All statuses' : label));

  const clearFilters = () => {
    setStatusFilter('All statuses');
    setSeverityFilter('All severities');
    setTargetFilter('All targets');
    setMineOnly(false);
  };

  return (
    <div className={shellClass}>
      {approved ? <p className={styles.approved}>Approved</p> : null}

      {!compact ? (
        <CountLedger
          ariaLabel="Reviews by status"
          label="Threads"
          total={kpis.total}
          totalNote="review comments"
          empty={emptyDataset}
          loading={loading}
          rows={[
            {
              label: 'Open',
              value: kpis.open,
              note: 'awaiting response',
              active: statusFilter === 'Open',
              onSelect: () => toggleStatus('Open'),
            },
            {
              label: 'Addressed',
              value: kpis.addressed,
              note: 'proponent replied',
              active: statusFilter === 'Addressed',
              onSelect: () => toggleStatus('Addressed'),
            },
            {
              label: 'Resolved',
              value: kpis.resolved,
              note: 'closed by adviser',
              active: statusFilter === 'Resolved',
              onSelect: () => toggleStatus('Resolved'),
            },
          ]}
        />
      ) : null}

      <div className="inq-toolbar" role="search">
        {compact ? (
          <div className="inq-toolbar__sort">
            <Select
              label="Status"
              options={['All statuses', 'Open', 'Addressed', 'Resolved']}
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </div>
        ) : null}
        <div className="inq-toolbar__sort">
          <Select
            label="Severity"
            options={SEVERITY_FILTERS}
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          />
        </div>
        {fixedTarget ? null : (
          <div className="inq-toolbar__sort">
            <Select
              label="Target"
              options={TARGET_FILTERS}
              value={targetFilter}
              onChange={(event) => setTargetFilter(event.target.value)}
            />
          </div>
        )}
        <div className="inq-toolbar__sort">
          <Select
            label="Sort"
            options={SORTS}
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
          />
        </div>
        <div className={styles.toolbarEnd}>
          <label className="ws-toggle">
            <input
              type="checkbox"
              checked={mineOnly}
              onChange={(event) => setMineOnly(event.target.checked)}
            />
            Mine
          </label>
          {canStart && !compact ? (
            <button
              type="button"
              className={`${styles.btn}${composerOpen ? '' : ` ${styles.btnPrimary}`}`}
              aria-expanded={composerOpen}
              onClick={() => setComposerOpen((open) => !open)}
            >
              {composerOpen ? 'Hide form' : 'New review'}
            </button>
          ) : null}
        </div>
        <p className="visually-hidden" aria-live="polite">
          {loading || error ? '' : `${roots.length} thread${roots.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {canStart && (composerOpen || compact) ? (
        <div className={styles.composer}>
          <div className={styles.composerHead}>
            <h2 className={styles.heading}>{fixedTarget ? 'Add a review' : 'New review'}</h2>
          </div>
          {notesError && !fixedTarget ? (
            <p className="na-error" role="alert">
              {notesError}
            </p>
          ) : null}
          <CommentForm
            mode="root"
            lockedTarget={
              fixedTarget
                ? {
                    targetType: fixedTarget.targetType,
                    targetId: fixedTarget.targetId,
                    label: fixedTarget.label || TARGET_LABELS[fixedTarget.targetType],
                  }
                : null
            }
            notes={lockedNotes}
            notesLoading={notesLoading}
            instrumentId={instrumentId}
            busy={busy}
            onSubmit={handleCreate}
          />
        </div>
      ) : null}

      {!canStart && compact ? (
        <p className={styles.empty}>
          Advisers start review threads. You can reply and mark a thread addressed.
        </p>
      ) : null}

      {error ? (
        <div className={styles.state} role="alert">
          <h2 className={styles.heading}>Could not load reviews</h2>
          <p className={styles.empty}>{error}</p>
        </div>
      ) : null}
      {banner ? (
        <p role="status" className={styles.note}>
          {banner}
        </p>
      ) : null}

      {loading ? (
        <p className={styles.note} role="status">
          Loading reviews…
        </p>
      ) : error ? null : emptyDataset ? (
        <div className={styles.state} role="status">
          <h2 className={styles.heading}>
            {fixedTarget ? 'No comments on this note yet' : 'No review threads yet'}
          </h2>
          <p className={styles.empty}>
            {fixedTarget
              ? 'Adviser feedback will appear here when a review is started.'
              : 'Advisers can start a thread on a note, question, or instrument version.'}
          </p>
        </div>
      ) : roots.length === 0 ? (
        <div className={styles.state} role="status">
          <h2 className={styles.heading}>No threads match</h2>
          <p className={styles.empty}>Try a different filter.</p>
          {filtersActive ? (
            <button type="button" className={styles.btn} onClick={clearFilters}>
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className={styles.layout}>
          <div className={styles.index}>
            <ThreadList
              roots={roots}
              selectedId={selectedId}
              targetLabel={targetLabelFor}
              replyCounts={replyCounts}
              showTarget={!fixedTarget}
              onSelect={setSelectedId}
            />
          </div>
          <div className={styles.panel}>
            {selected ? (
              <ThreadPanel
                root={selected}
                replies={replies}
                role={role}
                currentUid={user?.uid || ''}
                isSuperadmin={isSuperadmin}
                busy={busy || deleteBusy}
                targetLabel={targetLabelFor(selected)}
                noteHref={
                  !fixedTarget && selected.targetType === 'note'
                    ? `/admin/notes/?note=${encodeURIComponent(selected.targetId)}`
                    : null
                }
                onReply={handleReply}
                onEdit={handleEdit}
                onStatus={handleStatus}
                onRequestDelete={(row) => {
                  setDeleteError(null);
                  setDeleteTarget(row);
                }}
              />
            ) : (
              <p className={styles.panelHint}>Choose a thread to read it and reply.</p>
            )}
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title="Delete this comment?"
        body={
          deleteTarget?.parentId
            ? 'Permanently removes this reply from Firestore. This cannot be undone.'
            : 'Permanently removes this review comment. A thread that still has replies cannot be deleted — remove those replies first.'
        }
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
