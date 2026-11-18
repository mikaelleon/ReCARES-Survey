'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
import { CountLedger } from '@/components/admin/CountLedger';
import { PageHeading } from '@/components/admin/PageHeading';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useAuth } from '@/lib/auth/AuthProvider';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { formatAbsoluteTime, formatRelativeTime } from '@/lib/admin/relativeTime';
import {
  getSurveyConfigRecord,
  listSurveyHistory,
  resetSurveyConfig,
  saveSurveyConfig,
  type SurveyConfigRecord,
  type SurveyHistoryEntry,
} from '@/lib/firebase/surveyConfig';
import {
  DEFAULT_INSTRUMENT_VERSION,
  defaultResidentMessage,
  effectiveSurveyStatus,
  nextInstrumentVersion,
  residentSurveyMessage,
  type SurveyWindowStatus,
} from '@/survey/instrument';

const MESSAGE_MAX = 500;

/** Same research target the Dashboard measures progress against. */
const RESPONDENT_TARGET = 100;

const WINDOW_OPTIONS: { id: SurveyWindowStatus; title: string }[] = [
  { id: 'open', title: 'Open' },
  { id: 'paused', title: 'Paused' },
  { id: 'closed', title: 'Closed' },
];

const MESSAGE_TEMPLATES: { label: string; status: SurveyWindowStatus; text: string }[] = [
  {
    label: 'Maintenance',
    status: 'paused',
    text: 'The survey is paused for a short update. Your saved draft stays on this device. Please check back soon.',
  },
  {
    label: 'Reopening soon',
    status: 'paused',
    text: 'We are reviewing the questions and will reopen the survey shortly. Thank you for your patience.',
  },
  {
    label: 'Thank you',
    status: 'closed',
    text: 'Our needs assessment is now closed. Thank you to every resident of Camella Homes Tibig who took part.',
  },
];

function toLocalInput(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

function normalizeDraftVersion(value: string): string {
  const trimmed = value.trim().slice(0, 40);
  return trimmed || DEFAULT_INSTRUMENT_VERSION;
}

function fmt(ms: number | null | undefined): string {
  return ms == null ? 'none' : formatAbsoluteTime(ms);
}

function describeCountdown(target: number, now: number): string {
  const diff = target - now;
  const abs = Math.abs(diff);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const span =
    abs >= day
      ? `${Math.round(abs / day)} day${Math.round(abs / day) === 1 ? '' : 's'}`
      : abs >= hour
        ? `${Math.round(abs / hour)} hour${Math.round(abs / hour) === 1 ? '' : 's'}`
        : `${Math.max(1, Math.round(abs / minute))} min`;
  return diff >= 0 ? `in ${span}` : `${span} ago`;
}

/** "Mon, Oct 13, 8:00 AM" — the long native input format is hard to read back. */
function friendlyDate(ms: number): string {
  return new Date(ms).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function atHour(base: Date, hour: number): number {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function nextWeekday(from: Date, weekday: number, hour: number): number {
  const d = new Date(from);
  const add = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  d.setHours(hour, 0, 0, 0);
  return d.getTime();
}

function endOfMonth(from: Date): number {
  return new Date(from.getFullYear(), from.getMonth() + 1, 0, 23, 59, 0, 0).getTime();
}

interface Draft {
  status: SurveyWindowStatus;
  version: string;
  message: string;
  opensAt: string;
  closesAt: string;
}

const EMPTY_DRAFT: Draft = {
  status: 'open',
  version: DEFAULT_INSTRUMENT_VERSION,
  message: '',
  opensAt: '',
  closesAt: '',
};

function draftFromRecord(record: SurveyConfigRecord): Draft {
  return {
    status: record.config.status,
    version: record.config.instrumentVersion,
    message: record.config.residentMessage,
    opensAt: toLocalInput(record.config.opensAt),
    closesAt: toLocalInput(record.config.closesAt),
  };
}

function changeSummary(before: Draft, after: Draft): string {
  const parts: string[] = [];
  if (before.status !== after.status) parts.push(`Window ${before.status} → ${after.status}`);
  if (normalizeDraftVersion(before.version) !== normalizeDraftVersion(after.version)) {
    parts.push(
      `Instrument ${normalizeDraftVersion(before.version)} → ${normalizeDraftVersion(after.version)}`,
    );
  }
  if (before.opensAt !== after.opensAt) {
    parts.push(after.opensAt ? `Opens ${fmt(fromLocalInput(after.opensAt))}` : 'Opening date cleared');
  }
  if (before.closesAt !== after.closesAt) {
    parts.push(after.closesAt ? `Closes ${fmt(fromLocalInput(after.closesAt))}` : 'Closing date cleared');
  }
  if (before.message.trim() !== after.message.trim()) parts.push('Resident message updated');
  return parts.join(' · ') || 'Saved without changes';
}

type Confirm =
  | { kind: 'save'; title: string; body: string; label: string }
  | { kind: 'discard'; title: string; body: string; label: string }
  | { kind: 'reset'; title: string; body: string; label: string };

/**
 * Superadmin control for the survey window.
 * Status, optional schedule, instrument version, resident message, preview, and change history.
 */
export function SurveyControlPanel() {
  const { isSuperadmin, user } = useAuth();
  const { records, status: responsesStatus } = useSurveyResponses();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [saved, setSaved] = useState<Draft>(EMPTY_DRAFT);
  const [exists, setExists] = useState(false);
  const [updatedAtMs, setUpdatedAtMs] = useState<number | null>(null);
  const [history, setHistory] = useState<SurveyHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [barHost, setBarHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setBarHost(document.querySelector<HTMLElement>('.admin-app') ?? document.body);
  }, []);

  const patch = (next: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...next }));

  const apply = useCallback((record: SurveyConfigRecord) => {
    const next = draftFromRecord(record);
    setDraft(next);
    setSaved(next);
    setExists(record.exists);
    setUpdatedAtMs(record.updatedAtMs);
  }, []);

  const load = useCallback(async () => {
    apply(await getSurveyConfigRecord());
    setHistory(await listSurveyHistory(8));
  }, [apply]);

  useEffect(() => {
    void load()
      .catch(() => setError('Could not load survey settings.'))
      .finally(() => setLoading(false));
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  // ---- derived ----------------------------------------------------------
  const opensMs = fromLocalInput(draft.opensAt);
  const closesMs = fromLocalInput(draft.closesAt);
  const version = normalizeDraftVersion(draft.version);
  const savedVersion = normalizeDraftVersion(saved.version);

  const scheduleError =
    opensMs != null && closesMs != null && closesMs <= opensMs
      ? 'The closing time must be after the opening time.'
      : null;
  const versionError = draft.version.trim().length > 40 ? 'Keep the version label to 40 characters.' : null;
  const invalid = Boolean(scheduleError || versionError);

  const dirty = JSON.stringify({ ...draft, version }) !== JSON.stringify({ ...saved, version: savedVersion });

  const effective = effectiveSurveyStatus(
    { status: draft.status, opensAt: opensMs, closesAt: closesMs },
    now,
  );
  const previewMessage = residentSurveyMessage(
    {
      status: effective,
      instrumentVersion: version,
      residentMessage: draft.message,
      opensAt: opensMs,
      closesAt: closesMs,
    },
    now,
  );

  const stats = useMemo(() => {
    const stamped = (r: { instrumentVersion?: string }) => r.instrumentVersion || DEFAULT_INSTRUMENT_VERSION;
    const total = records.length;
    const onVersion = records.filter((r) => stamped(r) === savedVersion).length;
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const lastWeek = records.filter((r) => Date.parse(r.submittedAt) >= weekAgo).length;
    const latest = records.reduce<number | null>((best, r) => {
      const t = Date.parse(r.submittedAt);
      return Number.isFinite(t) && (best == null || t > best) ? t : best;
    }, null);
    return { total, onVersion, lastWeek, latest };
  }, [records, savedVersion, now]);

  const ready = responsesStatus === 'ready';
  const versionHasResponses = stats.onVersion > 0;
  const versionChanged = version !== savedVersion;

  const banner = (() => {
    if (effective === 'open') {
      return closesMs != null && closesMs > now
        ? {
            tone: 'open',
            title: 'Open for responses',
            detail: `Closes automatically ${describeCountdown(closesMs, now)} (${formatAbsoluteTime(closesMs)}).`,
          }
        : { tone: 'open', title: 'Open for responses', detail: 'Residents can start and submit now.' };
    }
    if (effective === 'paused' && draft.status === 'open' && opensMs != null && opensMs > now) {
      return {
        tone: 'paused',
        title: 'Scheduled to open',
        detail: `Opens ${describeCountdown(opensMs, now)} (${formatAbsoluteTime(opensMs)}). Until then residents see a waiting message.`,
      };
    }
    if (effective === 'closed' && draft.status === 'open' && closesMs != null) {
      return {
        tone: 'closed',
        title: 'Closed by schedule',
        detail: `The closing time passed ${describeCountdown(closesMs, now)}. Submissions are refused.`,
      };
    }
    return effective === 'paused'
      ? { tone: 'paused', title: 'Paused', detail: 'Residents cannot submit until you reopen it.' }
      : { tone: 'closed', title: 'Closed', detail: 'Residents cannot submit. Data collection is finished.' };
  })();

  // Success messages fade after a few seconds; errors stay until the next action.
  useEffect(() => {
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), 6000);
    return () => window.clearTimeout(timer);
  }, [note]);

  // Plain-language notes about what a schedule will do, shown right under the inputs.
  const scheduleNotes: string[] = [];
  if (draft.status !== 'open' && (opensMs != null || closesMs != null)) {
    scheduleNotes.push(`The schedule is ignored while the window is ${draft.status}. Set it to Open to use it.`);
  }
  if (draft.status === 'open' && opensMs != null && opensMs > now) {
    scheduleNotes.push(`Residents see a waiting message until ${friendlyDate(opensMs)} (${describeCountdown(opensMs, now)}).`);
  }
  if (draft.status === 'open' && closesMs != null && closesMs <= now) {
    scheduleNotes.push('That closing time has already passed, so the survey closes as soon as you save.');
  }

  // ---- guards -----------------------------------------------------------
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // ---- actions ----------------------------------------------------------
  const performSave = useCallback(async () => {
    if (!user || !isSuperadmin) return;
    setSaving(true);
    setError(null);
    setNote(null);
    const wasExisting = exists;
    try {
      const record = await saveSurveyConfig(
        {
          status: draft.status,
          instrumentVersion: version,
          residentMessage: draft.message,
          opensAt: opensMs,
          closesAt: closesMs,
        },
        user.uid,
        { byName: user.name || user.email, text: changeSummary(saved, draft) },
      );
      apply(record);
      setHistory(await listSurveyHistory(8));
      setNote(
        wasExisting
          ? 'Saved. Residents see this on their next page load, and the database enforces it immediately.'
          : 'Settings created. Residents see this on their next page load.',
      );
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save survey settings.');
    } finally {
      setSaving(false);
    }
  }, [user, isSuperadmin, exists, draft, version, opensMs, closesMs, saved, apply]);

  const requestSave = useCallback(() => {
    if (invalid) {
      document
        .querySelector<HTMLElement>('#survey-closes[aria-invalid="true"], #survey-version[aria-invalid="true"]')
        ?.focus();
      return;
    }
    if (!dirty || saving) return;
    const stoppingNow = draft.status !== 'open' && saved.status === 'open';
    const closingNow = draft.status === 'closed' && saved.status !== 'closed';
    if (stoppingNow || closingNow) {
      setConfirm({
        kind: 'save',
        title: draft.status === 'closed' ? 'Close the survey?' : 'Pause the survey?',
        body:
          draft.status === 'closed'
            ? 'Residents will no longer be able to submit. You can reopen it later from this page.'
            : 'Residents will not be able to submit until you open it again. Drafts on their devices are kept.',
        label: draft.status === 'closed' ? 'Close survey' : 'Pause survey',
      });
      return;
    }
    void performSave();
  }, [dirty, invalid, saving, draft.status, saved.status, performSave]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        requestSave();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [requestSave]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    requestSave();
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/survey/`);
      setNote('Survey link copied.');
    } catch {
      setError('Could not copy the link. Open the survey and copy it from the address bar.');
    }
  };

  const runConfirmed = async () => {
    const current = confirm;
    setConfirm(null);
    if (!current) return;
    if (current.kind === 'save') {
      await performSave();
      return;
    }
    if (current.kind === 'discard') {
      setDraft(saved);
      setError(null);
      setNote(null);
      return;
    }
    if (!user) return;
    setResetting(true);
    setError(null);
    setNote(null);
    try {
      await resetSurveyConfig({ uid: user.uid, name: user.name || user.email });
      apply({
        config: { status: 'open', instrumentVersion: DEFAULT_INSTRUMENT_VERSION, residentMessage: '' },
        exists: false,
        updatedAtMs: null,
      });
      setHistory(await listSurveyHistory(8));
      setNote('Reset. The survey is open with the default instrument version.');
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not reset survey settings.');
    } finally {
      setResetting(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <p className="na-error" role="alert">
        Only a superadmin can change whether the survey is open, paused, or closed.
      </p>
    );
  }

  const busy = saving || resetting;
  const hasSchedule = Boolean(draft.opensAt || draft.closesAt);
  const scheduleSummary = hasSchedule
    ? [
        draft.opensAt ? `Opens ${formatAbsoluteTime(new Date(draft.opensAt).getTime())}` : '',
        draft.closesAt ? `Closes ${formatAbsoluteTime(new Date(draft.closesAt).getTime())}` : '',
      ]
        .filter(Boolean)
        .join(' · ')
    : 'Not scheduled';
  const messageSummary = draft.message
    ? draft.message.length > 48
      ? `${draft.message.slice(0, 48)}…`
      : draft.message
    : 'Default message';
  const templates = MESSAGE_TEMPLATES;

  // The page-transition wrapper traps position:fixed, so the bar mounts on the app shell instead.
  // It is the one place feedback lands: unsaved changes, a saved note, or a failure, right
  // where the person just pressed Save.
  const barMessage =
    error ?? (dirty ? (invalid ? 'Fix the highlighted fields to save.' : 'You have unsaved changes.') : note);
  const showBar = dirty || Boolean(barMessage);
  const saveBar = (
    <div
      className={`survey-savebar${showBar ? ' is-visible' : ''}${error ? ' is-error' : ''}`}
      role="region"
      aria-label="Save changes"
      aria-hidden={!showBar}
    >
      <p className="survey-savebar__text" role={error ? 'alert' : 'status'}>
        {barMessage}
        {dirty && !error && !invalid ? <span className="survey-savebar__hint"> Ctrl+S to save</span> : null}
      </p>
      {dirty ? (
        <>
          <Button
            variant="secondary"
            type="button"
            disabled={busy}
            onClick={() =>
              setConfirm({
                kind: 'discard',
                title: 'Discard unsaved changes?',
                body: 'The form returns to the last saved settings.',
                label: 'Discard changes',
              })
            }
          >
            Discard
          </Button>
          <Button variant="primary" type="button" loading={saving} disabled={busy || invalid} onClick={requestSave}>
            {exists ? 'Save changes' : 'Create settings'}
          </Button>
        </>
      ) : (
        <Button
          variant="secondary"
          type="button"
          onClick={() => {
            setError(null);
            setNote(null);
          }}
        >
          Dismiss
        </Button>
      )}
    </div>
  );

  const ledgerRows = [
    {
      label: 'Instrument',
      value: savedVersion,
      note: ready ? `${stats.onVersion} of ${stats.total} response${stats.total === 1 ? '' : 's'}` : '',
    },
    { label: 'Last 7 days', value: stats.lastWeek, note: stats.lastWeek === 1 ? 'response' : 'responses' },
    {
      label: 'Latest response',
      value: stats.latest ? formatRelativeTime(stats.latest, now) : 'None yet',
      note: '',
    },
  ];

  return (
    <section className="dash-page survey-control-page sc-page" aria-labelledby="survey-control-title">
      <div className="dash-page__header">
        <PageHeading
          id="survey-control-title"
          title="Survey control"
          sub="Decide when residents can take the survey, and what they see when they can't. Changes apply as soon as you save."
        />
        <div className="dash-page__tools">
          <Link href="/survey/" target="_blank" rel="noopener noreferrer" className="inq-btn">
            View live survey
          </Link>
          <button type="button" className="inq-btn" onClick={() => void copyLink()}>
            Copy link
          </button>
        </div>
      </div>

      {loading ? (
        <div role="status" aria-busy="true" className="sc-wrap">
          <span className="visually-hidden">Loading current settings</span>
          <div className="sc-layout">
            <div className="sc-main">
              <CountLedger
                label="Responses"
                total={0}
                totalNote=""
                ariaLabel="Survey summary"
                loading
                rows={ledgerRows}
              />
              <div className="sc-skel" aria-hidden="true">
                {[96, 200, 152, 224].map((height, i) => (
                  <div key={height} className="sc-skel__section" style={{ minHeight: height }}>
                    <span className="skel sc-skel__bar" style={{ width: 120, animationDelay: `${i * -150}ms` }} />
                    <span className="skel sc-skel__field" style={{ animationDelay: `${i * -150}ms` }} />
                  </div>
                ))}
              </div>
            </div>
            <div className="sc-rail sc-skel" aria-hidden="true">
              <div className="sc-skel__section" style={{ minHeight: 240 }}>
                <span className="skel sc-skel__bar" style={{ width: 140 }} />
                <span className="skel sc-skel__field" style={{ height: 140 }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <form className="sc-form" onSubmit={onSubmit} noValidate>
            <div className="sc-wrap">
              <div className="sc-layout">
                <div className="sc-main">
                  <CountLedger
                    label="Responses"
                    total={stats.total}
                    totalNote={`of ${RESPONDENT_TARGET} target`}
                    ariaLabel="Survey summary"
                    empty={!ready}
                    rows={ledgerRows}
                  />

                  <div className="sc-card">
                  <section className="sc-section" aria-labelledby="sc-window-title">
                    <h2 id="sc-window-title" className="visually-hidden">
                      Survey window
                    </h2>
                    <p className={`sc-state sc-state--${effective}`} aria-live="polite">
                      <strong>{banner.title}</strong>
                      <span>{banner.detail}</span>
                    </p>
                    <div
                      className="sc-seg"
                      role="radiogroup"
                      aria-label="Survey window"
                      data-status={draft.status}
                      style={{ '--i': WINDOW_OPTIONS.findIndex((o) => o.id === draft.status) } as CSSProperties}
                    >
                      {WINDOW_OPTIONS.map(({ id, title }) => {
                        const selected = draft.status === id;
                        return (
                          <label
                            key={id}
                            className={`sc-seg__opt sc-seg__opt--${id}${selected ? ' is-selected' : ''}`}
                          >
                            <input
                              type="radio"
                              name="survey-window"
                              value={id}
                              checked={selected}
                              onChange={() => patch({ status: id })}
                            />
                            <span>{title}</span>
                          </label>
                        );
                      })}
                    </div>
                  </section>

                  <section className="sc-section">
                    <details
                      className="sc-fold"
                      open={scheduleOpen || hasSchedule}
                      onToggle={(e) => setScheduleOpen(e.currentTarget.open)}
                    >
                      <summary className="sc-section__title sc-fold__title">
                        <span>Schedule</span>
                        <span className="sc-fold__summary">{scheduleSummary}</span>
                      </summary>
                      <div className="sc-fields">
                        <div className="sc-col">
                          <Input
                            id="survey-opens"
                            type="datetime-local"
                            label="Opens at"
                            value={draft.opensAt}
                            onChange={(e) => patch({ opensAt: e.target.value })}
                          />
                          <div className="sc-quick" role="group" aria-label="Opening shortcuts">
                            {[
                              { label: 'Tomorrow 8 AM', ms: () => atHour(new Date(Date.now() + 86_400_000), 8) },
                              { label: 'Next Monday 8 AM', ms: () => nextWeekday(new Date(), 1, 8) },
                            ].map((chip) => (
                              <button
                                key={chip.label}
                                type="button"
                                className="sc-link"
                                onClick={() => patch({ opensAt: toLocalInput(chip.ms()), status: 'open' })}
                              >
                                {chip.label}
                              </button>
                            ))}
                            {draft.opensAt ? (
                              <button type="button" className="sc-link sc-link--quiet" onClick={() => patch({ opensAt: '' })}>
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>
                        <div className="sc-col">
                          <Input
                            id="survey-closes"
                            type="datetime-local"
                            label="Closes at"
                            value={draft.closesAt}
                            onChange={(e) => patch({ closesAt: e.target.value })}
                            error={scheduleError}
                          />
                          <div className="sc-quick" role="group" aria-label="Closing shortcuts">
                            {[
                              { label: 'In 7 days', ms: () => Date.now() + 7 * 86_400_000 },
                              { label: 'In 30 days', ms: () => Date.now() + 30 * 86_400_000 },
                              { label: 'End of this month', ms: () => endOfMonth(new Date()) },
                            ].map((chip) => (
                              <button
                                key={chip.label}
                                type="button"
                                className="sc-link"
                                onClick={() => patch({ closesAt: toLocalInput(chip.ms()), status: 'open' })}
                              >
                                {chip.label}
                              </button>
                            ))}
                            {draft.closesAt ? (
                              <button type="button" className="sc-link sc-link--quiet" onClick={() => patch({ closesAt: '' })}>
                                Clear
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <p className="sc-hint">Leave a time empty for no limit. Times only apply while the window is Open.</p>
                      {scheduleNotes.map((text) => (
                        <p key={text} className="sc-note" role="note">
                          {text}
                        </p>
                      ))}
                    </details>
                  </section>

                  <section className="sc-section" aria-labelledby="sc-version-title">
                    <h2 id="sc-version-title" className="sc-section__title">
                      Instrument version
                    </h2>
                    <div className="sc-version">
                      <Input
                        id="survey-version"
                        label="Label stamped on each new response"
                        value={draft.version}
                        onChange={(e) => patch({ version: e.target.value })}
                        error={versionError}
                      />
                      <button
                        type="button"
                        className="sc-link"
                        onClick={() => patch({ version: nextInstrumentVersion(version) })}
                      >
                        Use {nextInstrumentVersion(version)}
                      </button>
                    </div>
                    <p className="sc-hint">
                      {versionHasResponses
                        ? `${stats.onVersion} response${stats.onVersion === 1 ? '' : 's'} use ${savedVersion}.`
                        : `No responses use ${savedVersion} yet.`}{' '}
                      Change it only when the questions change; publishing in the{' '}
                      <Link href="/admin/survey/builder/">Survey builder</Link> sets it too.
                    </p>
                    {versionChanged && versionHasResponses ? (
                      <p className="sc-note" role="note">
                        New responses will be stamped <strong>{version}</strong>. Existing responses keep{' '}
                        <strong>{savedVersion}</strong>.
                      </p>
                    ) : null}
                  </section>

                  <section className="sc-section">
                    <details
                      className="sc-fold"
                      open={messageOpen || Boolean(draft.message)}
                      onToggle={(e) => setMessageOpen(e.currentTarget.open)}
                    >
                      <summary className="sc-section__title sc-fold__title">
                        <span>Message to residents</span>
                        <span className="sc-fold__summary">{messageSummary}</span>
                      </summary>
                      <Textarea
                        id="survey-message"
                        label={
                          draft.status === 'open'
                            ? 'Shown if the survey is paused or closed later'
                            : 'Shown to residents while the survey is ' + draft.status
                        }
                        value={draft.message}
                        rows={4}
                        onChange={(e) => patch({ message: e.target.value.slice(0, MESSAGE_MAX) })}
                      />
                      <p className="sc-hint">
                        Leave blank to use the default: “
                        {defaultResidentMessage(draft.status === 'open' ? 'paused' : draft.status)}”
                      </p>
                      <div className="sc-foot">
                        <div className="sc-quick" role="group" aria-label="Message templates">
                          <span className="sc-quick__label">Start from</span>
                          {templates.map((tpl) => (
                            <button
                              key={tpl.label}
                              type="button"
                              className="sc-link"
                              onClick={() => patch({ message: tpl.text })}
                            >
                              {tpl.label}
                            </button>
                          ))}
                          {draft.message ? (
                            <button type="button" className="sc-link sc-link--quiet" onClick={() => patch({ message: '' })}>
                              Use default
                            </button>
                          ) : null}
                        </div>
                        <span
                          className={`survey-counter sc-counter${draft.message.length > MESSAGE_MAX - 40 ? ' is-near' : ''}`}
                          aria-live="polite"
                        >
                          {draft.message.length}/{MESSAGE_MAX}
                        </span>
                      </div>
                    </details>
                  </section>
                  </div>
                </div>

                <aside className="sc-rail" aria-label="Preview and history">
                  <section className="sc-section" aria-labelledby="sc-preview-title" aria-live="polite">
                    <h2 id="sc-preview-title" className="sc-section__title">
                      What residents see
                    </h2>
                    <div className={`survey-preview__screen survey-preview__screen--${effective}`}>
                      <p className="survey-preview__kicker">
                        {effective === 'open' ? 'Accepting responses' : effective === 'paused' ? 'Paused' : 'Closed'}
                      </p>
                      <p className="survey-preview__heading">Resident Needs Assessment Survey</p>
                      {effective === 'open' ? (
                        <>
                          <p className="survey-preview__body">
                            The survey takes about 11 to 13 minutes. Your answers are anonymous.
                          </p>
                          <span className="survey-preview__btn">Start the survey</span>
                        </>
                      ) : (
                        <>
                          <p className="survey-preview__body">{previewMessage}</p>
                          <span className="survey-preview__btn survey-preview__btn--ghost">Back to home</span>
                        </>
                      )}
                    </div>
                  </section>

                  <section className="sc-section" aria-labelledby="sc-history-title">
                    <h2 id="sc-history-title" className="sc-section__title">
                      Recent changes
                    </h2>
                    {history.length === 0 ? (
                      <p className="sc-hint">
                        {exists && updatedAtMs
                          ? `Last saved ${formatAbsoluteTime(updatedAtMs)}.`
                          : 'No changes recorded yet. Saves appear here after you update settings.'}
                      </p>
                    ) : (
                      <ol className="sc-history">
                        {history.map((entry) => (
                          <li key={entry.id}>
                            <p className="sc-history__summary">{entry.summary}</p>
                            <p className="sc-history__meta">
                              {entry.byName}
                              {entry.atMs ? (
                                <>
                                  {' · '}
                                  <time title={formatAbsoluteTime(entry.atMs)}>
                                    {formatRelativeTime(entry.atMs, now)}
                                  </time>
                                </>
                              ) : null}
                            </p>
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>

                  <details className="sc-reset">
                    <summary>Reset settings</summary>
                    <p className="sc-hint">
                      Deletes the saved settings. The survey becomes open with instrument {DEFAULT_INSTRUMENT_VERSION}{' '}
                      and the default messages.
                    </p>
                    <Button
                      variant="secondary"
                      type="button"
                      size="sm"
                      loading={resetting}
                      disabled={busy || !exists}
                      onClick={() =>
                        setConfirm({
                          kind: 'reset',
                          title: 'Reset to defaults?',
                          body: `This deletes the saved survey settings. The survey becomes open with instrument ${DEFAULT_INSTRUMENT_VERSION}, no schedule, and the default resident messages.`,
                          label: 'Reset settings',
                        })
                      }
                    >
                      Reset to defaults
                    </Button>
                  </details>
                </aside>
              </div>
            </div>

            {barHost ? createPortal(saveBar, barHost) : null}
          </form>
        </>
      )}

      <ConfirmDeleteModal
        open={confirm !== null}
        title={confirm?.title ?? ''}
        body={confirm?.body ?? ''}
        confirmLabel={confirm?.label ?? 'Confirm'}
        busyLabel="Working…"
        busy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void runConfirmed()}
      />
    </section>
  );
}
