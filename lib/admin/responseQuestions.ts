import {
  communicationByResident,
  type CountBucket,
} from '@/lib/admin/analytics';
import {
  LIKERT_LABELS,
  PHASE_OPTIONS,
  RESIDENT_OPTIONS,
  type SampleRecord,
  type SampleSection2,
} from '@/lib/admin/sampleResponses';

export type ChartKind = 'pie' | 'hbar';

export interface ResponseQuestion {
  id: string;
  title: string;
  kind: ChartKind;
  /** For checkbox-style questions, denominator stays total respondents. */
  multiSelect?: boolean;
  /** Optional note under the chart (e.g. cross-filter explanation). */
  hint?: string;
  buckets: (records: SampleRecord[]) => CountBucket[];
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function singleChoice(
  records: SampleRecord[],
  labels: readonly string[],
  pick: (r: SampleRecord) => string,
): CountBucket[] {
  const total = records.length;
  return labels.map((label) => {
    const count = records.filter((r) => pick(r) === label).length;
    return { label, count, pct: pct(count, total) };
  });
}

function multiFlag(
  records: SampleRecord[],
  defs: { label: string; pred: (r: SampleRecord) => boolean }[],
): CountBucket[] {
  const total = records.length;
  return defs.map(({ label, pred }) => {
    const count = records.filter(pred).length;
    return { label, count, pct: pct(count, total) };
  });
}

const LIKERT_SCALE = ['1', '2', '3', '4', '5'] as const;
const LIKERT_SCALE_LABELS: Record<(typeof LIKERT_SCALE)[number], string> = {
  '1': '1 — Strongly disagree / very poor',
  '2': '2 — Disagree / poor',
  '3': '3 — Neutral',
  '4': '4 — Agree / good',
  '5': '5 — Strongly agree / excellent',
};

function likertBuckets(
  records: SampleRecord[],
  key: keyof SampleSection2,
): CountBucket[] {
  const total = records.length;
  return LIKERT_SCALE.map((value) => {
    const n = Number(value) as 1 | 2 | 3 | 4 | 5;
    const count = records.filter((r) => r.section2[key] === n).length;
    return {
      label: LIKERT_SCALE_LABELS[value],
      count,
      pct: pct(count, total),
    };
  });
}

/**
 * Forms-style question catalog for Summary / Question views.
 */
export const RESPONSE_QUESTIONS: ResponseQuestion[] = [
  {
    id: 'phase',
    title: 'Camella Homes Tibig development phase',
    kind: 'pie',
    buckets: (records) => singleChoice(records, PHASE_OPTIONS, (r) => r.phase),
  },
  {
    id: 'resident',
    title: 'Resident type',
    kind: 'pie',
    buckets: (records) => singleChoice(records, RESIDENT_OPTIONS, (r) => r.resident),
  },
  {
    id: 'pwd',
    title: 'Do you identify as a person with a disability (PWD)?',
    kind: 'pie',
    buckets: (records) => singleChoice(records, ['Yes', 'No'], (r) => r.pwd),
  },
  {
    id: 'language',
    title: 'Survey language',
    kind: 'pie',
    buckets: (records) => singleChoice(records, ['EN', 'FIL'], (r) => r.language),
  },
  {
    id: 'gated',
    title: 'Which gated branches were shown?',
    kind: 'hbar',
    multiSelect: true,
    buckets: (records) =>
      multiFlag(records, [
        { label: 'Homeowner', pred: (r) => r.homeowner },
        { label: 'Tenant / lessee', pred: (r) => r.tenant },
        { label: 'Accessibility', pred: (r) => r.accessibility },
        { label: 'Permits extended', pred: (r) => r.permitsExtended },
        { label: 'Device-dependent digital', pred: (r) => r.deviceDependent },
      ]),
  },
  {
    id: 'comm-by-resident',
    title: 'Communication quality — mean by resident type',
    kind: 'hbar',
    hint: 'Cross-filter: average of the five communication Likert items, grouped by resident type. Bar length = mean × 20 (5.0 → 100%).',
    buckets: (records) => communicationByResident(records),
  },
  ...LIKERT_LABELS.map(
    ({ key, label }): ResponseQuestion => ({
      id: key,
      title: `Communication quality — ${label}`,
      kind: 'hbar',
      buckets: (records) => likertBuckets(records, key),
    }),
  ),
];

export function chartTextForCopy(
  title: string,
  responseCount: number,
  buckets: CountBucket[],
): string {
  const lines = buckets.map((b) => `${b.label}: ${b.count} (${b.pct}%)`);
  return [`${title}`, `${responseCount} responses`, ...lines].join('\n');
}

export function getQuestionById(id: string): ResponseQuestion | undefined {
  return RESPONSE_QUESTIONS.find((q) => q.id === id);
}

export const SUMMARY_PIE_IDS = ['phase', 'resident', 'pwd', 'language'] as const;
export const SUMMARY_FULL_IDS = ['gated', 'comm-by-resident'] as const;
export const SUMMARY_LIKERT_IDS = LIKERT_LABELS.map((l) => l.key);
