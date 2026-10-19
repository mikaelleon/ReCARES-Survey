'use client';

import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { PageLoader } from '@/components/ui/PageLoader';
import { Button } from '@/components/ui/Button';
import { StepPager } from '@/components/survey/StepPager';
import { ReviewSummary } from '@/components/survey/ReviewSummary';
import { LeaveSurvey } from '@/components/survey/LeaveSurvey';
import { RichText } from '@/components/survey/RichText';
import { COPY } from '@/survey/copy';
import { REQUIRED_NOTE } from '@/components/survey/SurveyFields';
import { InstrumentStep } from '@/components/survey/InstrumentStep';
import {
  SurveyLanguageProvider,
  SurveyLanguageToggle,
  useSurveyLanguage,
  useT,
} from '@/components/survey/SurveyLanguage';
import { submitNeedsAssessment } from '@/lib/firebase/firestore';
import { loadLiveInstrument } from '@/lib/firebase/instruments';
import { getSurveyConfig } from '@/lib/firebase/surveyConfig';
import { DEFAULT_INSTRUMENT } from '@/survey/defaultInstrument';
import { DRAFT_INSTRUMENT_V2 } from '@/survey/draftInstrumentV2';
import {
  activeStepNumbers,
  firstStepNumber,
  nextStepNumber,
  normalizeAnswers as normalizeWith,
  previousStepNumber,
  resolveStepSubtitle,
  resolveStepTitle,
  stepAccess,
  stepProgress,
  stepRoster,
  validateStep as validateWith,
  type Answers,
  type Instrument,
} from '@/survey/model';
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

type Screen = 'welcome' | 'consent' | 'step' | 'review';

function screenSubtitle(screen: Screen): string {
  if (screen === 'welcome') return 'Read this first, then start. You can stop at any time.';
  if (screen === 'consent') return 'Please read the information below, then tick both boxes to begin.';
  if (screen === 'review') {
    return 'Check your answers. Use Edit to change a section, then submit when you are ready.';
  }
  return '';
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
  const { setOverrides } = useSurveyLanguage();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>('welcome');
  const [step, setStep] = useState(1);
  const [lastStepReached, setLastStepReached] = useState(0);
  const [instrument, setInstrument] = useState<Instrument>(DEFAULT_INSTRUMENT);
  const [answers, setAnswers] = useState<Answers>({});
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
    let cancelled = false;
    setAlreadySent(deviceAlreadySubmitted());
    const finish = (config: SurveyConfig, live: Instrument) => {
      if (cancelled) return;
      const draft = readDraft();
      // A draft from another instrument version may not fit these questions.
      const usable = draft && (!draft.instrumentVersion || draft.instrumentVersion === live.version);
      if (draft && !usable) clearDraft();
      setSurveyConfig(config);
      setInstrument(live);
      setOverrides(live.translations ?? {});
      setHasDraft(Boolean(usable));
      setReady(true);
    };
    // Local development only: /survey?instrument=v2 loads the bundled draft v2 without reading Firestore.
    if (process.env.NODE_ENV !== 'production' && new URLSearchParams(window.location.search).get('instrument') === 'v2') {
      finish(DEFAULT_SURVEY_CONFIG, structuredClone(DRAFT_INSTRUMENT_V2));
      return () => {
        cancelled = true;
      };
    }
    const fallback = window.setTimeout(() => finish(DEFAULT_SURVEY_CONFIG, DEFAULT_INSTRUMENT), 8000);
    void getSurveyConfig()
      .then(async (config) => ({ config, live: await loadLiveInstrument(config) }))
      .then(({ config, live }) => {
        window.clearTimeout(fallback);
        finish(config, live);
      })
      .catch(() => {
        window.clearTimeout(fallback);
        finish(DEFAULT_SURVEY_CONFIG, DEFAULT_INSTRUMENT);
      });
    return () => {
      cancelled = true;
      window.clearTimeout(fallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stepCount = instrument.steps.length;
  const active = activeStepNumbers(instrument, answers);
  const progress = stepProgress(instrument, answers, step);
  const roster = stepRoster(instrument, answers, step);
  const access = stepAccess(instrument, answers);
  const position = progress.position;
  const total = progress.total;
  const lastActive = active[active.length - 1] ?? stepCount;

  useEffect(() => {
    if (!ready) return;
    if (screen !== 'step' && screen !== 'review') return;
    const draft: SurveyDraft = {
      answers,
      currentStep: screen === 'review' ? stepCount + 1 : step,
      lastStepReached,
      consentedAt,
      instrumentVersion: instrument.version,
    };
    writeDraft(draft);
  }, [ready, screen, step, answers, lastStepReached, consentedAt, instrument.version, stepCount]);

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

  const patch = (next: Answers) => {
    setAnswers((prev) => normalizeWith(instrument, { ...prev, ...next }));
    setErrors({});
  };

  const resume = () => {
    if (!surveyAcceptsResponses(surveyConfig.status)) return;
    const draft = readDraft();
    if (!draft) {
      setScreen('consent');
      return;
    }
    setAnswers(normalizeWith(instrument, draft.answers as Answers));
    setLastStepReached(draft.lastStepReached);
    setConsentedAt(draft.consentedAt || Date.now());
    if (draft.currentStep > stepCount) {
      setScreen('review');
      setStep(lastActive);
    } else {
      setStep(Math.min(stepCount, Math.max(1, draft.currentStep)));
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
    setStep(firstStepNumber(instrument, answers));
    setScreen('step');
    setErrors({});
  };

  const continueStep = () => {
    const nextErrors = validateWith(instrument, step, answers);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    const normalized = normalizeWith(instrument, answers);
    setAnswers(normalized);
    setLastStepReached(step);
    const following = nextStepNumber(instrument, normalized, step);
    if (following == null) {
      setScreen('review');
      return;
    }
    setStep(following);
  };

  const back = () => {
    setErrors({});
    if (screen === 'review') {
      setScreen('step');
      setStep(lastActive);
      return;
    }
    if (screen === 'step') {
      const earlier = previousStepNumber(instrument, answers, step);
      if (earlier != null) {
        setStep(earlier);
        return;
      }
      setScreen('consent');
    }
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
    const finalAnswers = normalizeWith(instrument, answers) as Partial<SurveyAnswers>;
    const document: SurveyResponseDocument = {
      responseId: newResponseId(),
      submittedDate: dateOnly(),
      status: 'complete',
      lastStepReached: lastActive,
      deviceClass: deviceClass(),
      answers: finalAnswers,
      instrumentVersion: instrument.version,
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
          : instrument.steps[step - 1]
            ? resolveStepTitle(instrument.steps[step - 1]!, answers)
            : '';
  const subtitle =
    screen === 'step' && instrument.steps[step - 1]
      ? resolveStepSubtitle(instrument.steps[step - 1]!, answers)
      : screenSubtitle(screen);

  return (
    <div
      className="survey-flow"
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <div className="survey-toolbar">
        <LeaveSurvey hasProgress={screen === 'step' || screen === 'review'} />
        <SurveyLanguageToggle />
      </div>

      {screen === 'step' || screen === 'review' ? (
        <div className="survey-progress">
          <div className="survey-progress__meta">
            <div className="survey-eyebrow">
              {screen === 'review' ? t('Review') : `${t('Step')} ${position} ${t('of')} ${total}`}
            </div>
            <p className="survey-saved">{t('Your progress is saved on this device.')}</p>
          </div>
          <StepPager
            roster={roster}
            current={screen === 'review' ? 'review' : step}
            reachable={access.reachable}
            done={access.done}
            reviewReachable={access.review}
            titleOf={(n) => t(resolveStepTitle(instrument.steps[n - 1]!, answers))}
            onGo={(n) => {
              setErrors({});
              setStep(n);
              setScreen('step');
            }}
            onReview={() => {
              setErrors({});
              setStep(lastActive);
              setScreen('review');
            }}
          />
        </div>
      ) : null}

      <h1
        key={`${screen}-${step}`}
        ref={titleRef}
        tabIndex={-1}
        className={screen === 'step' ? 'survey-title survey-title--section' : 'survey-title'}
      >
        {title ? t(title) : title}
      </h1>
      {subtitle ? <p className="survey-subtitle">{t(subtitle)}</p> : null}

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
              <p className="na-intro"><RichText text={t(COPY.alreadySent)} /></p>
            ) : null}
            <div className="survey-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}><RichText text={t(COPY.welcomeIntro)} /></p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}><RichText text={t(COPY.welcomeTime)} /></p>
              <p className="na-intro">
                {t('Questions about the study? Use the')} <Link href="/#contact">{t('inquiry form')}</Link>.
              </p>
            </div>
              </>
            )}
          </div>
          {surveyAcceptsResponses(surveyConfig.status) ? (
          <>
          <div className="survey-actions survey-actions--start">
            {hasDraft ? (
              <Button variant="primary" onClick={resume}>
                {t('Resume where you stopped')}
              </Button>
            ) : null}
            <Button variant={hasDraft ? 'secondary' : 'primary'} onClick={startOver}>
              {t('Start the survey')}
            </Button>
          </div>
          {hasDraft ? <p className="survey-resume-note">{t(COPY.resume)}</p> : null}
          </>
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
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}><RichText text={t(COPY.consentPrivacy)} /></p>
              <p className="na-intro" style={{ fontSize: 16, lineHeight: 1.55, color: 'var(--text-body)' }}><RichText text={t(COPY.consentVoluntary)} /></p>
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
                    <RichText text={t(COPY.consentAgree)} />{' '}
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
                    <RichText text={t(COPY.consentEligible)} />{' '}
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
            {instrument.steps[step - 1] ? (
              <InstrumentStep
                instrument={instrument}
                step={instrument.steps[step - 1]!}
                answers={answers}
                errors={errors}
                onPatch={patch}
              />
            ) : null}
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
            <Button variant="secondary" icon={<ArrowLeft className="survey-arrow survey-arrow--prev" size={16} strokeWidth={2.4} aria-hidden="true" />} onClick={back}>
              {t('Back')}
            </Button>
            <Button variant="primary" onClick={continueStep}>
              {t('Continue')}
              <ArrowRight className="survey-arrow survey-arrow--next" size={16} strokeWidth={2.4} aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : null}

      {screen === 'review' ? (
        <>
          <ReviewSummary
            instrument={instrument}
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
            <Button variant="secondary" icon={<ArrowLeft className="survey-arrow survey-arrow--prev" size={16} strokeWidth={2.4} aria-hidden="true" />} onClick={back}>
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
