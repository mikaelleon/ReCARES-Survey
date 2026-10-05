'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/lib/auth/AuthProvider';
import { getSurveyConfig, saveSurveyConfig } from '@/lib/firebase/surveyConfig';
import {
  DEFAULT_INSTRUMENT_VERSION,
  DEFAULT_SURVEY_CONFIG,
  defaultResidentMessage,
  surveyAcceptsResponses,
  type SurveyConfig,
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

/**
 * Superadmin-only survey window + instrument version.
 */
export function SurveyControlPanel() {
  const { isSuperadmin, user } = useAuth();
  const [config, setConfig] = useState<SurveyConfig>(DEFAULT_SURVEY_CONFIG);
  const [status, setStatus] = useState<SurveyWindowStatus>('open');
  const [version, setVersion] = useState(DEFAULT_INSTRUMENT_VERSION);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    void getSurveyConfig()
      .then((next) => {
        setConfig(next);
        setStatus(next.status);
        setVersion(next.instrumentVersion);
        setMessage(next.residentMessage);
      })
      .catch(() => setError('Could not load survey settings.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !isSuperadmin) return;
    setSaving(true);
    setError(null);
    setNote(null);
    try {
      const saved = await saveSurveyConfig(
        {
          status,
          instrumentVersion: version,
          residentMessage: message,
        },
        user.uid,
      );
      setConfig(saved);
      setNote('Survey settings saved. Residents will see this on the next page load.');
    } catch {
      setError('Could not save. Confirm you are a superadmin and Firestore is allowed in this browser.');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperadmin) {
    return (
      <p className="na-error" role="alert">
        Only a superadmin can change whether the survey is open, paused, or closed.
      </p>
    );
  }

  const open = surveyAcceptsResponses(status);

  return (
    <section className="dash-page" aria-labelledby="survey-control-title">
      <div className="dash-page__header">
        <h1 id="survey-control-title" className="dash-page__title">
          Survey control
        </h1>
      </div>
      <p className="na-intro" style={{ maxWidth: 640, marginBottom: 20 }}>
        Pause or close the public survey without a code deploy. Each new submission is stamped with
        the instrument version below so later question changes can be compared fairly.
      </p>
      {loading ? (
        <p className="na-intro">Loading current settings…</p>
      ) : (
        <form className="survey-control-card" onSubmit={(e) => void handleSave(e)}>
          <p className={`survey-window-chip survey-window-chip--${status}`}>
            {open ? 'Residents can submit' : 'Residents cannot submit'}
            <span aria-hidden="true"> · </span>
            Instrument {config.instrumentVersion}
          </p>
          <Select
            id="survey-status"
            label="Survey window"
            options={[...STATUS_OPTIONS]}
            value={labelForStatus(status)}
            onChange={(e) => setStatus(statusFromLabel(e.target.value))}
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
          <Button variant="primary" type="submit" loading={saving} disabled={saving}>
            Save
          </Button>
        </form>
      )}
    </section>
  );
}
