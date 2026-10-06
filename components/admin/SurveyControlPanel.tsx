'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import {
  getSurveyConfigRecord,
  resetSurveyConfig,
  saveSurveyConfig,
  type SurveyConfigRecord,
} from '@/lib/firebase/surveyConfig';
import {
  DEFAULT_INSTRUMENT_VERSION,
  DEFAULT_SURVEY_CONFIG,
  defaultResidentMessage,
  residentSurveyMessage,
  surveyAcceptsResponses,
  type SurveyWindowStatus,
} from '@/survey/instrument';

const STATUS_OPTIONS = ['Open — accepting responses', 'Paused — temporary hold', 'Closed — study ended'];

function labelForStatus(status: SurveyWindowStatus): string {
  if (status === 'paused') return STATUS_OPTIONS[1]!;
  if (status === 'closed') return STATUS_OPTIONS[2]!;
  return STATUS_OPTIONS[0]!;
}

function statusFromLabel(label: string): SurveyWindowStatus {
  if (label === STATUS_OPTIONS[1]) return 'paused';
  if (label === STATUS_OPTIONS[2]) return 'closed';
  return 'open';
}

function applyRecord(
  record: SurveyConfigRecord,
  setters: {
    setStatus: (s: SurveyWindowStatus) => void;
    setVersion: (v: string) => void;
    setMessage: (m: string) => void;
    setExists: (e: boolean) => void;
    setUpdatedAtMs: (ms: number | null) => void;
    setSavedSnapshot: (snap: string) => void;
  },
) {
  setters.setStatus(record.config.status);
  setters.setVersion(record.config.instrumentVersion);
  setters.setMessage(record.config.residentMessage);
  setters.setExists(record.exists);
  setters.setUpdatedAtMs(record.updatedAtMs);
  setters.setSavedSnapshot(
    JSON.stringify({
      status: record.config.status,
      instrumentVersion: record.config.instrumentVersion,
      residentMessage: record.config.residentMessage,
    }),
  );
}

function formatUpdatedAt(ms: number | null): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  try {
    return new Date(ms).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
}

/**
 * Superadmin CRUD for survey window + instrument version + resident message.
 * Create/update via Save; delete via Reset to defaults (removes appConfig/survey).
 */
export function SurveyControlPanel() {
  const { isSuperadmin, user } = useAuth();
  const [status, setStatus] = useState<SurveyWindowStatus>('open');
  const [version, setVersion] = useState(DEFAULT_INSTRUMENT_VERSION);
  const [message, setMessage] = useState('');
  const [exists, setExists] = useState(false);
  const [updatedAtMs, setUpdatedAtMs] = useState<number | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState(
    JSON.stringify({
      status: DEFAULT_SURVEY_CONFIG.status,
      instrumentVersion: DEFAULT_SURVEY_CONFIG.instrumentVersion,
      residentMessage: DEFAULT_SURVEY_CONFIG.residentMessage,
    }),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = async () => {
    const record = await getSurveyConfigRecord();
    applyRecord(record, {
      setStatus,
      setVersion,
      setMessage,
      setExists,
      setUpdatedAtMs,
      setSavedSnapshot,
    });
  };

  useEffect(() => {
    void load()
      .catch(() => setError('Could not load survey settings.'))
      .finally(() => setLoading(false));
  }, []);

  const draftSnapshot = useMemo(
    () =>
      JSON.stringify({
        status,
        instrumentVersion: normalizeDraftVersion(version),
        residentMessage: message.trim().slice(0, 500),
      }),
    [status, version, message],
  );
  const dirty = draftSnapshot !== savedSnapshot;
  const open = surveyAcceptsResponses(status);
  const previewMessage = residentSurveyMessage({
    status,
    instrumentVersion: normalizeDraftVersion(version),
    residentMessage: message,
  });
  const updatedLabel = formatUpdatedAt(updatedAtMs);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !isSuperadmin) return;

    if (!surveyAcceptsResponses(status)) {
      const ok = window.confirm(
        status === 'closed'
          ? 'Close the survey? Residents will not be able to submit until you open it again.'
          : 'Pause the survey? Residents will not be able to submit until you open it again.',
      );
      if (!ok) return;
    }

    setSaving(true);
    setError(null);
    setNote(null);
    const wasExisting = exists;
    try {
      const saved = await saveSurveyConfig(
        {
          status,
          instrumentVersion: version,
          residentMessage: message,
        },
        user.uid,
      );
      applyRecord(saved, {
        setStatus,
        setVersion,
        setMessage,
        setExists,
        setUpdatedAtMs,
        setSavedSnapshot,
      });
      setNote(
        wasExisting
          ? 'Survey settings updated. Residents will see this on the next page load.'
          : 'Survey settings created. Residents will see this on the next page load.',
      );
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : 'Could not save survey settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscard = () => {
    if (!dirty) return;
    if (!window.confirm('Discard unsaved changes?')) return;
    setError(null);
    setNote(null);
    void load().catch(() => setError('Could not reload survey settings.'));
  };

  const handleReset = async () => {
    if (!user || !isSuperadmin || !exists) return;
    if (
      !window.confirm(
        'Reset to defaults? This deletes the saved survey settings. The survey becomes open with instrument v1 and the default resident messages.',
      )
    ) {
      return;
    }
    setResetting(true);
    setError(null);
    setNote(null);
    try {
      await resetSurveyConfig();
      applyRecord(
        { config: { ...DEFAULT_SURVEY_CONFIG }, exists: false, updatedAtMs: null },
        {
          setStatus,
          setVersion,
          setMessage,
          setExists,
          setUpdatedAtMs,
          setSavedSnapshot,
        },
      );
      setNote('Survey settings reset. Defaults are in effect until you save again.');
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

  return (
    <section className="dash-page survey-control-page" aria-labelledby="survey-control-title">
      <div className="dash-page__header">
        <h1 id="survey-control-title" className="dash-page__title">
          Survey control
        </h1>
        {!loading ? (
          <div className="dash-page__tools">
            <p className={`survey-window-chip survey-window-chip--${status}`}>
              {open ? 'Residents can submit' : 'Residents cannot submit'}
              <span aria-hidden="true"> · </span>
              Instrument {normalizeDraftVersion(version)}
              {dirty ? (
                <>
                  <span aria-hidden="true"> · </span>
                  Unsaved
                </>
              ) : null}
            </p>
          </div>
        ) : null}
      </div>

      {loading ? (
        <p className="na-intro" role="status">
          Loading current settings…
        </p>
      ) : (
        <form className="dash-insight survey-control-card" onSubmit={(e) => void handleSave(e)}>
          <p className="survey-control-card__meta" role="status">
            {exists
              ? updatedLabel
                ? `Saved configuration · Last updated ${updatedLabel}`
                : 'Saved configuration'
              : 'No saved configuration yet — defaults apply until you save (open, instrument v1).'}
          </p>

          <Select
            id="survey-status"
            label="Survey window"
            options={[...STATUS_OPTIONS]}
            value={labelForStatus(status)}
            onChange={(e) => setStatus(statusFromLabel(e.target.value))}
            helperText="Open accepts new responses. Paused and closed block submit in the app and in Firestore rules."
          />
          <Input
            id="survey-version"
            label="Instrument version"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            helperText="Use a short label such as v1. Bump this only when the question set actually changes."
          />
          <Textarea
            id="survey-message"
            label="Message to residents (optional)"
            value={message}
            rows={4}
            onChange={(e) => setMessage(e.target.value)}
            helperText={`Shown when paused or closed. Leave blank to use: “${defaultResidentMessage(status === 'open' ? 'paused' : status)}”`}
          />

          {!open ? (
            <div className="survey-control-card__preview" aria-live="polite">
              <p className="survey-control-card__preview-label">Resident preview</p>
              <p className="survey-control-card__preview-body">{previewMessage}</p>
            </div>
          ) : null}

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

          <div className="survey-control-card__actions">
            <Button variant="primary" type="submit" loading={saving} disabled={busy || !dirty}>
              {exists ? 'Save changes' : 'Create settings'}
            </Button>
            <Button
              variant="secondary"
              type="button"
              disabled={busy || !dirty}
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button
              variant="secondary"
              type="button"
              loading={resetting}
              disabled={busy || !exists}
              onClick={() => void handleReset()}
            >
              Reset to defaults
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

function normalizeDraftVersion(value: string): string {
  const trimmed = value.trim().slice(0, 40);
  return trimmed || DEFAULT_INSTRUMENT_VERSION;
}
