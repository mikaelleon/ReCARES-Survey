'use client';

import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Eye,
  FilePen,
  Lock,
  Radio,
  RefreshCw,
  Rocket,
  Save,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Inspector } from '@/components/admin/builder/Inspector';
import { PreviewModal } from '@/components/admin/builder/PreviewModal';
import { QuestionList } from '@/components/admin/builder/QuestionList';
import { useBuilderView } from '@/components/admin/builder/useBuilderView';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { PageHeading } from '@/components/admin/PageHeading';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SkelLine } from '@/components/ui/Skeleton';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  createDraft,
  deleteDraft,
  getInstrument,
  listInstruments,
  publishDraft,
  saveDraft,
  suggestNextVersion,
  type InstrumentList,
  type InstrumentSummary,
} from '@/lib/firebase/instruments';
import { getSurveyConfigRecord } from '@/lib/firebase/surveyConfig';

export interface BuilderBackend {
  list: () => Promise<InstrumentList>;
  get: (version: string) => Promise<Instrument | null>;
  liveVersion: () => Promise<string>;
  suggestVersion: () => Promise<string>;
  save: (inst: Instrument, by: { uid: string; name: string }) => Promise<void>;
  create: (base: Instrument, version: string, by: { uid: string; name: string }) => Promise<Instrument>;
  publish: (inst: Instrument, previousLive: string | null, by: { uid: string; name: string }) => Promise<void>;
  remove: (version: string) => Promise<void>;
}

export const firestoreBackend: BuilderBackend = {
  list: listInstruments,
  get: getInstrument,
  liveVersion: async () => (await getSurveyConfigRecord()).config.instrumentVersion,
  suggestVersion: suggestNextVersion,
  save: saveDraft,
  create: createDraft,
  publish: publishDraft,
  remove: deleteDraft,
};
import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import { lintInstrument, blankQuestion, isCoreCode, nextQuestionCode, nextStepId } from '@/survey/lint';
import {
  cloneInstrument,
  conditionRefs,
  dropConditionRef,
  renameConditionRef,
  sortQuestionsByStep,
  type Condition,
  type Instrument,
} from '@/survey/model';

type Selection = { kind: 'question' | 'step'; id: string } | null;

const STATUS_LABEL: Record<string, string> = { draft: 'Draft', published: 'Published', archived: 'Archived' };

/** Apply `fn` to every condition slot in the instrument. */
function mapConditions(d: Instrument, fn: (c: Condition | undefined) => Condition | undefined) {
  for (const q of d.questions) {
    q.showWhen = fn(q.showWhen);
    if (!q.showWhen) delete q.showWhen;
    q.skipCodeWhen = fn(q.skipCodeWhen);
    if (!q.skipCodeWhen) delete q.skipCodeWhen;
    for (const o of q.options ?? []) {
      o.showWhen = fn(o.showWhen);
      if (!o.showWhen) delete o.showWhen;
    }
    if (q.textVariants) {
      q.textVariants = q.textVariants
        .map((v) => ({ ...v, when: fn(v.when) as Condition }))
        .filter((v) => v.when);
      if (q.textVariants.length === 0) delete q.textVariants;
    }
    for (const h of q.hints ?? []) {
      h.when = fn(h.when);
      if (!h.when) delete h.when;
    }
    if (q.attachForm) {
      const when = fn(q.attachForm.when);
      if (when) q.attachForm = { when };
      else delete q.attachForm;
    }
  }
  for (const s of d.steps) {
    for (const n of s.notes ?? []) {
      n.when = fn(n.when);
      if (!n.when) delete n.when;
    }
    if (s.variants) {
      s.variants = s.variants.map((v) => ({ ...v, when: fn(v.when) as Condition })).filter((v) => v.when);
      if (s.variants.length === 0) delete s.variants;
    }
  }
}

function formatWhen(ms: number | null): string {
  if (!ms) return '';
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/** Version state as an icon plus a word, so it never depends on colour alone. */
function StatusPill({ status, live }: { status: Instrument['status']; live: boolean }) {
  if (live) {
    return (
      <span className="sb-pill sb-pill--live">
        <Radio size={13} aria-hidden="true" /> Live to residents
      </span>
    );
  }
  if (status === 'draft') {
    return (
      <span className="sb-pill sb-pill--draft">
        <FilePen size={13} aria-hidden="true" /> Draft
      </span>
    );
  }
  if (status === 'archived') {
    return (
      <span className="sb-pill sb-pill--archived">
        <Archive size={13} aria-hidden="true" /> Archived
      </span>
    );
  }
  return (
    <span className="sb-pill sb-pill--published">
      <Lock size={13} aria-hidden="true" /> Published
    </span>
  );
}

/** Wired to the signed-in team member, live responses, and Firestore. */
export function SurveyBuilder() {
  const { user, canTeamOps } = useAuth();
  const { records } = useSurveyResponses();
  const by = useMemo(
    () => ({ uid: user?.uid ?? '', name: user?.name || user?.email || 'Team member' }),
    [user],
  );
  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const r of records) {
      const key = r.instrumentVersion || 'v1';
      out[key] = (out[key] ?? 0) + 1;
    }
    return out;
  }, [records]);
  return <BuilderWorkbench backend={firestoreBackend} by={by} allowed={canTeamOps} responseCounts={counts} />;
}

export function BuilderWorkbench({
  backend,
  by,
  allowed,
  responseCounts,
}: {
  backend: BuilderBackend;
  by: { uid: string; name: string };
  allowed: boolean;
  /** Responses collected per instrument version. */
  responseCounts: Record<string, number>;
}) {
  const canTeamOps = allowed;
  const [list, setList] = useState<InstrumentSummary[]>([]);
  const [listWarning, setListWarning] = useState<string | null>(null);
  const [liveVersion, setLiveVersion] = useState<string>(DEFAULT_INSTRUMENT.version);
  const [inst, setInst] = useState<Instrument | null>(null);
  const [baseline, setBaseline] = useState<Instrument | null>(null);
  const [selected, setSelected] = useState<Selection>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [preview, setPreview] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copyVersion, setCopyVersion] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingDeleteQuestion, setPendingDeleteQuestion] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [view, setView] = useBuilderView();

  const readOnly = !inst || inst.status !== 'draft';
  const issues = useMemo(() => (inst ? lintInstrument(inst) : []), [inst]);
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  const createdCodes = useMemo(() => {
    if (!inst || !baseline) return new Set<string>();
    const old = new Set(baseline.questions.map((q) => q.code));
    return new Set(inst.questions.filter((q) => !old.has(q.code)).map((q) => q.code));
  }, [inst, baseline]);

  const flash = useCallback((tone: 'ok' | 'error', text: string) => setNotice({ tone, text }), []);

  // Success notices clear themselves; errors stay until dismissed.
  useEffect(() => {
    if (!notice || notice.tone !== 'ok') return;
    const timer = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // ---- loading ------------------------------------------------------------

  const open = useCallback(
    async (version: string) => {
      setLoading(true);
      setNotice(null);
      try {
        const loaded = await backend.get(version);
        if (!loaded) throw new Error(`Version ${version} was not found.`);
        let base: Instrument | null = null;
        if (loaded.status === 'draft') {
          base = loaded.baseVersion ? await backend.get(loaded.baseVersion).catch(() => null) : null;
          base = base ?? structuredClone(DEFAULT_INSTRUMENT);
        }
        setInst(loaded);
        setBaseline(base);
        setSelected(null);
        setDirty(false);
      } catch (error) {
        flash('error', error instanceof Error ? error.message : 'Could not open that version.');
      } finally {
        setLoading(false);
      }
    },
    [flash, backend],
  );

  const refresh = useCallback(async (): Promise<InstrumentSummary[]> => {
    const [{ rows, warning }, live] = await Promise.all([backend.list(), backend.liveVersion()]);
    setList(rows);
    setListWarning(warning ?? null);
    setLiveVersion(live);
    return rows;
  }, [backend]);

  const bootstrap = useCallback(
    async (cancelled: () => boolean = () => false) => {
      setLoading(true);
      setLoadError(null);
      try {
        const [{ rows, warning }, live] = await Promise.all([backend.list(), backend.liveVersion()]);
        if (cancelled()) return;
        setList(rows);
        setListWarning(warning ?? null);
        setLiveVersion(live);
        const first = rows.find((r) => r.version === live) ?? rows[0];
        if (first) await open(first.version);
        else setLoading(false);
      } catch (error) {
        if (cancelled()) return;
        setLoadError(error instanceof Error ? error.message : 'Could not load the survey versions.');
        setLoading(false);
      }
    },
    [backend, open],
  );

  useEffect(() => {
    if (!canTeamOps) {
      setLoading(false);
      return;
    }
    let stop = false;
    void bootstrap(() => stop);
    return () => {
      stop = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canTeamOps]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ---- editing ---------------------------------------------------------------

  const edit = useCallback((fn: (draft: Instrument) => void) => {
    setInst((prev) => {
      if (!prev || prev.status !== 'draft') return prev;
      const draft = cloneInstrument(prev);
      fn(draft);
      return sortQuestionsByStep(draft);
    });
    setDirty(true);
  }, []);

  const addQuestion = (stepId: string) => {
    if (!inst) return;
    const code = nextQuestionCode(inst);
    edit((d) => {
      d.questions.push(blankQuestion(code, stepId));
    });
    setSelected({ kind: 'question', id: code });
  };

  const addStep = () => {
    if (!inst) return;
    const id = nextStepId(inst);
    edit((d) => {
      d.steps.push({ id, title: 'New step' });
    });
    setSelected({ kind: 'step', id });
  };

  const moveQuestion = (code: string, target: { beforeCode?: string; stepId: string }) =>
    edit((d) => {
      const index = d.questions.findIndex((q) => q.code === code);
      if (index < 0) return;
      const [q] = d.questions.splice(index, 1);
      q!.stepId = target.stepId;
      let at = -1;
      if (target.beforeCode) at = d.questions.findIndex((x) => x.code === target.beforeCode);
      if (at < 0) {
        let last = -1;
        d.questions.forEach((x, i) => {
          if (x.stepId === target.stepId) last = i;
        });
        at = last + 1 || d.questions.length;
      }
      d.questions.splice(at, 0, q!);
    });

  const moveStep = (stepId: string, beforeStepId: string | null) =>
    edit((d) => {
      const from = d.steps.findIndex((s) => s.id === stepId);
      if (from < 0) return;
      const [step] = d.steps.splice(from, 1);
      const to = beforeStepId ? d.steps.findIndex((s) => s.id === beforeStepId) : d.steps.length;
      d.steps.splice(to < 0 ? d.steps.length : to, 0, step!);
    });

  const moveStepBy = (stepId: string, delta: number) =>
    edit((d) => {
      const i = d.steps.findIndex((s) => s.id === stepId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= d.steps.length) return;
      const [step] = d.steps.splice(i, 1);
      d.steps.splice(j, 0, step!);
    });

  const moveWithinStep = (code: string, delta: number) =>
    edit((d) => {
      const q = d.questions.find((x) => x.code === code);
      if (!q) return;
      const same = d.questions.filter((x) => x.stepId === q.stepId);
      const i = same.findIndex((x) => x.code === code);
      const neighbour = same[i + delta];
      if (!neighbour) return;
      const a = d.questions.indexOf(q);
      const b = d.questions.indexOf(neighbour);
      d.questions[a] = neighbour;
      d.questions[b] = q;
    });

  const renameCode = (from: string, to: string): string | null => {
    if (!inst) return 'Nothing is open.';
    if (isCoreCode(from)) return 'The dashboard reads this code, so it cannot change.';
    if (inst.questions.some((q) => q.code === to)) return `${to} is already used.`;
    edit((d) => {
      const q = d.questions.find((x) => x.code === from);
      if (!q) return;
      q.code = to;
      mapConditions(d, (c) => renameConditionRef(c, from, to));
      for (const s of d.steps) for (const n of s.notes ?? []) if (n.after === from) n.after = to;
    });
    setSelected({ kind: 'question', id: to });
    return null;
  };

  const removeQuestion = (code: string) => {
    edit((d) => {
      d.questions = d.questions.filter((q) => q.code !== code);
      mapConditions(d, (c) => dropConditionRef(c, code));
      for (const s of d.steps) {
        s.notes = (s.notes ?? []).map((n) => {
          if (n.after === code) {
            const { after: _gone, ...rest } = n;
            return rest;
          }
          return n;
        });
      }
    });
    setSelected(null);
  };

  const removeStep = (id: string) => {
    edit((d) => {
      d.steps = d.steps.filter((s) => s.id !== id);
    });
    setSelected(null);
  };

  // ---- actions --------------------------------------------------------------

  const run = async (task: () => Promise<void>, fail: string) => {
    setBusy(true);
    setNotice(null);
    try {
      await task();
    } catch (error) {
      flash('error', error instanceof Error ? error.message : fail);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    inst &&
    run(async () => {
      await backend.save(inst, by);
      setDirty(false);
      await refresh();
      flash('ok', `Draft ${inst.version} saved.`);
    }, 'Could not save the draft.');

  const startCopy = async () => {
    if (!inst) return;
    setCopyVersion(await backend.suggestVersion().catch(() => ''));
    setCopyOpen(true);
  };

  const confirmCopy = () =>
    inst &&
    run(async () => {
      const draft = await backend.create(inst, copyVersion, by);
      setCopyOpen(false);
      await refresh();
      await open(draft.version);
      flash('ok', `Draft ${draft.version} created from ${inst.version}.`);
    }, 'Could not create the draft.');

  const confirmPublish = () =>
    inst &&
    run(async () => {
      await backend.publish({ ...inst, status: 'draft' }, liveVersion, by);
      setPublishOpen(false);
      setDirty(false);
      await refresh();
      await open(inst.version);
      flash('ok', `${inst.version} is now live. Residents see it immediately.`);
    }, 'Could not publish.');

  const confirmDelete = () =>
    inst &&
    run(async () => {
      await backend.remove(inst.version);
      setDeleteOpen(false);
      const rows = await refresh();
      const next = rows.find((r) => r.version === liveVersion) ?? rows[0];
      if (next) await open(next.version);
      else setInst(null);
      flash('ok', `Draft ${inst.version} deleted.`);
    }, 'Could not delete the draft.');

  const switchTo = (version: string) => {
    if (dirty && !window.confirm('You have unsaved changes in this draft. Leave without saving?')) return;
    void open(version);
  };

  // Ctrl/Cmd+S saves the draft. Escape clears the selection when no field or dialog has focus.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (dirty && !readOnly && !busy) void save();
        return;
      }
      const typing = event.target instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
      if (event.key === 'Escape' && !typing && !preview && !publishOpen && !copyOpen && !deleteOpen) setSelected(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const responsesOnLive = responseCounts[liveVersion] ?? 0;
  const isLive = inst?.version === liveVersion;

  if (!canTeamOps) {
    return (
      <div className="dash-page">
        <PageHeading
          id="survey-builder-heading"
          title="Survey builder"
          sub="Only Proponents and Superadmins can edit questions and branching."
        />
        <p className="na-error" role="alert">
          Only Proponents and Superadmins can edit questions and branching.
        </p>
      </div>
    );
  }

  return (
    <div className="dash-page sb-page">
      <header className="sb-page__header">
        <h1 id="survey-builder-heading" className="dash-page__title">
          Survey builder
        </h1>
      </header>

      <div className="sb-toolbar" role="toolbar" aria-label="Survey version actions">
        <div className="sb-toolbar__meta">
          <label className="sb-toolbar__pick">
            <span className="sb-field__label">Version</span>
            <select
              className="sb-input"
              value={inst?.version ?? ''}
              disabled={busy || loading || list.length === 0}
              onChange={(e) => switchTo(e.target.value)}
            >
              {list.map((row) => (
                <option key={row.version} value={row.version}>
                  {row.version} · {STATUS_LABEL[row.status]}
                  {row.version === liveVersion ? ' · live' : ''}
                </option>
              ))}
            </select>
          </label>
          <div className="sb-toolbar__pills">
            {inst ? <StatusPill status={inst.status} live={Boolean(isLive)} /> : null}
            {dirty ? (
              <span className="sb-pill sb-pill--dirty">
                <AlertTriangle size={13} aria-hidden="true" /> Unsaved changes
              </span>
            ) : null}
            {inst ? (
              <button
                type="button"
                className={`sb-issues__toggle${errors.length ? ' has-errors' : ''}${warnings.length && !errors.length ? ' has-warnings' : ''}${!errors.length && !warnings.length ? ' is-ready' : ''}`}
                aria-expanded={showIssues}
                aria-controls="sb-issues-list"
                onClick={() => setShowIssues(!showIssues)}
              >
                {errors.length ? (
                  <XCircle size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : warnings.length ? (
                  <AlertTriangle size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <CheckCircle2 size={14} strokeWidth={2.2} aria-hidden="true" />
                )}
                {errors.length === 0 && warnings.length === 0
                  ? 'Ready to publish'
                  : `${errors.length} problem${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`}
              </button>
            ) : null}
          </div>
        </div>

        <div className="sb-toolbar__actions">
          <div className="sb-toolbar__group" role="group" aria-label="Explore">
            <button type="button" className="sb-btn" title="Preview" disabled={!inst || busy} onClick={() => setPreview(true)}>
              <Eye size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Preview</span>
            </button>
            <button type="button" className="sb-btn" title={readOnly ? 'Edit as draft' : 'Copy draft'} disabled={!inst || busy} onClick={startCopy}>
              <Copy size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>{readOnly ? 'Edit as draft' : 'Copy draft'}</span>
            </button>
          </div>

          <div className="sb-toolbar__group sb-toolbar__group--primary" role="group" aria-label="Save and publish">
            <button
              type="button"
              className={`sb-btn sb-btn--primary${inst && !readOnly && !dirty ? ' is-saved' : ''}`}
              disabled={!inst || busy || readOnly || !dirty}
              onClick={save}
              title={readOnly ? 'Frozen versions cannot be changed' : dirty ? 'Save (Ctrl+S)' : 'Nothing to save'}
            >
              {inst && !readOnly && !dirty ? (
                <Check size={16} strokeWidth={2.4} aria-hidden="true" />
              ) : (
                <Save size={16} strokeWidth={2.2} aria-hidden="true" />
              )}
              <span>{inst && !readOnly && !dirty ? 'Saved' : 'Save'}</span>
            </button>
            <button
              type="button"
              className="sb-btn sb-btn--accent"
              disabled={!inst || busy || readOnly || errors.length > 0}
              title={readOnly ? 'Frozen versions cannot be changed' : errors.length ? 'Fix the problems first' : 'Make this version live'}
              onClick={() => setPublishOpen(true)}
            >
              <Rocket size={16} strokeWidth={2.2} aria-hidden="true" />
              <span>Publish</span>
            </button>
          </div>

          <div className="sb-toolbar__group sb-toolbar__group--danger" role="group" aria-label="Delete">
            <button
              type="button"
              className="sb-btn sb-btn--danger sb-btn--icon"
              aria-label="Delete draft"
              title={readOnly ? 'Only drafts can be deleted' : 'Delete draft'}
              disabled={!inst || busy || readOnly}
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {inst && showIssues && issues.length > 0 ? (
        <ul id="sb-issues-list" className="sb-issues__list" aria-label="Validation issues">
          {issues.map((issue, i) => (
            <li key={i} className={`sb-issues__item sb-issues__item--${issue.level}`}>
              <button
                type="button"
                onClick={() => {
                  if (!issue.target) return;
                  const isStep = inst.steps.some((s) => s.id === issue.target);
                  setSelected({ kind: isStep ? 'step' : 'question', id: issue.target });
                }}
              >
                <strong>{issue.level === 'error' ? 'Problem' : 'Warning'}:</strong> {issue.message}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="sb-alerts">
        {inst && readOnly ? (
          <p className="sb-banner">
            <Lock size={15} aria-hidden="true" />
            <span>
              {STATUS_LABEL[inst.status]} versions are frozen, because answers stay tied to them. Use{' '}
              <strong>Edit as draft</strong> to change questions.
            </span>
          </p>
        ) : null}
        {listWarning ? (
          <p className="sb-banner sb-banner--error" role="alert">
            <AlertTriangle size={15} aria-hidden="true" />
            <span>{listWarning}</span>
          </p>
        ) : null}
        {notice && notice.tone === 'error' ? (
          <p className="sb-banner sb-banner--error sb-banner--dismissible" role="alert">
            <AlertTriangle size={15} aria-hidden="true" />
            <span>{notice.text}</span>
            <button type="button" className="sb-banner__close" aria-label="Dismiss message" onClick={() => setNotice(null)}>
              <X size={14} />
            </button>
          </p>
        ) : null}
      </div>

      {loading ? (
        <div className="sb-workspace" aria-busy="true">
          <span className="visually-hidden" role="status">
            Loading the survey
          </span>
          <div className="qlist">
            {[0, 1].map((step) => (
              <div key={step} className="qs qs--skeleton" aria-hidden="true">
                <div className="qs__head">
                  <SkelLine size="md" />
                </div>
                {[0, 1, 2].map((row) => (
                  <div key={row} className="qc qc--skeleton">
                    <SkelLine size="lg" />
                    <SkelLine size="md" />
                    <SkelLine size="sm" />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <aside className="sb-side sb-side--skeleton" aria-hidden="true">
            <SkelLine size="md" />
            <SkelLine size="lg" />
            <SkelLine size="full" />
          </aside>
        </div>
      ) : inst ? (
        <div className="sb-workspace">
          <QuestionList
            inst={inst}
            selected={selected}
            readOnly={readOnly}
            view={view}
            onViewChange={setView}
            onSelectQuestion={(id) => setSelected({ kind: 'question', id })}
            onSelectStep={(id) => setSelected({ kind: 'step', id })}
            onMoveQuestion={moveQuestion}
            onMoveQuestionBy={moveWithinStep}
            onMoveStep={moveStep}
            onMoveStepBy={moveStepBy}
            onAddQuestion={addQuestion}
            onAddStep={addStep}
            onDeleteQuestion={(code) => setPendingDeleteQuestion(code)}
          />
          <aside className={`sb-side${selected ? ' is-open' : ''}`} aria-label="Details">
            <div className="sb-side__bar">
              <button type="button" className="sb-link" onClick={() => setSelected(null)}>
                <ArrowLeft size={16} aria-hidden="true" /> Back to the list
              </button>
            </div>
            <Inspector
              inst={inst}
              baseline={baseline}
              selected={selected}
              createdCodes={createdCodes}
              readOnly={readOnly}
              edit={edit}
              onRenameCode={renameCode}
              onDeleteQuestion={(code) => setPendingDeleteQuestion(code)}
              onDeleteStep={removeStep}
              onMoveWithinStep={moveWithinStep}
              onMoveStepBy={moveStepBy}
            />
          </aside>
        </div>
      ) : (
        <div className="qlist__state" role="alert">
          <h3>{loadError ? 'Could not load the survey' : 'No survey versions found'}</h3>
          <p>{loadError ?? 'There is nothing to edit yet.'}</p>
          <button type="button" className="sb-btn" onClick={() => void bootstrap()}>
            <RefreshCw size={16} aria-hidden="true" />
            <span>Try again</span>
          </button>
        </div>
      )}

      {notice && notice.tone === 'ok' ? (
        <div className="sb-toast" role="status">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{notice.text}</span>
          <button type="button" className="sb-banner__close" aria-label="Dismiss message" onClick={() => setNotice(null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      {preview && inst ? <PreviewModal instrument={inst} onClose={() => setPreview(false)} /> : null}

      {copyOpen ? (
        <Modal open onClose={() => (busy ? undefined : setCopyOpen(false))}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>New draft</h2>
          <p style={{ margin: '0 0 14px', fontSize: 14, lineHeight: 1.5, color: 'var(--text-caption)' }}>
            Copies {inst?.version} into a draft you can edit freely. Residents keep seeing the live version until you publish.
          </p>
          <label className="sb-field">
            <span className="sb-field__label">Version label</span>
            <input className="sb-input" value={copyVersion} maxLength={40} onChange={(e) => setCopyVersion(e.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setCopyOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmCopy} disabled={busy || !copyVersion.trim()}>
              {busy ? 'Creating…' : 'Create draft'}
            </Button>
          </div>
        </Modal>
      ) : null}

      {publishOpen && inst ? (
        <Modal open onClose={() => (busy ? undefined : setPublishOpen(false))}>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>Publish {inst.version}?</h2>
          <ul className="sb-publish">
            <li>
              Residents see {inst.version} straight away. Anyone partway through the old version restarts with a clean form.
            </li>
            <li>
              {liveVersion} is archived and becomes read-only.{' '}
              {responsesOnLive > 0
                ? `Its ${responsesOnLive} response${responsesOnLive === 1 ? '' : 's'} stay tied to ${liveVersion}.`
                : 'It has no responses yet.'}
            </li>
            <li>A published version cannot be edited. Copy it to a new draft to change it.</li>
            {warnings.length > 0 ? (
              <li>
                {warnings.length} warning{warnings.length === 1 ? '' : 's'} to look at: {warnings.slice(0, 3).map((w) => w.message).join(' ')}
              </li>
            ) : null}
            {dirty ? <li>Your unsaved edits are included.</li> : null}
          </ul>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <Button variant="secondary" onClick={() => setPublishOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmPublish} disabled={busy}>
              {busy ? 'Publishing…' : 'Publish now'}
            </Button>
          </div>
        </Modal>
      ) : null}

      <ConfirmDeleteModal
        open={deleteOpen}
        title={`Delete draft ${inst?.version ?? ''}?`}
        body="This permanently removes the draft and everything in it. The live survey is not affected."
        busy={busy}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      <ConfirmDeleteModal
        open={pendingDeleteQuestion != null}
        title={`Delete question ${pendingDeleteQuestion ?? ''}?`}
        body={
          pendingDeleteQuestion && inst
            ? `Rules that read ${pendingDeleteQuestion} lose that part. ${
                inst.questions.some((q) => q.code !== pendingDeleteQuestion && conditionRefs(q.showWhen).has(pendingDeleteQuestion))
                  ? 'Some questions depend on it, and they will show more often.'
                  : 'Nothing else depends on it.'
              } Answers already collected on earlier versions are kept.`
            : ''
        }
        confirmLabel="Delete question"
        onCancel={() => setPendingDeleteQuestion(null)}
        onConfirm={() => {
          if (pendingDeleteQuestion) removeQuestion(pendingDeleteQuestion);
          setPendingDeleteQuestion(null);
        }}
      />
    </div>
  );
}
