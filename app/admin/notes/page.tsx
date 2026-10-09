'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FilePenLine,
  NotebookPen,
  Sparkles,
} from 'lucide-react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { FindingNoteDetail } from '@/components/admin/notes/FindingNoteDetail';
import { FindingNoteForm } from '@/components/admin/notes/FindingNoteForm';
import { FindingNotesList } from '@/components/admin/notes/FindingNotesList';
import { subscribeFeedback } from '@/lib/firebase/adviserFeedback';
import {
  FINDING_SORT_OPTIONS,
  FindingNotesToolbar,
  type FindingSortOption,
} from '@/components/admin/notes/FindingNotesToolbar';
import { Button } from '@/components/ui/Button';
import { StatSkeleton } from '@/components/ui/Skeleton';
import { canWriteFindingNotes } from '@/lib/admin/access';
import { RESPONSE_QUESTION_OPTIONS } from '@/lib/admin/responseQuestions';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  createNote,
  deleteNote,
  FINDING_STATUS_LABELS,
  FINDING_TAG_LABELS,
  subscribeNotes,
  updateNote,
  type FindingNoteInput,
  type FindingNoteRow,
  type FindingStatus,
  type FindingTag,
} from '@/lib/firebase/findingNotes';
import { useQueryParam } from '@/lib/navigation/useQueryParam';

function tagFromFilter(label: string): FindingTag | 'all' {
  const hit = (Object.keys(FINDING_TAG_LABELS) as FindingTag[]).find(
    (t) => FINDING_TAG_LABELS[t] === label,
  );
  return hit ?? 'all';
}

function statusFromFilter(label: string): FindingStatus | 'all' {
  const hit = (Object.keys(FINDING_STATUS_LABELS) as FindingStatus[]).find(
    (s) => FINDING_STATUS_LABELS[s] === label,
  );
  return hit ?? 'all';
}

function questionIdFromFilter(label: string): string | 'all' {
  if (label === 'All questions') return 'all';
  return RESPONSE_QUESTION_OPTIONS.find((q) => q.title === label)?.id ?? 'all';
}

function FindingNotesContent() {
  const { user, can, isSuperadmin } = useAuth();
  const canView = can('findingNotes');
  const canWrite = canWriteFindingNotes(
    user
      ? {
          fullName: user.name || '',
          email: user.email,
          requestedRole: user.requestedRole || '',
          role: user.role,
          status: user.status === 'active' ? 'active' : 'pending',
          permissions: user.permissions,
        }
      : null,
  );

  const questionParam = useQueryParam('questionId');
  const newParam = useQueryParam('new');
  const noteParam = useQueryParam('note');
  const openedNote = useRef<string | null>(null);

  const [rows, setRows] = useState<FindingNoteRow[]>([]);
  const [approvedIds, setApprovedIds] = useState<ReadonlySet<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('All tags');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [questionFilter, setQuestionFilter] = useState('All questions');
  const [sortBy, setSortBy] = useState<FindingSortOption>(FINDING_SORT_OPTIONS[0]);
  const [mineOnly, setMineOnly] = useState(false);

  const [selected, setSelected] = useState<FindingNoteRow | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editTarget, setEditTarget] = useState<FindingNoteRow | null>(null);
  const [presetQuestionId, setPresetQuestionId] = useState<string | null>(null);
  const [formBusy, setFormBusy] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<FindingNoteRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!canView || !user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const unsub = subscribeNotes(
      (next) => {
        setRows(next);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [canView, user]);

  useEffect(() => {
    if (!canView || !user) return;
    return subscribeFeedback(
      (feedback) => {
        const ids = new Set<string>();
        for (const row of feedback) {
          if (!row.parentId && row.targetType === 'note' && row.severity === 'approved') {
            ids.add(row.targetId);
          }
        }
        setApprovedIds(ids);
      },
      () => {
        /* The note detail reports review load errors. */
      },
    );
  }, [canView, user]);

  useEffect(() => {
    if (!canView || !canWrite) return;
    if (newParam === '1' || (questionParam && questionParam.length > 0)) {
      setPresetQuestionId(questionParam || null);
      setFormMode('create');
      setEditTarget(null);
      setSelected(null);
    }
  }, [canView, canWrite, newParam, questionParam]);

  useEffect(() => {
    if (!noteParam || newParam === '1' || openedNote.current === noteParam) return;
    const hit = rows.find((row) => row.id === noteParam);
    if (!hit) return;
    openedNote.current = noteParam;
    setSelected(hit);
  }, [noteParam, newParam, rows]);

  const selectedId = selected?.id;
  useEffect(() => {
    if (!selectedId) return;
    const fresh = rows.find((r) => r.id === selectedId);
    if (fresh) setSelected(fresh);
    else setSelected(null);
  }, [rows, selectedId]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    const tag = tagFromFilter(tagFilter);
    const status = statusFromFilter(statusFilter);
    const questionId = questionIdFromFilter(questionFilter);
    let list = rows.filter((row) => {
      if (mineOnly && user && row.authorUid !== user.uid) return false;
      if (tag !== 'all' && row.tag !== tag) return false;
      if (status !== 'all' && row.status !== status) return false;
      if (questionId !== 'all' && row.questionId !== questionId) return false;
      if (q) {
        const hay = `${row.title} ${row.body}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    list = [...list];
    list.sort((a, b) => {
      if (sortBy === 'Title (A–Z)') {
        return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      }
      if (sortBy === 'Status') {
        return a.status.localeCompare(b.status) || b.updatedMs - a.updatedMs;
      }
      if (sortBy === 'Created (newest)') return b.createdMs - a.createdMs;
      if (sortBy === 'Created (oldest)') return a.createdMs - b.createdMs;
      if (sortBy === 'Updated (oldest)') return a.updatedMs - b.updatedMs;
      return b.updatedMs - a.updatedMs;
    });
    return list;
  }, [rows, search, tagFilter, statusFilter, questionFilter, sortBy, mineOnly, user]);

  const kpis = useMemo(() => {
    const draft = rows.filter((r) => r.status === 'draft').length;
    const reviewed = rows.filter((r) => r.status === 'reviewed').length;
    const final = rows.filter((r) => r.status === 'final').length;
    return { total: rows.length, draft, reviewed, final };
  }, [rows]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setTagFilter('All tags');
    setStatusFilter('All statuses');
    setQuestionFilter('All questions');
    setMineOnly(false);
    setSortBy(FINDING_SORT_OPTIONS[0]);
  }, []);

  const closeForm = useCallback(
    (force = false) => {
      if (formBusy && !force) return;
      setFormMode(null);
      setEditTarget(null);
      setPresetQuestionId(null);
    },
    [formBusy],
  );

  const handleCreate = async (input: FindingNoteInput) => {
    if (!user) return;
    setFormBusy(true);
    setError(null);
    setNote(null);
    try {
      await createNote(input, { uid: user.uid, name: user.name || user.email });
      setNote('Finding note created.');
      setFormBusy(false);
      closeForm(true);
    } catch (err) {
      setFormBusy(false);
      throw err;
    }
  };

  const handleUpdate = async (input: FindingNoteInput) => {
    if (!user || !editTarget) return;
    setFormBusy(true);
    setError(null);
    setNote(null);
    try {
      await updateNote(editTarget.id, input, editTarget, user.uid, isSuperadmin);
      setNote('Finding note updated.');
      setFormBusy(false);
      closeForm(true);
    } catch (err) {
      setFormBusy(false);
      throw err;
    }
  };

  const confirmDelete = async () => {
    if (!user || !deleteTarget) return;
    setDeleteBusy(true);
    setDeleteError(null);
    setError(null);
    setNote(null);
    try {
      await deleteNote(deleteTarget.id, deleteTarget, user.uid, isSuperadmin);
      setNote(`Deleted “${deleteTarget.title}”.`);
      if (selected?.id === deleteTarget.id) setSelected(null);
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error && err.message ? err.message : 'Could not delete that note.',
      );
    } finally {
      setDeleteBusy(false);
    }
  };

  if (!user) return null;

  if (!canView) {
    return (
      <section className="dash-page finding-notes-page" aria-labelledby="finding-notes-title">
        <div className="dash-page__header">
          <h1 id="finding-notes-title" className="dash-page__title">
            Findings Log
          </h1>
        </div>
        <div className="dash-empty" role="status">
          <p className="dash-empty__title">Findings log not enabled</p>
          <p className="dash-empty__secondary">
            Ask a superadmin to turn on the Findings log permission for your account.
          </p>
        </div>
      </section>
    );
  }

  const hasFilters =
    Boolean(search.trim()) ||
    tagFilter !== 'All tags' ||
    statusFilter !== 'All statuses' ||
    questionFilter !== 'All questions' ||
    mineOnly;

  const emptyDataset = !loading && !error && rows.length === 0;

  return (
    <section className="dash-page finding-notes-page" aria-labelledby="finding-notes-title">
      <div className="dash-page__header">
        <div>
          <h1 id="finding-notes-title" className="dash-page__title">
            Findings Log
          </h1>
          <p className="finding-notes-page__intro">
            Analysis notes linked to Responses questions. Advisers can read; only authors (and
            superadmins) can edit.
          </p>
        </div>
        <div className="dash-page__tools">
          {canWrite ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setPresetQuestionId(null);
                setEditTarget(null);
                setFormMode('create');
                setSelected(null);
              }}
            >
              <NotebookPen size={16} strokeWidth={2.2} aria-hidden="true" />
              New note
            </Button>
          ) : (
            <p className="finding-notes-page__readonly" role="status">
              Read-only · Adviser
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <div className="finding-notes-kpis">
          <StatSkeleton count={4} />
        </div>
      ) : (
        <div className="dash-stat-grid finding-notes-kpis" aria-label="Findings summary">
          <article className="dash-stat dash-stat--hero">
            <div className="dash-stat__top">
              <span className="dash-stat__icon" aria-hidden="true">
                <NotebookPen size={16} strokeWidth={2.2} />
              </span>
              <p className="dash-stat__label">Total notes</p>
            </div>
            <p className="dash-stat__value">{emptyDataset ? '—' : kpis.total}</p>
            <p className="dash-stat__caption">Across the team log</p>
          </article>
          <article className="dash-stat dash-stat--neutral">
            <div className="dash-stat__top">
              <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
                <FilePenLine size={16} strokeWidth={2.2} />
              </span>
              <p className="dash-stat__label">Draft</p>
            </div>
            <p className="dash-stat__value">{emptyDataset ? '—' : kpis.draft}</p>
            <p className="dash-stat__caption">Still being written</p>
          </article>
          <article className="dash-stat dash-stat--neutral">
            <div className="dash-stat__top">
              <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
                <Sparkles size={16} strokeWidth={2.2} />
              </span>
              <p className="dash-stat__label">Reviewed</p>
            </div>
            <p className="dash-stat__value">{emptyDataset ? '—' : kpis.reviewed}</p>
            <p className="dash-stat__caption">Ready for feedback</p>
          </article>
          <article className="dash-stat dash-stat--metric">
            <div className="dash-stat__top">
              <span className="dash-stat__icon dash-stat__icon--metric" aria-hidden="true">
                <CheckCircle2 size={16} strokeWidth={2.2} />
              </span>
              <p className="dash-stat__label">Final</p>
            </div>
            <p className="dash-stat__value">{emptyDataset ? '—' : kpis.final}</p>
            <p className="dash-stat__caption">Locked until unlocked</p>
          </article>
        </div>
      )}

      <FindingNotesToolbar
        search={search}
        onSearchChange={setSearch}
        tagFilter={tagFilter}
        onTagFilterChange={setTagFilter}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        questionFilter={questionFilter}
        onQuestionFilterChange={setQuestionFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        mineOnly={mineOnly}
        onMineOnlyChange={setMineOnly}
        resultCount={loading || error ? undefined : shown.length}
      />

      {error && !deleteTarget ? (
        <div className="dash-empty" role="alert">
          <p className="dash-empty__title">Could not load finding notes</p>
          <p className="dash-empty__secondary">{error}</p>
        </div>
      ) : null}
      {note ? (
        <p role="status" className="admin-kanban-note">
          {note}
        </p>
      ) : null}

      {!loading && !error && shown.length === 0 ? (
        <div className="dash-insight finding-notes-empty">
          <div className="dash-empty" role="status">
            <p className="dash-empty__title">
              {rows.length === 0 ? 'No finding notes yet' : 'No notes match'}
            </p>
            <p className="dash-empty__secondary">
              {rows.length === 0
                ? canWrite
                  ? 'Create a note to capture barriers, themes, anomalies, or recommendations.'
                  : 'When proponents add analysis notes, they will appear here.'
                : 'Try a different search or clear filters.'}
            </p>
            {hasFilters ? (
              <button type="button" className="admin-empty__btn" onClick={resetFilters}>
                Reset filters
              </button>
            ) : null}
          </div>
        </div>
      ) : !loading && !error ? (
        <FindingNotesList
          rows={shown}
          currentUid={user.uid}
          canWrite={canWrite}
          approvedIds={approvedIds}
          onOpen={(row) => {
            setSelected(row);
            setFormMode(null);
          }}
          onEdit={(row) => {
            setEditTarget(row);
            setFormMode('edit');
            setSelected(null);
          }}
          onDelete={(row) => {
            setDeleteError(null);
            setDeleteTarget(row);
          }}
        />
      ) : null}

      {selected ? (
        <AdminOverlayPortal>
          <div className="admin-drawer-root" role="presentation">
            <button
              type="button"
              className="admin-drawer__backdrop"
              aria-label="Close detail"
              onClick={() => setSelected(null)}
            />
            <aside className="admin-drawer finding-note-drawer" role="dialog" aria-modal="true">
              <FindingNoteDetail
                note={selected}
                canWrite={canWrite && selected.authorUid === user.uid}
                onEdit={() => {
                  setEditTarget(selected);
                  setFormMode('edit');
                  setSelected(null);
                }}
                onDelete={() => {
                  setDeleteError(null);
                  setDeleteTarget(selected);
                }}
                onClose={() => setSelected(null)}
              />
            </aside>
          </div>
        </AdminOverlayPortal>
      ) : null}

      {formMode ? (
        <AdminOverlayPortal>
          <div className="admin-drawer-root" role="presentation">
            <button
              type="button"
              className="admin-drawer__backdrop"
              aria-label="Close form"
              onClick={() => closeForm()}
            />
            <aside
              className="admin-drawer finding-note-drawer"
              role="dialog"
              aria-modal="true"
              aria-labelledby="finding-form-title"
            >
              <header className="admin-drawer__head">
                <h2 id="finding-form-title" className="admin-drawer__title">
                  {formMode === 'create' ? 'New finding note' : 'Edit finding note'}
                </h2>
                <button type="button" className="admin-drawer__close" onClick={() => closeForm()}>
                  Close
                </button>
              </header>
              <div className="admin-drawer__body">
                <FindingNoteForm
                  mode={formMode}
                  initial={formMode === 'edit' ? editTarget : null}
                  presetQuestionId={formMode === 'create' ? presetQuestionId : null}
                  lockedFinal={formMode === 'edit' && editTarget?.status === 'final'}
                  busy={formBusy}
                  onSubmit={formMode === 'create' ? handleCreate : handleUpdate}
                  onCancel={closeForm}
                />
              </div>
            </aside>
          </div>
        </AdminOverlayPortal>
      ) : null}

      <ConfirmDeleteModal
        open={Boolean(deleteTarget)}
        title={`Delete “${deleteTarget?.title || 'this note'}”?`}
        body="Permanently removes this finding note from Firestore. This cannot be undone."
        busy={deleteBusy}
        error={deleteError}
        onCancel={() => {
          if (deleteBusy) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

export default function AdminFindingNotesPage() {
  return (
    <AdminAppShell>
      <FindingNotesContent />
    </AdminAppShell>
  );
}
