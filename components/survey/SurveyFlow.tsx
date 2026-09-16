'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import { ScreeningForm } from '@/components/survey/ScreeningForm';
import { LikertItem } from '@/components/survey/LikertItem';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { submitSurveyResponse } from '@/lib/firebase/firestore';
import { PERIMETER_PHASES } from '@/survey/config';
import {
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
  ScreeningData,
  Section2Answers,
  SurveyResponse,
} from '@/survey/schema';

type S4OptIn = 'yes' | 'no' | null;

const CIVIL_STATUS_MAP: Record<string, ScreeningData['civilStatus']> = {
  Single: 'single',
  Married: 'married',
  Widowed: 'widowed',
  Separated: 'separated',
  Divorced: 'divorced',
};

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

/** Map display-label screening answers into typed ScreeningData for gating helpers. */
function toScreeningData(sc: Record<string, string>): ScreeningData {
  return {
    addrPhase: sc.addr_phase ?? '',
    addrBlock: sc.addr_block,
    addrLot: sc.addr_lot,
    householdSize: (sc.household_size === '6 or more' ? '6+' : sc.household_size || '1') as ScreeningData['householdSize'],
    childrenYn: sc.children_yn === 'Yes' ? 'yes' : 'no',
    childrenCount: undefined,
    civilStatus: CIVIL_STATUS_MAP[sc.civil_status ?? ''] ?? 'single',
    sex: sc.sex === 'Male' ? 'male' : 'female',
    ageRange: '18-25',
    residentType: 'homeowner',
    pwdSelf: sc.pwd_self === 'Yes' ? 'yes' : 'no',
    pwdHousehold: sc.pwd_household === 'Yes' ? 'yes' : 'no',
    primaryChannel: 'none',
  };
}

function computeGates(sc: Record<string, string>, s4OptIn: S4OptIn) {
  const data = toScreeningData(sc);
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

function buildDocJson(
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>>,
  s2: Record<string, string | number>,
  s4OptIn: S4OptIn,
): string {
  const g = computeGates(sc, s4OptIn);
  const doc: Record<string, unknown> = {
    submitted_at: '<server timestamp>',
    anonymous: true,
    language: 'EN',
  };

  SCREENING_FIELDS.forEach((field) => {
    if ('when' in field && field.when && !field.when(sc)) {
      doc[field.id] = 'not_shown';
      return;
    }
    if (field.id === 'disability_type') {
      const keys = Object.keys(multi.disability_type ?? {});
      doc[field.id] = keys.length ? keys : null;
      return;
    }
    doc[field.id] = sc[field.id] || null;
  });

  S2_LIKERT.forEach((item) => {
    doc[item.id] = s2[item.id] ?? null;
  });
  S2_FIELDS.forEach((field) => {
    doc[field.id] = s2[field.id] ?? null;
  });

  doc.section_3_extended_shown = g.perimeter;
  doc.section_4_shown = g.s4;
  doc.section_5_shown = g.s5;
  doc.section_7a_shown = g.s7a;
  doc.section_7b_shown = g.s7b;

  if (!g.s4) doc.s4_items = 'not_shown';
  if (!g.s5) doc.s5_items = 'not_shown';
  if (!g.s7a) doc.s7a_items = 'not_shown';
  if (!g.s7b) doc.s7b_items = 'not_shown';
  if (!g.perimeter) doc.s3_extended_items = 'not_shown';

  return JSON.stringify(doc, null, 2);
}

function buildSurveyResponse(
  sc: Record<string, string>,
  multi: Record<string, Record<string, boolean>>,
  s2: Record<string, string | number>,
  s4OptIn: S4OptIn,
): SurveyResponse {
  const g = computeGates(sc, s4OptIn);
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
    language: 'EN',
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
  };
}

/**
 * Multi-step resident survey flow with gating, review, and Firestore submit stub.
 */
export function SurveyFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [sc, setSc] = useState<Record<string, string>>({});
  const [multi, setMulti] = useState<Record<string, Record<string, boolean>>>({});
  const [s2, setS2] = useState<Record<string, string | number>>({});
  const [s4OptIn, setS4OptIn] = useState<S4OptIn>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentStep = STEPS[step] ?? STEPS[0];
  const gates = useMemo(() => computeGates(sc, s4OptIn), [sc, s4OptIn]);

  const setScField = useCallback((id: string, value: string) => {
    setSc((prev) => ({ ...prev, [id]: value }));
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
  }, []);

  const setS2Field = useCallback((id: string, value: string | number) => {
    setS2((prev) => ({ ...prev, [id]: value }));
  }, []);

  const planRows = useMemo(() => {
    return SECTIONS.map((section) => {
      let shown = false;
      if ('always' in section && section.always) {
        shown = true;
      } else if ('key' in section && section.key) {
        shown = !!gates[section.key as keyof typeof gates];
      }
      return {
        n: section.n,
        t: section.t,
        reason:
          'always' in section && section.always
            ? 'Shown to every respondent.'
            : shown
              ? section.why
              : section.whyNot,
        badge: shown ? 'Will appear' : 'Skipped',
        badgeStyle: {
          flex: '0 0 auto',
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase' as const,
          padding: '6px 10px',
          borderRadius: 8,
          background: shown ? 'var(--bright-amber)' : 'transparent',
          color: shown ? 'var(--black)' : 'var(--text-caption)',
          border: shown ? '1px solid var(--bright-amber)' : '1px solid var(--border-default)',
        },
      };
    });
  }, [gates]);

  const reviewRows = useMemo(() => {
    const screeningRows = SCREENING_FIELDS.filter(
      (field) => !('when' in field) || !field.when || field.when(sc),
    ).map((field) => ({
      label: field.label,
      value: answerLabel(field.id, sc, multi),
    }));

    const likertRows = S2_LIKERT.map((item, index) => ({
      label: `Section 2 item ${index + 1} — ${item.labels[0]} to ${item.labels[4]}`,
      value: s2[item.id] ? `${String(s2[item.id])} of 5` : 'Not answered',
    }));

    const s2FieldRows = S2_FIELDS.map((field) => ({
      label: field.label,
      value: s2[field.id] != null && s2[field.id] !== '' ? String(s2[field.id]) : 'Not answered',
    }));

    return [
      ...screeningRows,
      ...likertRows,
      ...s2FieldRows,
      {
        label: 'Section 4 — household and personal safety',
        value: gates.s4 ? 'Included' : 'Skipped (stored as not_shown)',
      },
    ];
  }, [sc, multi, s2, gates.s4]);

  const docJson = useMemo(
    () => buildDocJson(sc, multi, s2, s4OptIn),
    [sc, multi, s2, s4OptIn],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitSurveyResponse(buildSurveyResponse(sc, multi, s2, s4OptIn));
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

      {currentStep.key === 'screening' && (
        <ScreeningForm
          values={sc}
          multi={multi}
          onChange={setScField}
          onMultiToggle={toggleMulti}
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
              key={row.n}
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
                color: 'var(--text-section-heading)',
                marginBottom: 16,
              }}
            >
              Your answers
            </div>
            {reviewRows.map((row) => (
              <div
                key={row.label}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                }}
              >
                <div
                  style={{
                    flex: '1 1 220px',
                    minWidth: 0,
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: 'var(--text-caption)',
                    textWrap: 'pretty',
                  }}
                >
                  {row.label}
                </div>
                <div
                  style={{
                    flex: '1 1 140px',
                    minWidth: 0,
                    fontSize: 16,
                    color: 'var(--text-body)',
                  }}
                >
                  {row.value}
                </div>
              </div>
            ))}
            <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button variant="secondary" onClick={() => setStep(0)}>
                Edit screening
              </Button>
              <Button variant="secondary" onClick={() => setStep(2)}>
                Edit section 2
              </Button>
            </div>
          </div>

          <div
            style={{
              background: 'var(--surface-1)',
              borderRadius: 16,
              boxShadow: 'var(--shadow-card)',
              padding: 'clamp(20px, 3vw, 32px)',
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                color: 'var(--text-section-heading)',
                marginBottom: 12,
              }}
            >
              What gets stored
            </div>
            <div
              style={{
                fontSize: 14,
                lineHeight: 1.5,
                color: 'var(--text-caption)',
                marginBottom: 16,
                textWrap: 'pretty',
              }}
            >
              On submit, one document is written to the Firebase responses collection. Fields in
              sections your answers never unlocked are stored as not_shown, alongside a boolean flag
              per gated section.
            </div>
            <pre
              style={{
                margin: 0,
                overflow: 'auto',
                maxHeight: 280,
                background: 'var(--surface-2)',
                borderRadius: 8,
                padding: 16,
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--text-body)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {docJson}
            </pre>
          </div>
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
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
}
