'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { SurveyConsentGate } from '@/components/survey/SurveyConsentGate';
import { ScreeningForm } from '@/components/survey/ScreeningForm';
import { LikertItem } from '@/components/survey/LikertItem';
import {
  InterviewOptInCard,
  INTERVIEW_DAYS,
  validateInterviewOptIn,
  type InterviewErrors,
  type InterviewOptInValue,
} from '@/components/survey/InterviewOptInCard';
import { ReviewSectionCards, buildReviewSectionCards } from '@/components/survey/ReviewSectionCards';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import type { LanguageValue } from '@/components/layout/LanguageToggle';
import { submitInterviewContact, submitSurveyResponse } from '@/lib/firebase/firestore';
import { PERIMETER_PHASES } from '@/survey/config';
import {
  estimateMinutes,
  SCREENING_FIELDS,
  SECTIONS,
  S2_FIELDS,
  S2_LIKERT,
  STEPS,
} from '@/survey/content';
import {
  isPartneredCivilStatus,
  isPerimeterAdjacent,
  showSection4,
  showSection5,
  showSection7a,
  showSection7b,
} from '@/survey/gatingLogic';
import type {
  LikertValue,
  NotShown,
  Section2Answers,
  SurveyResponse,
} from '@/survey/schema';
import {
  toScreeningData,
  validateScreeningStep,
  type ScreeningErrors,
} from '@/survey/validation';

type S4OptIn = 'yes' | 'no' | null;

function chipStyle(selected: boolean): CSSProperties {
  return {
    minHeight: 44,
    padding: '0 16px',
    borderRadius: 8,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: 15,
    fontWeight: selected ? 700 : 400,
    background: selected ? 'var(--bright-amber)' : 'var(--surface-2)',
    color: selected ? 'var(--black)' : 'var(--text-body)',
    border: selected ? '1px solid var(--bright-amber)' : '1px solid var(--border-default)',
    transform: selected ? 'translateY(-1px)' : 'none',
    transition:
      'background var(--motion-duration) var(--motion-ease), transform var(--motion-duration) var(--motion-ease)',
  };
}

function computeGates(
  sc: Record<string, string>,
  s4OptIn: S4OptIn,
  multi: Record<string, Record<string, boolean>> = {},
) {
  const data = toScreeningData(sc, multi);
  const partnered = isPartneredCivilStatus(sc.civil_status ?? '');
  const perimeter = isPerimeterAdjacent(sc.addr_phase ?? '', PERIMETER_PHASES);
  const s4 = showSection4(data, s4OptIn === null ? undefined : s4OptIn);
  const s5 = showSection5(data);
  const s7a = showSection7a(data);
  const s7b = showSection7b(data);
  return { partnered, perimeter, s4, s5, s7a, s7b };
}

function answerLabel(
  id: string,
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>>,
): string {
  if (id === 'disability_type') {
    const keys = Object.keys(multi.disability_type ?? {});
    return keys.length ? keys.join(', ') : 'Not answered';
  }
  const v = sc[id];
  return v == null || v === '' ? 'Not answered' : String(v);
}

function buildSurveyResponse(
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>>,
  s2: Record<string, string | number>,
  s4OptIn: S4OptIn,
  language: LanguageValue,
  interviewOptIn: boolean,
): SurveyResponse {
  const g = computeGates(sc, s4OptIn, multi);
  const notShown: NotShown = 'not_shown';

  const screening: SurveyResponse['screening'] = {};
  SCREENING_FIELDS.forEach((field) => {
    if ('when' in field && field.when && !field.when(sc)) {
      screening[field.id] = notShown;
      return;
    }
    if (field.id === 'disability_type') {
      const keys = Object.keys(multi.disability_type ?? {});
      screening[field.id] = keys.length ? keys : null;
      return;
    }
    screening[field.id] = sc[field.id] || null;
  });

  const section2: Section2Answers = {
    s2_adequacy: (s2.s2_adequacy as LikertValue) ?? null,
    s2_frequency: (s2.s2_frequency as LikertValue) ?? null,
    s2_satisfaction: (s2.s2_satisfaction as LikertValue) ?? null,
    s2_effectiveness: (s2.s2_effectiveness as LikertValue) ?? null,
    s2_agreement: (s2.s2_agreement as LikertValue) ?? null,
    s2_printer_access: s2.s2_printer_access ? String(s2.s2_printer_access) : null,
    s2_delay_days: s2.s2_delay_days != null ? String(s2.s2_delay_days) : null,
    s2_abandonment: s2.s2_abandonment ? String(s2.s2_abandonment) : null,
  };

  return {
    submittedAt: new Date().toISOString(),
    anonymous: true,
    language,
    screening,
    section2,
    section3ExtendedShown: g.perimeter,
    section4Shown: g.s4,
    section5Shown: g.s5,
    section7aShown: g.s7a,
    section7bShown: g.s7b,
    s3_extended_items: g.perimeter ? null : notShown,
    s4_items: g.s4 ? null : notShown,
    s5_items: g.s5 ? null : notShown,
    s7a_items: g.s7a ? null : notShown,
    s7b_items: g.s7b ? null : notShown,
    interviewOptIn,
  };
}

/**
 * Multi-step resident survey flow with gating, review, and Firestore submit stub.
 */
export function SurveyFlow() {
  const router = useRouter();
  const [consentPassed, setConsentPassed] = useState(false);
  const [language, setLanguage] = useState<LanguageValue>('EN');
  const [step, setStep] = useState(0);
  const [sc, setSc] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, Record<string, boolean>>>({});
  const [s2, setS2] = useState<Record<string, string | number>>({});
  const [s4OptIn, setS4OptIn] = useState<S4OptIn>(null);
  const [submitting, setSubmitting] = useState(false);
  const [screeningErrors, setScreeningErrors] = useState<ScreeningErrors>({});
  const [interview, setInterview] = useState<InterviewOptInValue>({
    willingness: null,
    email: '',
    format: null,
    days: {},
    time: null,
    timeOther: '',
  });
  const [interviewErrors, setInterviewErrors] = useState<InterviewErrors>({});

  const currentStep = STEPS[step] ?? STEPS[0];
  const gates = useMemo(() => computeGates(sc, s4OptIn, multi), [sc, s4OptIn, multi]);

  const setScField = useCallback((id: string, value: string) => {
    setSc((prev) => {
      const next = { ...prev, [id]: value };
      if (id === 'children_yn' && value !== 'Yes') {
        delete next.children_count;
      }
      return next;
    });
    if (id === 'pwd_self' && value !== 'Yes') {
      setMulti((prev) => {
        if (!prev.disability_type) return prev;
        const next = { ...prev };
        delete next.disability_type;
        return next;
      });
    }
    setScreeningErrors((prev) => {
      if (!prev[id] && !(id === 'children_yn' && prev.children_count) && !(id === 'pwd_self' && prev.disability_type)) {
        return prev;
      }
      const next = { ...prev };
      delete next[id];
      if (id === 'children_yn') delete next.children_count;
      if (id === 'pwd_self') delete next.disability_type;
      return next;
    });
  }, []);

  const toggleMulti = useCallback((id: string, option: string) => {
    setMulti((prev) => {
      const current = { ...(prev[id] ?? {}) };
      if (current[option]) {
        delete current[option];
      } else {
        current[option] = true;
      }
      return { ...prev, [id]: current };
    });
    setScreeningErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const setS2Field = useCallback((id: string, value: string | number) => {
    setS2((prev) => ({ ...prev, [id]: value }));
  }, []);

  const planRows = useMemo(() => {
    return SECTIONS.map((section) => {
      const status: 'completed' | 'will_appear' | 'skipped' =
        section.id === 'screening'
          ? 'completed'
          : 'always' in section && section.always
            ? 'will_appear'
            : 'key' in section && section.key && gates[section.key as keyof typeof gates]
              ? 'will_appear'
              : 'skipped';

      const reason =
        section.id === 'screening'
          ? 'You already finished this section.'
          : 'always' in section && section.always
            ? 'Shown to every respondent.'
            : status === 'will_appear'
              ? section.why
              : section.whyNot;

      const minutes = estimateMinutes(section.itemCount);
      const meta =
        status === 'will_appear'
          ? `${section.itemCount} question${section.itemCount === 1 ? '' : 's'} · about ${minutes} minute${minutes === 1 ? '' : 's'}`
          : null;

      const badge =
        status === 'completed' ? 'Completed' : status === 'will_appear' ? 'Will appear' : 'Skipped';

      const badgeStyle: CSSProperties = {
        flex: '0 0 auto',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        padding: '6px 10px',
        borderRadius: 8,
        background:
          status === 'will_appear'
            ? 'var(--bright-amber)'
            : status === 'completed'
              ? 'var(--surface-2)'
              : 'transparent',
        color:
          status === 'will_appear'
            ? 'var(--black)'
            : status === 'completed'
              ? 'var(--text-body)'
              : 'var(--text-caption)',
        border:
          status === 'will_appear'
            ? '1px solid var(--bright-amber)'
            : status === 'completed'
              ? '1px solid var(--border-default)'
              : '1px solid var(--border-default)',
      };

      return {
        id: section.id,
        n: section.n,
        t: section.t,
        status,
        reason,
        meta,
        badge,
        badgeStyle,
      };
    });
  }, [gates]);

  const remainingMinutes = useMemo(
    () =>
      planRows
        .filter((row) => row.status === 'will_appear')
        .reduce((sum, row) => {
          const section = SECTIONS.find((s) => s.id === row.id);
          return sum + (section ? estimateMinutes(section.itemCount) : 0);
        }, 0),
    [planRows],
  );

  const reviewCards = useMemo(
    () =>
      buildReviewSectionCards({
        sc,
        multi,
        s2,
        gates,
        answerLabel,
      }),
    [sc, multi, s2, gates],
  );

  const handleSubmit = async () => {
    const nextInterviewErrors = validateInterviewOptIn(interview);
    setInterviewErrors(nextInterviewErrors);
    if (Object.keys(nextInterviewErrors).length > 0) return;

    const interviewOptIn = interview.willingness === 'yes';
    setSubmitting(true);
    try {
      await submitSurveyResponse(
        buildSurveyResponse(sc, multi, s2, s4OptIn, language, interviewOptIn),
      );
      if (interviewOptIn && interview.format && interview.time) {
        await submitInterviewContact({
          email: interview.email.trim(),
          interviewFormat: interview.format,
          preferredDays: INTERVIEW_DAYS.filter((day) => interview.days[day]),
          preferredTime: interview.time,
          ...(interview.time === 'Other'
            ? { preferredTimeOther: interview.timeOther.trim() }
            : {}),
          submittedAt: new Date().toISOString(),
        });
      }
      router.push('/survey/thank-you');
    } finally {
      setSubmitting(false);
    }
  };

  const s4Reason = gates.partnered
    ? 'Your civil status opens this section directly. You can still decline it in full.'
    : 'Your civil status does not open this section automatically, so we ask first instead of showing the questions.';

  const s4AskOptin = !gates.partnered && s4OptIn === null;
  const s4Skipped = !gates.partnered && s4OptIn === 'no';
  const s4Open = gates.s4;

  const visibleS2Fields = S2_FIELDS;

  if (!consentPassed) {
    return (
      <SurveyConsentGate
        language={language}
        onLanguageChange={setLanguage}
        onContinue={() => setConsentPassed(true)}
      />
    );
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 10,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--text-body)',
          }}
        >
          Step {step + 1} of {STEPS.length}
        </div>
        <Link
          href="/"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text-caption)',
            textDecoration: 'underline',
          }}
        >
          Leave the survey
        </Link>
      </div>

      <ProgressBar value={step + 1} max={STEPS.length} />

      <h1
        style={{
          margin: '20px 0 0',
          color: 'var(--text-headline)',
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 700,
          lineHeight: 1.25,
          textWrap: 'pretty',
        }}
      >
        {currentStep.title}
      </h1>
      <p
        style={{
          margin: '10px 0 0',
          color: 'var(--text-caption)',
          fontSize: 14,
          lineHeight: 1.5,
          textWrap: 'pretty',
        }}
      >
        {currentStep.intro}
      </p>

      {currentStep.key === 'plan' && (
        <p
          style={{
            margin: '10px 0 0',
            color: 'var(--text-body)',
            fontSize: 15,
            lineHeight: 1.5,
            textWrap: 'pretty',
          }}
        >
          <strong>
            Estimated time remaining: about {remainingMinutes}{' '}
            {remainingMinutes === 1 ? 'minute' : 'minutes'}
          </strong>
          , based on the sections that apply to you.
        </p>
      )}

      {currentStep.key === 'screening' && (
        <ScreeningForm
          values={sc}
          multi={multi}
          onChange={setScField}
          onMultiToggle={toggleMulti}
          errors={screeningErrors}
        />
      )}

      {currentStep.key === 'plan' && (
        <div
          style={{
            marginTop: 28,
            background: 'var(--surface-1)',
            borderRadius: 16,
            boxShadow: 'var(--shadow-card)',
            padding: 'clamp(20px, 3vw, 32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            animation: 'riseIn 360ms ease-in-out both',
          }}
        >
          {planRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: '1px solid var(--border-subtle)',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: '0 0 44px', fontSize: 14, fontWeight: 700, color: 'var(--text-caption)' }}>
                {row.n}
              </div>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-body)',
                    textWrap: 'pretty',
                  }}
                >
                  {row.t}
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text-caption)',
                    textWrap: 'pretty',
                  }}
                >
                  {row.reason}
                </div>
                {row.meta ? (
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 14,
                      lineHeight: 1.5,
                      color: 'var(--text-body)',
                      textWrap: 'pretty',
                    }}
                  >
                    {row.meta}
                  </div>
                ) : null}
              </div>
              <div style={row.badgeStyle}>{row.badge}</div>
            </div>
          ))}
        </div>
      )}

      {currentStep.key === 's2' && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {S2_LIKERT.map((item) => (
            <LikertItem
              key={item.id}
              question={item.q}
              subtext={item.sub}
              labels={[...item.labels]}
              value={(s2[item.id] as number | null) ?? null}
              onChange={(n) => setS2Field(item.id, n)}
            />
          ))}

          <div
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(20px, 3vw, 32px)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 'clamp(16px, 2.4vw, 24px)',
            }}
          >
            {visibleS2Fields.map((field) => {
              const value = s2[field.id] != null ? String(s2[field.id]) : '';
              const cellStyle: CSSProperties = {
                gridColumn: 'wide' in field && field.wide ? '1 / -1' : 'auto',
              };

              return (
                <div key={field.id} style={cellStyle}>
                  {field.type === 'select' && (
                    <Select
                      label={field.label}
                      options={[...field.options]}
                      value={value}
                      onChange={(e) => setS2Field(field.id, e.target.value)}
                    />
                  )}
                  {field.type === 'number' && (
                    <Input
                      label={field.label}
                      type="number"
                      placeholder={'placeholder' in field ? field.placeholder : undefined}
                      value={value}
                      onChange={(e) => setS2Field(field.id, e.target.value)}
                    />
                  )}
                  {field.type === 'radio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text-body)',
                          textWrap: 'pretty',
                        }}
                      >
                        {field.label}
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {field.options.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setS2Field(field.id, option)}
                            style={chipStyle(value === option)}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {currentStep.key === 's4' && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(20px, 3vw, 32px)',
              animation: 'riseIn 360ms ease-in-out both',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-caption)',
              }}
            >
              Why you are seeing this
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--text-body)',
                textWrap: 'pretty',
              }}
            >
              {s4Reason}
            </div>
          </div>

          {s4AskOptin && (
            <div
              style={{
                background: 'var(--surface-1)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 'clamp(20px, 3vw, 32px)',
                animation: 'riseIn 360ms ease-in-out both',
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  lineHeight: 1.4,
                  color: 'var(--text-body)',
                  textWrap: 'pretty',
                }}
              >
                This section asks about safety inside your household, including situations between
                people living in the same home. Would you like to answer it?
              </div>
              <div
                style={{
                  margin: '8px 0 20px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-caption)',
                  textWrap: 'pretty',
                }}
              >
                Choosing no skips the whole section. It does not affect anything else in the survey,
                and we are not told why you skipped it.
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <Button variant="primary" onClick={() => setS4OptIn('yes')}>
                  Yes, include this section
                </Button>
                <Button variant="secondary" onClick={() => setS4OptIn('no')}>
                  No, skip this section
                </Button>
              </div>
            </div>
          )}

          {s4Skipped && (
            <div
              style={{
                background: 'var(--surface-1)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 'clamp(20px, 3vw, 32px)',
                border: '1px solid var(--border-subtle)',
                animation: 'riseIn 360ms ease-in-out both',
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-body)' }}>
                Section skipped
              </div>
              <div
                style={{
                  margin: '8px 0 20px',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-caption)',
                  textWrap: 'pretty',
                }}
              >
                Every field in this section will be stored as not_shown, and section_4_shown will be
                recorded as false. You can change your mind before you submit.
              </div>
              <Button variant="secondary" onClick={() => setS4OptIn('yes')}>
                Include it after all
              </Button>
            </div>
          )}

          {s4Open && (
            <div
              style={{
                background: 'var(--surface-1)',
                borderRadius: 16,
                boxShadow: 'var(--shadow-card)',
                padding: 'clamp(20px, 3vw, 32px)',
                animation: 'riseIn 360ms ease-in-out both',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  paddingBottom: 20,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text-caption)',
                    maxWidth: 420,
                    textWrap: 'pretty',
                  }}
                >
                  You can leave this whole section without answering anything. The decline control
                  stays visible above the questions, not only beside them.
                </div>
                <Button variant="secondary" onClick={() => setS4OptIn('no')}>
                  Skip this section
                </Button>
              </div>
              <div
                style={{
                  marginTop: 20,
                  border: '1px dashed var(--border-structural)',
                  borderRadius: 8,
                  padding: 'clamp(16px, 3vw, 24px)',
                  fontSize: 14,
                  lineHeight: 1.5,
                  color: 'var(--text-caption)',
                  textWrap: 'pretty',
                }}
              >
                Section 4 items are not written yet. This screen exists to lock the gate and decline
                pattern that every gated section will reuse — Sections 3 extended, 5, 7a and 7b get
                the same treatment once their items are drafted in the Section 2 format.
              </div>
            </div>
          )}
        </div>
      )}

      {currentStep.key === 'review' && (
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <ReviewSectionCards
            cards={reviewCards}
            onEdit={(stepIndex) => setStep(stepIndex)}
            onEditScreening={() => setStep(0)}
          />

          <div
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(20px, 3vw, 32px)',
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--text-caption)',
                textWrap: 'pretty',
              }}
            >
              Your answers help shape which features get built and which problems the system is
              designed to solve. Results are shared with the Homeowners Association and our academic
              adviser as combined numbers and patterns, not as individual responses.
            </p>
          </div>

          <InterviewOptInCard
            value={interview}
            errors={interviewErrors}
            onChange={(next) => {
              setInterview(next);
              setInterviewErrors({});
            }}
          />
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <Button variant="secondary" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Back
        </Button>
        {currentStep.key === 'review' ? (
          <Button variant="primary" disabled={submitting} onClick={handleSubmit}>
            Submit my answers
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={() => {
              if (currentStep.key === 'screening') {
                const nextErrors = validateScreeningStep(sc, multi);
                setScreeningErrors(nextErrors);
                if (Object.keys(nextErrors).length > 0) return;
              }
              setStep((s) => Math.min(STEPS.length - 1, s + 1));
            }}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
