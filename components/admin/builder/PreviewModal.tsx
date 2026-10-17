'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { InstrumentStep } from '@/components/survey/InstrumentStep';
import { ReviewSummary } from '@/components/survey/ReviewSummary';
import { SurveyLanguageProvider, SurveyLanguageToggle, useSurveyLanguage } from '@/components/survey/SurveyLanguage';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import {
  activeStepNumbers,
  firstStepNumber,
  nextStepNumber,
  normalizeAnswers,
  previousStepNumber,
  resolveStepSubtitle,
  resolveStepTitle,
  stepProgress,
  validateStep,
  type Answers,
  type Instrument,
} from '@/survey/model';

function PreviewBody({ instrument, onClose }: { instrument: Instrument; onClose: () => void }) {
  const { setOverrides } = useSurveyLanguage();
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(() => firstStepNumber(instrument, {}));
  const [review, setReview] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setOverrides(instrument.translations ?? {});
  }, [instrument.translations, setOverrides]);

  const active = useMemo(() => activeStepNumbers(instrument, answers), [instrument, answers]);
  const { position, total } = stepProgress(instrument, answers, step);
  const current = instrument.steps[step - 1];

  const patch = (next: Answers) => {
    setAnswers((prev) => normalizeAnswers(instrument, { ...prev, ...next }));
    setErrors({});
  };

  const forward = () => {
    const found = validateStep(instrument, step, answers);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    const following = nextStepNumber(instrument, answers, step);
    if (following == null) setReview(true);
    else setStep(following);
  };

  const backward = () => {
    setErrors({});
    if (review) {
      setReview(false);
      return;
    }
    const earlier = previousStepNumber(instrument, answers, step);
    if (earlier != null) setStep(earlier);
  };

  return (
    <div className="sb-preview__panel" role="dialog" aria-modal="true" aria-label="Survey preview">
      <header className="sb-preview__head">
        <div>
          <strong>Preview of {instrument.version}</strong>
          <span className="sb-muted"> · nothing is saved. Fill it in to test the branching.</span>
        </div>
        <div className="sb-row">
          <button type="button" className="sb-btn" onClick={() => { setAnswers({}); setStep(firstStepNumber(instrument, {})); setReview(false); setErrors({}); }}>
            Start over
          </button>
          <button type="button" className="sb-icon-btn" aria-label="Close preview" onClick={onClose}>
            <X size={16} />
          </button>
        </div>
      </header>
      <div className="sb-preview__scroll">
        <div className="survey-flow" style={{ maxWidth: 720, margin: '0 auto', padding: '8px 16px 48px' }}>
          <SurveyLanguageToggle />
          <div className="survey-eyebrow">{review ? 'Review' : `Step ${position} of ${total}`}</div>
          <ProgressBar value={review ? total : position} max={total} />
          {review ? (
            <>
              <h1 className="survey-title">Review and submit</h1>
              <ReviewSummary
                instrument={instrument}
                answers={answers}
                onEdit={(n) => {
                  setStep(n);
                  setReview(false);
                }}
              />
            </>
          ) : current ? (
            <>
              <h1 className="survey-title survey-title--section">{resolveStepTitle(current, answers)}</h1>
              {resolveStepSubtitle(current, answers) ? (
                <p className="survey-subtitle">{resolveStepSubtitle(current, answers)}</p>
              ) : null}
              <div className="survey-questions">
                <InstrumentStep instrument={instrument} step={current} answers={answers} errors={errors} onPatch={patch} />
              </div>
              {Object.values(errors).some(Boolean) ? (
                <p className="na-error survey-error-summary" role="alert">
                  Please answer the highlighted questions to continue.
                </p>
              ) : null}
            </>
          ) : (
            <p className="sb-muted">This survey has no steps yet.</p>
          )}
          <div className="survey-actions">
            <Button variant="secondary" onClick={backward}>
              Back
            </Button>
            {review ? (
              <Button variant="primary" onClick={onClose}>
                Close preview
              </Button>
            ) : (
              <Button variant="primary" onClick={forward}>
                Continue
              </Button>
            )}
          </div>
          <details className="sb-preview__answers">
            <summary>Answers so far</summary>
            <pre>{JSON.stringify(answers, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  );
}

export function PreviewModal({ instrument, onClose }: { instrument: Instrument; onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="sb-preview">
      <SurveyLanguageProvider>
        <PreviewBody instrument={instrument} onClose={onClose} />
      </SurveyLanguageProvider>
    </div>
  );
}
