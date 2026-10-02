'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ReviewSummary } from '@/components/survey/ReviewSummary';
import { REQUIRED_NOTE } from '@/components/survey/SurveyFields';
import { STEP_TITLES, StepView } from '@/components/survey/SurveySteps';
import { submitNeedsAssessment } from '@/lib/firebase/firestore';
import { normalizeAnswers } from '@/survey/answers';
import { isHomeownerBranch } from '@/survey/branching';
import {
  clearDraft,
  deviceAlreadySubmitted,
  markSubmittedOnDevice,
  readDraft,
  writeDraft,
  type SurveyDraft,
} from '@/survey/draft';
import type { SurveyAnswers, SurveyResponseDocument } from '@/survey/schema';
import { CHOOSE_ONE, validateStep } from '@/survey/validate';

type Screen = 'welcome' | 'consent' | 'x1' | 'x2' | 'step' | 'review';

const MIN_MS_BEFORE_SUBMIT = 30_000;

function deviceClass(): 'phone' | 'computer' {
  return window.matchMedia('(max-width: 767px)').matches ? 'phone' : 'computer';
}

function dateOnly(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function newResponseId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function SurveyFlow() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [step, setStep] = useState(1);
  const [lastStepReached, setLastStepReached] = useState(0);
  const [answers, setAnswers] = useState<Partial<SurveyAnswers>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [e1, setE1] = useState<'agree' | 'decline' | ''>('');
  const [e2, setE2] = useState<'yes' | 'no' | ''>('');
  const [consentedAt, setConsentedAt] = useState(0);
  const [hasDraft, setHasDraft] = useState(false);
  const [alreadySent, setAlreadySent] = useState(false);
  const [honeypot, setHoneypot] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    setHasDraft(Boolean(draft));
    setAlreadySent(deviceAlreadySubmitted());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (screen !== 'step' && screen !== 'review') return;
    const draft: SurveyDraft = {
      answers,
      currentStep: screen === 'review' ? 14 : step,
      lastStepReached,
      consentedAt,
    };
    writeDraft(draft);
  }, [ready, screen, step, answers, lastStepReached, consentedAt]);

  const patch = (next: Partial<SurveyAnswers>) => {
    setAnswers((prev) => normalizeAnswers({ ...prev, ...next }));
    setErrors({});
  };

  const resume = () => {
    const draft = readDraft();
    if (!draft) {
      setScreen('consent');
      return;
    }
    setAnswers(normalizeAnswers(draft.answers));
    setLastStepReached(draft.lastStepReached);
    setConsentedAt(draft.consentedAt || Date.now());
    if (draft.currentStep >= 14) {
      setScreen('review');
      setStep(13);
    } else {
      setStep(Math.min(13, Math.max(1, draft.currentStep)));
      setScreen('step');
    }
  };

  const startOver = () => {
    clearDraft();
    setAnswers({});
    setStep(1);
    setLastStepReached(0);
    setE1('');
    setE2('');
    setErrors({});
    setHasDraft(false);
    setScreen('consent');
  };

  const continueConsent = () => {
    if (!e1) {
      setErrors({ E1: CHOOSE_ONE });
      return;
    }
    if (e1 === 'decline') {
      clearDraft();
      setScreen('x1');
      return;
    }
    if (!e2) {
      setErrors({ E2: CHOOSE_ONE });
      return;
    }
    if (e2 === 'no') {
      clearDraft();
      setScreen('x2');
      return;
    }
    const now = Date.now();
    setConsentedAt(now);
    setLastStepReached(0);
    setStep(1);
    setScreen('step');
    setErrors({});
  };

  const continueStep = () => {
    const nextErrors = validateStep(step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const normalized = normalizeAnswers(answers);
    setAnswers(normalized);
    setLastStepReached(step);
    if (step >= 13) {
      setScreen('review');
      return;
    }
    setStep(step + 1);
  };

  const back = () => {
    setErrors({});
    if (screen === 'review') {
      setScreen('step');
      setStep(13);
      return;
    }
    if (screen === 'step' && step > 1) {
      setStep(step - 1);
      return;
    }
    if (screen === 'step') setScreen('consent');
  };

  const submit = async () => {
    if (honeypot.trim()) {
      setSubmitError('Please review your answers and try again.');
      return;
    }
    if (Date.now() - consentedAt < MIN_MS_BEFORE_SUBMIT) {
      setSubmitError('Please take a moment to review your answers before submitting.');
      return;
    }
    const finalAnswers = normalizeAnswers(answers);
    const document: SurveyResponseDocument = {
      responseId: newResponseId(),
      submittedDate: dateOnly(),
      status: 'complete',
      lastStepReached: 13,
      deviceClass: deviceClass(),
      answers: finalAnswers,
    };
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitNeedsAssessment(document);
      clearDraft();
      markSubmittedOnDevice();
      router.push('/survey/thank-you');
    } catch {
      setSubmitError('The response could not be saved. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  const title =
    screen === 'welcome'
      ? 'Resident Needs Assessment Survey'
      : screen === 'consent'
        ? 'Consent and eligibility'
        : screen === 'x1' || screen === 'x2'
          ? 'Thank you'
          : screen === 'review'
            ? 'Review and submit'
            : step === 11
              ? isHomeownerBranch(answers)
                ? 'Homeowner'
                : 'Tenant and lessee'
              : STEP_TITLES[step];

  return (
    <div
      className="survey-flow"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      {screen === 'step' || screen === 'review' ? (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 16,
              alignItems: 'baseline',
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div className="survey-eyebrow">{screen === 'review' ? 'Review' : `Step ${step} of 13`}</div>
            <Link href="/" className="survey-leave">
              Leave the survey
            </Link>
          </div>
          {screen === 'step' ? <ProgressBar value={step} max={13} /> : <ProgressBar value={13} max={13} />}
        </>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <Link href="/" className="survey-leave">
            Leave the survey
          </Link>
        </div>
      )}

      <h1 className={screen === 'step' ? 'survey-title survey-title--section' : 'survey-title'}>
        {title}
      </h1>

      {screen === 'welcome' ? (
        <>
          <div className="survey-questions">
            {alreadySent ? (
              <p className="na-intro">
                A response was already sent from this device. Continue only if you are a different
                person. This reminder cannot block a second response.
              </p>
            ) : null}
            <div className="survey-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
                This survey is part of a capstone study by BSIT students of the University of Batangas,
                Lipa Campus. The study looks at how online services could make everyday transactions
                easier for residents of Camella Homes Tibig, including residents who find it hard to
                visit the HOA office. The study team is exploring a possible collaboration with the
                Homeowners Association. This is a student survey and is not an official HOA survey.
              </p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
                The survey takes about 11 to 13 minutes. Your answers are anonymous.
              </p>
              <p className="na-intro">
                Questions about the study? Use the <Link href="/#contact">inquiry form</Link>.
              </p>
            </div>
          </div>
          <div className="survey-actions">
            {hasDraft ? (
              <Button variant="primary" onClick={resume}>
                Resume where you stopped
              </Button>
            ) : null}
            <Button variant={hasDraft ? 'secondary' : 'primary'} onClick={startOver}>
              Start the survey
            </Button>
          </div>
        </>
      ) : null}

      {screen === 'consent' ? (
        <>
          <div className="survey-questions">
            <p className="na-required-note">{REQUIRED_NOTE}</p>
            <div className="survey-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
                Your answers in this survey are anonymous. We do not ask for your name, and your
                responses will be reported only as numbers and group totals, such as percentages and
                averages, and not by name. No answer will be linked to you, your household, or your
                unit. Written answers, if you choose to give any, will be summarized without names or
                identifying details.
              </p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
                Some questions ask about your age, sex, civil status, and disability. You may choose
                &quot;Prefer not to say&quot; for any of them. Taking part is voluntary. You may skip any
                question you are not comfortable with or stop at any time. Your answers will be used
                only for this study and handled in line with the Data Privacy Act of 2012 (Republic Act
                10173).
              </p>
            </div>
            <div className={errors.E1 ? 'survey-card survey-card--error' : 'survey-card'}>
              <div className="na-q" id="E1-label">
                I have read the information above and I agree to take part in this survey.{' '}
                <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
                  *
                </span>
              </div>
              <div className="na-chips" role="radiogroup" aria-labelledby="E1-label">
                <button type="button" className="na-chip" aria-pressed={e1 === 'agree'} onClick={() => setE1('agree')}>
                  I agree
                </button>
                <button
                  type="button"
                  className="na-chip"
                  aria-pressed={e1 === 'decline'}
                  onClick={() => setE1('decline')}
                >
                  I do not agree
                </button>
              </div>
              {errors.E1 ? (
                <p className="na-error" role="alert">
                  {errors.E1}
                </p>
              ) : null}
            </div>
            <div className={errors.E2 ? 'survey-card survey-card--error' : 'survey-card'}>
              <div className="na-q" id="E2-label">
                I am 18 years old or older, and I own, rent, or live in a home in Camella Homes Tibig.{' '}
                <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
                  *
                </span>
              </div>
              <div className="na-chips" role="radiogroup" aria-labelledby="E2-label">
                <button type="button" className="na-chip" aria-pressed={e2 === 'yes'} onClick={() => setE2('yes')}>
                  Yes
                </button>
                <button type="button" className="na-chip" aria-pressed={e2 === 'no'} onClick={() => setE2('no')}>
                  No
                </button>
              </div>
              {errors.E2 ? (
                <p className="na-error" role="alert">
                  {errors.E2}
                </p>
              ) : null}
            </div>
          </div>
          <div className="survey-actions">
            <Button variant="primary" onClick={continueConsent}>
              Continue
            </Button>
          </div>
        </>
      ) : null}

      {screen === 'x1' ? (
        <div className="survey-questions">
          <div className="survey-card">
            <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
              Thank you for your time. You chose not to take part, so no answers were recorded.
            </p>
          </div>
        </div>
      ) : null}
      {screen === 'x2' ? (
        <div className="survey-questions">
          <div className="survey-card">
            <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
              Thank you. This survey is only for adult owners, tenants, and household members of Camella
              Homes Tibig.
            </p>
          </div>
        </div>
      ) : null}

      {screen === 'step' ? (
        <>
          <div className="survey-questions">
            <StepView step={step} answers={answers} errors={errors} onPatch={patch} />
          </div>
          <div className="survey-actions">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button variant="primary" onClick={continueStep}>
              Continue
            </Button>
          </div>
        </>
      ) : null}

      {screen === 'review' ? (
        <>
          <ReviewSummary
            answers={answers}
            onEdit={(stepNumber) => {
              setErrors({});
              setStep(stepNumber);
              setScreen('step');
            }}
          />
          <label className="visually-hidden" htmlFor="company">
            Company
          </label>
          <input
            id="company"
            className="visually-hidden"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(event) => setHoneypot(event.target.value)}
          />
          {submitError ? (
            <p className="na-error" role="alert">
              {submitError}
            </p>
          ) : null}
          <div className="survey-actions">
            <Button variant="secondary" onClick={back}>
              Back
            </Button>
            <Button variant="primary" disabled={submitting} onClick={submit}>
              Submit
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
