/**
 * Extended Summary widgets (F/B/S/P/C/AC/O/R/IV + response health).
 * All metrics read from the same SampleRecord set as Responses (live Firestore).
 *
 * Intentionally deferred — submissions-over-time trend chart:
 * With single-digit response volume a daily/weekly trend is mostly empty days and
 * would mislead. Add to the picker only once volume supports a meaningful series.
 */

import type { CountBucket } from '@/lib/admin/analytics';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { O1_CATEGORIES } from '@/survey/o1';

export const EXTENDED_WIDGET_IDS = [
  'top-features',
  'digital-feasibility',
  'service-quality',
  'wait-time',
  'street-closure',
  'accessibility-needs',
  'open-problems',
  'registration-ai',
  'interview-recruitment',
  'response-health',
] as const;

export type ExtendedWidgetId = (typeof EXTENDED_WIDGET_IDS)[number];

/** Pre-selected for new admins only — existing admins keep their stored list. */
export const DEFAULT_EXTENDED_WIDGETS: ExtendedWidgetId[] = ['top-features'];

/** Full-width Summary row (alongside gated / comm-by-resident). */
export const EXTENDED_FULL_IDS: ExtendedWidgetId[] = [
  'top-features',
  'street-closure',
  'accessibility-needs',
  'open-problems',
  'registration-ai',
];

/** Compact / half-width cards. */
export const EXTENDED_COMPACT_IDS: ExtendedWidgetId[] = [
  'digital-feasibility',
  'service-quality',
  'wait-time',
  'interview-recruitment',
  'response-health',
];

export function isExtendedWidgetId(id: string): id is ExtendedWidgetId {
  return (EXTENDED_WIDGET_IDS as readonly string[]).includes(id);
}

/** 1–5 only. Excludes 99 / not_shown / missing — same rule as other agreement charts. */
export function scaleScore(value: unknown): number | null {
  if (value === 99 || value === 'not_shown' || value == null) return null;
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 3 || n === 4 || n === 5) return n;
  return null;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function mean(values: number[]): { average: number; n: number } {
  if (values.length === 0) return { average: 0, n: 0 };
  const sum = values.reduce((a, b) => a + b, 0);
  return { average: Math.round((sum / values.length) * 10) / 10, n: values.length };
}

export interface FeatureRanking {
  featureId: 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6';
  label: string;
  averageLikelihood: number;
  responseCount: number;
}

const FEATURE_DEFS: { featureId: FeatureRanking['featureId']; label: string }[] = [
  {
    featureId: 'F1',
    label: 'Online pre-registration for visitors and workers, with a temporary pass',
  },
  { featureId: 'F2', label: 'Online request for street or event closure permits' },
  { featureId: 'F3', label: 'Online tenant and owner forms' },
  { featureId: 'F4', label: 'Online registration with a photo of a valid ID' },
  { featureId: 'F5', label: 'Online channel to send requests and track status' },
  {
    featureId: 'F6',
    label: 'Website with adjustable text, higher contrast, and screen reader support',
  },
];

export function rankFeatures(records: SampleRecord[]): FeatureRanking[] {
  return FEATURE_DEFS.map(({ featureId, label }) => {
    const scores = records
      .map((r) => scaleScore(r.answers?.[featureId]))
      .filter((n): n is number => n != null);
    const { average, n } = mean(scores);
    return { featureId, label, averageLikelihood: average, responseCount: n };
  }).sort((a, b) => b.averageLikelihood - a.averageLikelihood);
}

/** Smartphone / laptop / tablet + wifi/broadband or mobile data (not “no regular internet”). */
export function digitalFeasibility(records: SampleRecord[]): {
  pct: number;
  count: number;
  total: number;
} {
  const capable = records.filter((r) => {
    const b1 = r.answers?.B1 ?? [];
    const hasDevice =
      b1.includes('smartphone') || b1.includes('laptop_desktop') || b1.includes('tablet');
    const b3 = r.answers?.B3;
    const hasNet =
      b3 === 'wifi_broadband' ||
      b3 === 'prepaid_mobile' ||
      b3 === 'postpaid_mobile' ||
      b3 === 'both';
    return hasDevice && hasNet;
  });
  return {
    count: capable.length,
    total: records.length,
    pct: pct(capable.length, records.length),
  };
}

export function serviceQualityGauge(records: SampleRecord[]): {
  average: number;
  pctOfScale: number;
  /** Scored item cells (S1–S3) after excluding 99 / not_shown. */
  n: number;
  /** Distinct respondents with at least one valid S1–S3 score. */
  respondentN: number;
} {
  const scores: number[] = [];
  let respondentN = 0;
  for (const r of records) {
    let any = false;
    for (const key of ['S1', 'S2', 'S3'] as const) {
      const s = scaleScore(r.answers?.[key]);
      if (s != null) {
        scores.push(s);
        any = true;
      }
    }
    if (any) respondentN += 1;
  }
  const { average, n } = mean(scores);
  return {
    average,
    n,
    respondentN,
    pctOfScale: n === 0 ? 0 : Math.round((average / 5) * 100),
  };
}

export function waitTimeStat(records: SampleRecord[]): {
  averageMinutes: number | null;
  answered: number;
  total: number;
} {
  const values = records
    .map((r) => r.answers?.P4)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);
  if (values.length === 0) {
    return { averageMinutes: null, answered: 0, total: records.length };
  }
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    averageMinutes: Math.round(avg * 10) / 10,
    answered: values.length,
    total: records.length,
  };
}

const C1_LABELS: Record<string, string> = {
  requested: 'Requested a closure',
  affected: 'Affected by a closure',
  both: 'Both',
  neither: 'Neither',
};

export function streetClosureC1(records: SampleRecord[]): CountBucket[] {
  const labels = ['requested', 'affected', 'both', 'neither'] as const;
  const total = records.length;
  return labels.map((id) => {
    const count = records.filter((r) => r.answers?.C1 === id).length;
    return { label: C1_LABELS[id], count, pct: pct(count, total) };
  });
}

/** C2/C3 means excluding 99/not_shown; only non-neither C1 (survey skip path). */
export function streetClosureSatisfaction(records: SampleRecord[]): {
  noticeAvg: number;
  rerouteAvg: number;
  n: number;
} {
  const eligible = records.filter((r) => r.answers?.C1 && r.answers.C1 !== 'neither');
  const c2 = eligible
    .map((r) => scaleScore(r.answers?.C2))
    .filter((n): n is number => n != null);
  const c3 = eligible
    .map((r) => scaleScore(r.answers?.C3))
    .filter((n): n is number => n != null);
  return {
    noticeAvg: mean(c2).average,
    rerouteAvg: mean(c3).average,
    n: Math.max(c2.length, c3.length),
  };
}

const AC1_OPTIONS = [
  { id: 'difficulty_walking_climbing', label: 'Difficulty walking or climbing stairs' },
  { id: 'uses_wheelchair_or_aid', label: 'Uses a wheelchair or mobility aid' },
  { id: 'difficulty_seeing', label: 'Difficulty seeing' },
  { id: 'difficulty_hearing', label: 'Difficulty hearing' },
  { id: 'difficulty_reading_forms', label: 'Difficulty reading or understanding forms' },
  { id: 'other', label: 'Other' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' },
] as const;

export function accessibilityNeeds(records: SampleRecord[]): {
  buckets: CountBucket[];
  baseN: number;
} {
  const withAc1 = records.filter((r) => Array.isArray(r.answers?.AC1) && (r.answers?.AC1?.length ?? 0) > 0);
  const baseN = withAc1.length;
  const buckets = AC1_OPTIONS.map(({ id, label }) => {
    const count = withAc1.filter((r) => (r.answers?.AC1 ?? []).includes(id)).length;
    return { label, count, pct: pct(count, baseN) };
  });
  return { buckets, baseN };
}

export function openProblems(records: SampleRecord[]): CountBucket[] {
  const cats = [
    ...O1_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    { id: 'other', label: 'Other' },
    { id: 'none_of_these', label: 'None of these' },
  ];
  const total = records.length;
  return cats
    .map(({ id, label }) => {
      const count = records.filter((r) => (r.answers?.O1 ?? []).includes(id)).length;
      return { label, count, pct: pct(count, total) };
    })
    .sort((a, b) => b.count - a.count);
}

const R3_LABELS: Record<string, string> = {
  deleted_after_verification: 'Deleted after verification',
  kept_while_resident: 'Kept while resident',
  no_preference: 'No preference',
  not_sure: 'Not sure',
};

export function registrationComfort(records: SampleRecord[]): {
  r1Avg: number;
  r2Avg: number;
  r1N: number;
  r2N: number;
} {
  const r1 = records
    .map((r) => scaleScore(r.answers?.R1))
    .filter((n): n is number => n != null);
  const r2 = records
    .map((r) => scaleScore(r.answers?.R2))
    .filter((n): n is number => n != null);
  return {
    r1Avg: mean(r1).average,
    r2Avg: mean(r2).average,
    r1N: r1.length,
    r2N: r2.length,
  };
}

export function registrationRetention(records: SampleRecord[]): CountBucket[] {
  const labels = [
    'deleted_after_verification',
    'kept_while_resident',
    'no_preference',
    'not_sure',
  ] as const;
  const total = records.length;
  return labels.map((id) => {
    const count = records.filter((r) => r.answers?.R3 === id).length;
    return { label: R3_LABELS[id], count, pct: pct(count, total) };
  });
}

export function interviewOptIn(records: SampleRecord[]): { yes: number; total: number } {
  const yes = records.filter((r) => r.answers?.IV1 === 'yes').length;
  return { yes, total: records.length };
}

export function responseHealth(records: SampleRecord[]): {
  /** True only when at least one server-side partial exists in the set. */
  completionAvailable: boolean;
  completionPct: number | null;
  deviceBuckets: CountBucket[];
  languageBuckets: CountBucket[];
} {
  // Drafts are localStorage-only; SurveyFlow only writes status: 'complete'.
  // Do not invent a started-vs-submitted rate from missing server drafts.
  const hasPartial = records.some((r) => r.status === 'partial');
  const total = records.length;
  const completeCount = records.filter((r) => r.status === 'complete').length;
  const phone = records.filter((r) => (r.deviceClass ?? 'phone') === 'phone').length;
  const computer = records.filter((r) => r.deviceClass === 'computer').length;
  const en = records.filter((r) => r.language === 'EN').length;
  const fil = records.filter((r) => r.language === 'FIL').length;

  return {
    completionAvailable: hasPartial,
    completionPct: hasPartial ? pct(completeCount, total) : null,
    deviceBuckets: [
      { label: 'Phone', count: phone, pct: pct(phone, total) },
      { label: 'Computer', count: computer, pct: pct(computer, total) },
    ],
    languageBuckets: [
      { label: 'EN', count: en, pct: pct(en, total) },
      { label: 'FIL', count: fil, pct: pct(fil, total) },
    ],
  };
}

export const EXTENDED_WIDGET_META = [
  {
    id: 'top-features',
    title: 'Top Requested Features',
    description: 'Average likelihood (F1–F6) ranked highest first — what to build first.',
    tag: 'Feature Priority' as const,
    kind: 'hbar' as const,
  },
  {
    id: 'digital-feasibility',
    title: 'Digital Feasibility',
    description: 'Share with smartphone (or better) plus working internet (B1 + B3).',
    tag: 'Digital Access' as const,
    kind: 'stat' as const,
  },
  {
    id: 'service-quality',
    title: 'Current Service Quality',
    description: 'Average of S1–S3 (current HOA service access) as a 1–5 → % gauge.',
    tag: 'Service Quality' as const,
    kind: 'gauge' as const,
  },
  {
    id: 'wait-time',
    title: 'Entrance Wait Time',
    description: 'Average reported gate wait (P4), with answer base N.',
    tag: 'Permits' as const,
    kind: 'stat' as const,
  },
  {
    id: 'street-closure',
    title: 'Street Closure Awareness & Satisfaction',
    description: 'C1 breakdown plus C2/C3 satisfaction (99s excluded).',
    tag: 'Permits' as const,
    kind: 'composite' as const,
  },
  {
    id: 'accessibility-needs',
    title: 'Accessibility Needs Breakdown',
    description: 'AC1 multi-select among respondents who saw the accessibility items.',
    tag: 'Accessibility' as const,
    kind: 'hbar' as const,
  },
  {
    id: 'open-problems',
    title: 'Open Problem Discovery',
    description: 'O1 categories ranked — problems beyond the named survey topics.',
    tag: 'Open Discovery' as const,
    kind: 'hbar' as const,
  },
  {
    id: 'registration-ai',
    title: 'Registration & AI Comfort',
    description: 'R1/R2 comfort plus R3 retention preference — AI ID-validation scope.',
    tag: 'Privacy & AI' as const,
    kind: 'composite' as const,
  },
  {
    id: 'interview-recruitment',
    title: 'Interview Recruitment',
    description: 'Count of IV1 = Yes, with shortcut to Interview Invites.',
    tag: 'Recruitment' as const,
    kind: 'stat' as const,
  },
  {
    id: 'response-health',
    title: 'Response Health',
    description:
      'Device class and language split; completion only when server-side partials exist.',
    tag: 'Response Health' as const,
    kind: 'stat' as const,
  },
];
