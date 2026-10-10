'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { ReviewSummary } from '@/components/survey/ReviewSummary';
import { LeaveSurvey } from '@/components/survey/LeaveSurvey';
import { REQUIRED_NOTE } from '@/components/survey/SurveyFields';
import {
  SurveyLanguageProvider,
  SurveyLanguageToggle,
  useT,
} from '@/components/survey/SurveyLanguage';
import { STEP_TITLES, StepView } from '@/components/survey/SurveySteps';
import { submitNeedsAssessment } from '@/lib/firebase/firestore';
import { getSurveyConfig } from '@/lib/firebase/surveyConfig';
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
import {
  DEFAULT_SURVEY_CONFIG,
  residentSurveyMessage,
  surveyAcceptsResponses,
  type SurveyConfig,
} from '@/survey/instrument';
import type { SurveyAnswers, SurveyResponseDocument } from '@/survey/schema';
import { CHOOSE_ONE, validateStep } from '@/survey/validate';

type Screen = 'welcome' | 'consent' | 'step' | 'review';


const STEP_SUBTITLES: Record<number, string> = {
  1: 'A few quick questions about your home. Your answers decide which questions come next.',
  2: 'Tell us a little about yourself and how you deal with the HOA today.',
  3: 'The devices and internet you use help us design something that works for everyone.',
  4: 'Tell us about your internet cost and connection. Pick the answer that fits best.',
  5: 'Imagine an HOA website. Tell us how likely you would be to use each feature.',
  6: 'More about the website: what you would want first, and what might hold you back.',
  7: 'How easy is it to reach the HOA today? Say how much you agree with each statement.',
  8: 'About bringing visitors, workers, and deliveries through the gate.',
  9: 'About street and event closures, and the permits they need.',
  10: 'How you feel about registering online and showing a valid ID.',
  12: 'Optional questions about access needs. You can choose Prefer not to say.',
  13: 'The last step: tell us about any problems we may have missed.',
};

function screenSubtitle(screen: Screen, step: number, homeowner: boolean): string {
  if (screen === 'welcome') return 'Read this first, then start. You can stop at any time.';
  if (screen === 'consent') return 'Please read the information below, then tick both boxes to begin.';
  if (screen === 'review') {
    return 'Check your answers. Use Edit to change a section, then submit when you are ready.';
  }
  if (step === 11) {
    return homeowner
      ? 'Your experience as a homeowner dealing with the HOA.'
      : 'Your experience as a tenant dealing with the HOA.';
  }
  return STEP_SUBTITLES[step] ?? '';
}

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
  return (
    <SurveyLanguageProvider>
      <SurveyFlowInner />
    </SurveyLanguageProvider>
  );
}

function SurveyFlowInner() {
  const t = useT();
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
  const titleRef = useRef<HTMLHeadingElement | null>(null);
  const mounted = useRef(false);
  const [surveyConfig, setSurveyConfig] = useState<SurveyConfig>(DEFAULT_SURVEY_CONFIG);

  useEffect(() => {
    const draft = readDraft();
    setHasDraft(Boolean(draft));
    setAlreadySent(deviceAlreadySubmitted());
    void getSurveyConfig().then(setSurveyConfig);
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

  // New screen or step: return to the top and move focus to the heading
  // so keyboard and screen-reader users start at the new content.
  useEffect(() => {
    if (!ready) return;
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
    titleRef.current?.focus({ preventScroll: true });
  }, [ready, screen, step]);

  // Validation failed: bring the first problem into view and focus it.
  useEffect(() => {
    if (Object.values(errors).every((message) => !message)) return;
    const card = document.querySelector<HTMLElement>('.survey-card--error');
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    card.querySelector<HTMLElement>('input, button, textarea, select')?.focus({ preventScroll: true });
  }, [errors]);

  const patch = (next: Partial<SurveyAnswers>) => {
    setAnswers((prev) => normalizeAnswers({ ...prev, ...next }));
    setErrors({});
  };

  const resume = () => {
    if (!surveyAcceptsResponses(surveyConfig.status)) return;
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
    if (!surveyAcceptsResponses(surveyConfig.status)) return;
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
    const next: Record<string, string> = {};
    if (e1 !== 'agree') next.E1 = 'Please tick this box to agree before continuing.';
    if (e2 !== 'yes') next.E2 = 'Please tick this box to confirm you are eligible before continuing.';
    if (Object.keys(next).length > 0) {
      setErrors(next);
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
    const liveConfig = await getSurveyConfig();
    setSurveyConfig(liveConfig);
    if (!surveyAcceptsResponses(liveConfig.status)) {
      setSubmitError(residentSurveyMessage(liveConfig));
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
      instrumentVersion: liveConfig.instrumentVersion,
    };
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitNeedsAssessment(document);
      clearDraft();
      markSubmittedOnDevice();
      router.push('/survey/thank-you');
    } catch (error) {
      const code =
        error && typeof error === 'object' && 'code' in error
          ? String((error as { code: string }).code)
          : '';
      const closed =
        error instanceof Error && error.message === 'SURVEY_WINDOW_CLOSED';
      if (closed || code === 'permission-denied') {
        setSubmitError(residentSurveyMessage(liveConfig));
      } else {
        setSubmitError('The response could not be saved. Please try again.');
      }
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
              alignItems: 'center',
              marginBottom: 10,
              flexWrap: 'wrap',
            }}
          >
            <div className="survey-eyebrow">{screen === 'review' ? t('Review') : `${t('Step')} ${step} ${t('of')} 13`}</div>
            <LeaveSurvey hasProgress />
          </div>
          <div
            role="progressbar"
            aria-label={t('Step')}
            aria-valuemin={1}
            aria-valuemax={13}
            aria-valuenow={screen === 'step' ? step : 13}
            aria-valuetext={`${t('Step')} ${screen === 'step' ? step : 13} ${t('of')} 13`}
          >
            <ProgressBar value={screen === 'step' ? step : 13} max={13} />
          </div>
          <p className="survey-saved">{t('Your progress is saved on this device.')}</p>
        </>
      ) : (
        <div style={{ marginBottom: 12 }}>
          <LeaveSurvey hasProgress={false} />
        </div>
      )}

      <SurveyLanguageToggle />

      <h1
        ref={titleRef}
        tabIndex={-1}
        className={screen === 'step' ? 'survey-title survey-title--section' : 'survey-title'}
      >
        {title ? t(title) : title}
      </h1>
      {screenSubtitle(screen, step, isHomeownerBranch(answers)) ? (
        <p className="survey-subtitle">{t(screenSubtitle(screen, step, isHomeownerBranch(answers)))}</p>
      ) : null}

      {screen === 'welcome' ? (
        <>
          <div className="survey-questions">
            {!surveyAcceptsResponses(surveyConfig.status) ? (
              <div className="survey-card">
                <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>
                  {residentSurveyMessage(surveyConfig)}
                </p>
              </div>
            ) : (
              <>
            {alreadySent ? (
              <p className="na-intro">{t("A response was already sent from this device. Continue only if you are a different person. This reminder cannot block a second response.")}</p>
            ) : null}
            <div className="survey-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>{t("This survey is part of a capstone study by BSIT students of the University of Batangas, Lipa Campus. The study looks at how online services could make everyday transactions easier for residents of Camella Homes Tibig, including residents who find it hard to visit the HOA office. The study team is exploring a possible collaboration with the Homeowners Association. This is a student survey and is not an official HOA survey.")}</p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>{t("The survey takes about 11 to 13 minutes. Your answers are anonymous.")}</p>
              <p className="na-intro">
                {t('Questions about the study? Use the')} <Link href="/#contact">{t('inquiry form')}</Link>.
              </p>
            </div>
              </>
            )}
          </div>
          {surveyAcceptsResponses(surveyConfig.status) ? (
          <div className="survey-actions">
            {hasDraft ? (
              <Button variant="primary" onClick={resume}>
                {t('Resume where you stopped')}
              </Button>
            ) : null}
            <Button variant={hasDraft ? 'secondary' : 'primary'} onClick={startOver}>
              {t('Start the survey')}
            </Button>
          </div>
          ) : (
            <div className="survey-actions">
              <Button variant="secondary" href="/">
                {t('Back to home')}
              </Button>
            </div>
          )}
        </>
      ) : null}

      {screen === 'consent' ? (
        <>
          <div className="survey-questions">
            <p className="na-required-note">{t(REQUIRED_NOTE)}</p>
            <div className="survey-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>{t("Your answers in this survey are anonymous. We do not ask for your name, and your responses will be reported only as numbers and group totals, such as percentages and averages, and not by name. No answer will be linked to you, your household, or your unit. Written answers, if you choose to give any, will be summarized without names or identifying details.")}</p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}>{t("Some questions ask about your age, sex, civil status, and disability. You may choose \"Prefer not to say\" for any of them. Taking part is voluntary. You may skip any question you are not comfortable with or stop at any time. Your answers will be used only for this study and handled in line with the Data Privacy Act of 2012 (Republic Act 10173).")}</p>
            </div>
            <div className={errors.E1 || errors.E2 ? 'survey-card survey-card--error' : 'survey-card'}>
              <div className="na-q" id="consent-label">
                {t('To begin, please confirm both statements.')}
              </div>
              <div className="na-checks" role="group" aria-labelledby="consent-label">
                <label className="na-check">
                  <input
                    id="E1-input"
                    type="checkbox"
                    checked={e1 === 'agree'}
                    aria-invalid={errors.E1 ? true : undefined}
                    aria-describedby={errors.E1 ? 'E1-error' : undefined}
                    onChange={(event) => {
                      setE1(event.target.checked ? 'agree' : '');
                      setErrors((prev) => ({ ...prev, E1: '' }));
                    }}
                  />
                  <span className="na-box" aria-hidden="true">
                    {e1 === 'agree' ? '✓' : ''}
                  </span>
                  <span>
                    {t('I have read the information above and I agree to take part in this survey.')}{' '}
                    <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
                      *
                    </span>
                  </span>
                </label>
                {errors.E1 ? (
                  <p id="E1-error" className="na-error" role="alert">
                    {t(errors.E1)}
                  </p>
                ) : null}
                <label className="na-check">
                  <input
                    id="E2-input"
                    type="checkbox"
                    checked={e2 === 'yes'}
                    aria-invalid={errors.E2 ? true : undefined}
                    aria-describedby={errors.E2 ? 'E2-error' : undefined}
                    onChange={(event) => {
                      setE2(event.target.checked ? 'yes' : '');
                      setErrors((prev) => ({ ...prev, E2: '' }));
                    }}
                  />
                  <span className="na-box" aria-hidden="true">
                    {e2 === 'yes' ? '✓' : ''}
                  </span>
                  <span>
                    {t('I am 18 years old or older, and I own, rent, or live in a home in Camella Homes Tibig.')}{' '}
                    <span style={{ color: 'var(--status-error)' }} aria-hidden="true">
                      *
                    </span>
                  </span>
                </label>
                {errors.E2 ? (
                  <p id="E2-error" className="na-error" role="alert">
                    {t(errors.E2)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
          <div className="survey-actions">
            <Button variant="primary" onClick={continueConsent}>
              {t('Continue')}
            </Button>
          </div>
        </>
      ) : null}

      {screen === 'step' ? (
        <>
          <div className="survey-questions">
            <StepView step={step} answers={answers} errors={errors} onPatch={patch} />
          </div>
          {Object.values(errors).some(Boolean) ? (
            <p className="na-error survey-error-summary" role="alert">
              {t(
                Object.values(errors).filter(Boolean).length > 1
                  ? 'Please answer the highlighted questions to continue.'
                  : 'Please answer the highlighted question to continue.',
              )}
            </p>
          ) : null}
          <div className="survey-actions">
            <Button variant="secondary" onClick={back}>
              {t('Back')}
            </Button>
            <Button variant="primary" onClick={continueStep}>
              {t('Continue')}
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
            {t('Company')}
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
              {t(submitError)}
            </p>
          ) : null}
          <div className="survey-actions">
            <Button variant="secondary" onClick={back}>
              {t('Back')}
            </Button>
            <Button variant="primary" disabled={submitting} onClick={submit}>
              {t('Submit')}
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
