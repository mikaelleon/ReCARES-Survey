'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  Layers,
  Users,
  Copy,
  ExternalLink,
  History,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { ConfirmDeleteModal } from '@/components/admin/ConfirmDeleteModal';
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

const STATUS_CARDS: {
  id: SurveyWindowStatus;
  title: string;
  hint: string;
  Icon: LucideIcon;
}[] = [
  { id: 'open', title: 'Open', hint: 'Residents can start and submit.', Icon: PlayCircle },
  { id: 'paused', title: 'Paused', hint: 'A temporary hold. You can reopen it.', Icon: PauseCircle },
  { id: 'closed', title: 'Closed', hint: 'Data collection is finished.', Icon: XCircle },
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
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [now, setNow] = useState(() => Date.now());

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
  const versionSharePct = stats.total > 0 ? Math.round((stats.onVersion / stats.total) * 100) : 0;
  const weekSharePct = stats.total > 0 ? Math.round((stats.lastWeek / stats.total) * 100) : 0;
  const StatusIcon: LucideIcon =
    effective === 'open' ? PlayCircle : effective === 'paused' ? PauseCircle : XCircle;
  const statusWord = effective === 'open' ? 'Open' : effective === 'paused' ? 'Paused' : 'Closed';
  // Progress through a fully scheduled window (opens -> closes), when both times are set.
  const windowProgress =
    opensMs != null && closesMs != null && closesMs > opensMs && effective === 'open'
      ? Math.max(0, Math.min(100, Math.round(((now - opensMs) / (closesMs - opensMs)) * 100)))
      : null;
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
  const templates = MESSAGE_TEMPLATES;

  return (
    <section className="dash-page survey-control-page" aria-labelledby="survey-control-title">
      <div className="dash-page__header">
        <PageHeading
          id="survey-control-title"
          title="Survey control"
          sub="Decide when residents can take the survey, and what they see when they can't. Changes apply as soon as you save."
        >
          {!loading ? (
            <p
              className={`survey-window-chip survey-window-chip--${effective}`}
              style={{ marginTop: 8 }}
              title={banner.detail}
            >
              {banner.title}
              <span aria-hidden="true"> · </span>
              {version}
              {dirty ? (
                <>
                  <span aria-hidden="true"> · </span>
                  Unsaved
                </>
              ) : null}
            </p>
          ) : null}
        </PageHeading>
        <div className="dash-page__tools">
          <Link
            href="/survey/"
            target="_blank"
            rel="noopener noreferrer"
            className="survey-control__tool survey-control__tool--primary"
          >
            <ExternalLink size={16} strokeWidth={2.2} aria-hidden="true" />
            View live survey
          </Link>
          <button type="button" className="survey-control__tool" onClick={() => void copyLink()}>
            <Copy size={16} strokeWidth={2.2} aria-hidden="true" />
            Copy link
          </button>
        </div>
      </div>

      {loading ? (
        <div className="skel-region" aria-busy="true" role="status">
          <span className="visually-hidden">Loading current settings</span>
          <div className="skel-stat" style={{ minHeight: 72 }} />
          <div className="skel-stat" style={{ minHeight: 160 }} />
          <div className="skel-stat" style={{ minHeight: 160 }} />
        </div>
      ) : (
        <>
          <div className="survey-feedback" aria-live="polite">
            {error ? (
              <p className="na-error" role="alert">
                {error}
              </p>
            ) : null}
            {note ? (
              <p role="status" className="admin-kanban-note">
                <CheckCircle2 size={16} strokeWidth={2.2} aria-hidden="true" />
                <span>{note}</span>
              </p>
            ) : null}
          </div>

          <div className="dash-stat-grid survey-kpis">
            <div className={`dash-stat dash-stat--hero survey-kpi--${effective}`} style={{ animationDelay: '0ms' }}>
              <div className="dash-stat__top">
                <span className="dash-stat__icon" aria-hidden="true">
                  <StatusIcon size={18} strokeWidth={2.2} />
                </span>
                <div className="dash-stat__label">Survey window</div>
              </div>
              <div className="dash-stat__value-row">
                <div className="dash-stat__value survey-kpi__status">{statusWord}</div>
                <span className="dash-stat__share">{version}</span>
              </div>
              {windowProgress != null ? (
                <div
                  className="dash-stat__bar"
                  role="progressbar"
                  aria-label="Time elapsed in the scheduled window"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={windowProgress}
                >
                  <div className="dash-stat__bar-fill" style={{ width: `${windowProgress}%` }} />
                </div>
              ) : null}
              <div className="dash-stat__caption">{banner.detail}</div>
            </div>

            <div className="dash-stat dash-stat--neutral" style={{ animationDelay: '60ms' }}>
              <div className="dash-stat__top">
                <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
                  <Users size={18} strokeWidth={2.2} />
                </span>
                <div className="dash-stat__label">Total responses</div>
              </div>
              <div className="dash-stat__value-row">
                <div className="dash-stat__value">{ready ? stats.total : '—'}</div>
                {ready ? (
                  <span className="dash-stat__share">
                    {Math.min(stats.total, RESPONDENT_TARGET)}/{RESPONDENT_TARGET}
                  </span>
                ) : null}
              </div>
              <div
                className="dash-stat__bar"
                role="progressbar"
                aria-label={`Responses toward the target of ${RESPONDENT_TARGET}`}
                aria-valuemin={0}
                aria-valuemax={RESPONDENT_TARGET}
                aria-valuenow={ready ? Math.min(stats.total, RESPONDENT_TARGET) : 0}
              >
                <div
                  className="dash-stat__bar-fill"
                  style={{ width: `${ready ? Math.min(100, Math.round((stats.total / RESPONDENT_TARGET) * 100)) : 0}%` }}
                />
              </div>
              <div className="dash-stat__caption">
                {stats.latest ? `Latest ${formatRelativeTime(stats.latest, now)}` : 'No submissions yet'}
              </div>
            </div>

            <div className="dash-stat dash-stat--neutral" style={{ animationDelay: '120ms' }}>
              <div className="dash-stat__top">
                <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
                  <Layers size={18} strokeWidth={2.2} />
                </span>
                <div className="dash-stat__label">On instrument {savedVersion}</div>
              </div>
              <div className="dash-stat__value-row">
                <div className="dash-stat__value">{ready ? stats.onVersion : '—'}</div>
                {ready && stats.total > 0 ? (
                  <span className="dash-stat__share">{versionSharePct}%</span>
                ) : null}
              </div>
              <div className="dash-stat__bar" aria-hidden="true">
                <div className="dash-stat__bar-fill" style={{ width: `${versionSharePct}%` }} />
              </div>
              <div className="dash-stat__caption">Share of all responses stamped {savedVersion}</div>
            </div>

            <div className="dash-stat dash-stat--neutral" style={{ animationDelay: '180ms' }}>
              <div className="dash-stat__top">
                <span className="dash-stat__icon dash-stat__icon--neutral" aria-hidden="true">
                  <CalendarRange size={18} strokeWidth={2.2} />
                </span>
                <div className="dash-stat__label">Last 7 days</div>
              </div>
              <div className="dash-stat__value-row">
                <div className="dash-stat__value">{ready ? stats.lastWeek : '—'}</div>
                {ready && stats.total > 0 ? (
                  <span className="dash-stat__share">{weekSharePct}%</span>
                ) : null}
              </div>
              <div className="dash-stat__bar" aria-hidden="true">
                <div className="dash-stat__bar-fill" style={{ width: `${weekSharePct}%` }} />
              </div>
              <div className="dash-stat__caption">Share of all responses from this week</div>
            </div>
          </div>

          <form className="dash-bento survey-bento" onSubmit={onSubmit} noValidate>
            <div className="dash-bento__main">
              <fieldset className="dash-insight survey-control-card survey-fieldset">
                <legend className="survey-fieldset__legend">Survey window</legend>
                <p className="survey-fieldset__help survey-fieldset__help--tight">
                  Choose whether residents can start and submit.
                </p>
                <div className="survey-status-cards" role="radiogroup" aria-label="Survey window">
                  {STATUS_CARDS.map(({ id, title, hint, Icon }) => {
                    const selected = draft.status === id;
                    return (
                      <label
                        key={id}
                        className={`survey-status-card survey-status-card--${id}${selected ? ' is-selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="survey-window"
                          value={id}
                          checked={selected}
                          onChange={() => patch({ status: id })}
                        />
                        <span className="survey-status-card__radio" aria-hidden="true" />
                        <span className="survey-status-card__icon">
                          <Icon size={20} strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="survey-status-card__copy">
                          <span className="survey-status-card__title">{title}</span>
                          <span className="survey-status-card__hint">{hint}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="dash-insight survey-control-card survey-fieldset">
                <legend className="survey-fieldset__legend">
                  <CalendarClock size={16} strokeWidth={2.2} aria-hidden="true" /> Schedule <span>optional</span>
                </legend>
                <p className="survey-fieldset__help">
                  Open or close automatically. The database enforces these times, so no one needs to be online.
                  Only applies while the window above is set to <strong>Open</strong>.
                </p>
                <div className="survey-schedule">
                  <Input
                    id="survey-opens"
                    type="datetime-local"
                    label="Opens at"
                    value={draft.opensAt}
                    onChange={(e) => patch({ opensAt: e.target.value })}
                    helperText={opensMs != null ? friendlyDate(opensMs) : 'Leave empty to open right away.'}
                  />
                  <Input
                    id="survey-closes"
                    type="datetime-local"
                    label="Closes at"
                    value={draft.closesAt}
                    onChange={(e) => patch({ closesAt: e.target.value })}
                    error={scheduleError}
                    helperText={closesMs != null ? friendlyDate(closesMs) : 'Leave empty to stay open until you close it.'}
                  />
                </div>
                {scheduleNotes.map((text) => (
                  <p key={text} className="survey-callout" role="note">
                    {text}
                  </p>
                ))}
                <div className="survey-chips" role="group" aria-label="Opening shortcuts">
                  <span className="survey-chips__label">Open:</span>
                  {[
                    { label: 'Tomorrow 8 AM', ms: () => atHour(new Date(Date.now() + 86_400_000), 8) },
                    { label: 'Next Monday 8 AM', ms: () => nextWeekday(new Date(), 1, 8) },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      className="survey-chip"
                      onClick={() => patch({ opensAt: toLocalInput(chip.ms()), status: 'open' })}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <div className="survey-chips" role="group" aria-label="Closing shortcuts">
                  <span className="survey-chips__label">Close:</span>
                  {[
                    { label: 'In 7 days', ms: () => Date.now() + 7 * 86_400_000 },
                    { label: 'In 30 days', ms: () => Date.now() + 30 * 86_400_000 },
                    { label: 'End of this month', ms: () => endOfMonth(new Date()) },
                  ].map((chip) => (
                    <button
                      key={chip.label}
                      type="button"
                      className="survey-chip"
                      onClick={() => patch({ closesAt: toLocalInput(chip.ms()), status: 'open' })}
                    >
                      {chip.label}
                    </button>
                  ))}
                  {(draft.opensAt || draft.closesAt) ? (
                    <button
                      type="button"
                      className="survey-chip survey-chip--quiet"
                      onClick={() => patch({ opensAt: '', closesAt: '' })}
                    >
                      Clear both times
                    </button>
                  ) : null}
                </div>
              </fieldset>

              <fieldset className="dash-insight survey-control-card survey-fieldset">
                <legend className="survey-fieldset__legend">Instrument version</legend>
                <div className="survey-version">
                  <Input
                    id="survey-version"
                    label="Label stamped on each new response"
                    value={draft.version}
                    onChange={(e) => patch({ version: e.target.value })}
                    error={versionError}
                  />
                  <button
                    type="button"
                    className="survey-chip"
                    onClick={() => patch({ version: nextInstrumentVersion(version) })}
                  >
                    Use {nextInstrumentVersion(version)}
                  </button>
                </div>
                <p className="survey-fieldset__help">
                  {versionHasResponses
                    ? `${stats.onVersion} response${stats.onVersion === 1 ? '' : 's'} already use ${savedVersion}.`
                    : `No responses use ${savedVersion} yet.`}{' '}
                  Change the label only when the question set changes, so results can be compared fairly.
                </p>
                {versionChanged && versionHasResponses ? (
                  <p className="survey-callout" role="note">
                    New responses will be stamped <strong>{version}</strong>. Existing responses keep{' '}
                    <strong>{savedVersion}</strong>.
                  </p>
                ) : null}
              </fieldset>

              <fieldset className="dash-insight survey-control-card survey-fieldset">
                <legend className="survey-fieldset__legend">
                  Message to residents <span>optional</span>
                </legend>
                <Textarea
                  id="survey-message"
                  label={draft.status === 'open' ? 'Shown if the survey is paused or closed later' : 'Shown to residents while the survey is ' + draft.status}
                  value={draft.message}
                  rows={4}
                  onChange={(e) => patch({ message: e.target.value.slice(0, MESSAGE_MAX) })}
                  helperText={`Leave blank to use the default: “${defaultResidentMessage(draft.status === 'open' ? 'paused' : draft.status)}”`}
                />
                <div className="survey-message-foot">
                  <div className="survey-chips" role="group" aria-label="Message templates">
                    <span className="survey-chips__label">Start from:</span>
                    {templates.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        className="survey-chip"
                        onClick={() => patch({ message: tpl.text })}
                      >
                        {tpl.label}
                      </button>
                    ))}
                    {draft.message ? (
                      <button type="button" className="survey-chip survey-chip--quiet" onClick={() => patch({ message: '' })}>
                        Use default
                      </button>
                    ) : null}
                  </div>
                  <span
                    className={`survey-counter${draft.message.length > MESSAGE_MAX - 40 ? ' is-near' : ''}`}
                    aria-live="polite"
                  >
                    {draft.message.length}/{MESSAGE_MAX}
                  </span>
                </div>
              </fieldset>

            </div>

            <aside className="dash-bento__rail" aria-label="Preview and history">
              <div className="survey-control-side__sticky">
                <section className="dash-insight survey-control-card survey-preview" aria-live="polite">
                  <h2 className="survey-side-title">What residents see</h2>
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

                <section className="dash-insight survey-control-card">
                  <h2 className="survey-side-title">
                    <History size={16} strokeWidth={2.2} aria-hidden="true" /> Recent changes
                  </h2>
                  {history.length === 0 ? (
                    <p className="survey-history__empty">
                      {exists && updatedAtMs
                        ? `Last saved ${formatAbsoluteTime(updatedAtMs)}.`
                        : 'No changes recorded yet. Saves appear here after you update settings.'}
                    </p>
                  ) : (
                    <ol className="survey-history">
                      {history.map((entry) => (
                        <li key={entry.id} className="survey-history__item">
                          <p className="survey-history__summary">{entry.summary}</p>
                          <p className="survey-history__meta">
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

                <details className="survey-danger">
                  <summary className="survey-danger__summary">
                    <RotateCcw size={15} strokeWidth={2.2} aria-hidden="true" />
                    Advanced · Reset settings
                  </summary>
                  <div className="survey-danger__body">
                    <p className="survey-fieldset__help">
                      Deletes the saved settings. The survey becomes open with instrument{' '}
                      {DEFAULT_INSTRUMENT_VERSION} and the default messages.
                    </p>
                    <Button
                      variant="secondary"
                      type="button"
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
                      <RotateCcw size={16} strokeWidth={2.2} aria-hidden="true" />
                      Reset to defaults
                    </Button>
                  </div>
                </details>
              </div>
            </aside>

            <div className={`survey-savebar${dirty ? ' is-visible' : ''}`} role="region" aria-label="Save changes" aria-hidden={!dirty}>
              <p className="survey-savebar__text">
                {invalid ? 'Fix the highlighted fields to save.' : 'You have unsaved changes.'}
                <span className="survey-savebar__hint"> Ctrl+S to save</span>
              </p>
              <Button
                variant="secondary"
                type="button"
                disabled={busy || !dirty}
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
              <Button variant="primary" type="submit" loading={saving} disabled={busy || !dirty || invalid}>
                {exists ? 'Save changes' : 'Create settings'}
              </Button>
            </div>
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
