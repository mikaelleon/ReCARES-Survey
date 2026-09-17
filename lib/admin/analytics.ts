import {
  LIKERT_LABELS,
  type SampleRecord,
  type SampleSection2,
} from '@/lib/admin/sampleResponses';

export interface CountBucket {
  label: string;
  count: number;
  pct: number;
}

export interface GateCoverage {
  key: string;
  label: string;
  count: number;
  pct: number;
}

export interface LikertMean {
  key: keyof SampleSection2;
  label: string;
  mean: number;
}

export interface DashboardKpis {
  total: number;
  section4Count: number;
  section4Pct: number;
  pwdRelatedCount: number;
  pwdRelatedPct: number;
  last7DaysCount: number;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export function isPwdRelated(r: SampleRecord): boolean {
  return r.pwd === 'Yes' || r.s7b || r.s7a;
}

export function computeKpis(
  records: SampleRecord[],
  now = new Date(),
): DashboardKpis {
  const total = records.length;
  const section4Count = records.filter((r) => r.s4).length;
  const pwdRelatedCount = records.filter(isPwdRelated).length;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const last7DaysCount = records.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return now.getTime() - t <= weekMs;
  }).length;

  return {
    total,
    section4Count,
    section4Pct: pct(section4Count, total),
    pwdRelatedCount,
    pwdRelatedPct: pct(pwdRelatedCount, total),
    last7DaysCount,
  };
}

function toBuckets(
  labels: string[],
  records: SampleRecord[],
  pick: (r: SampleRecord) => string,
): CountBucket[] {
  const total = records.length;
  return labels.map((label) => {
    const count = records.filter((r) => pick(r) === label).length;
    return { label, count, pct: pct(count, total) };
  });
}

export function countByPhase(records: SampleRecord[]): CountBucket[] {
  const phases = Array.from(new Set(records.map((r) => r.phase))).sort();
  return toBuckets(phases, records, (r) => r.phase);
}

export function countByResident(records: SampleRecord[]): CountBucket[] {
  const types = Array.from(new Set(records.map((r) => r.resident))).sort();
  return toBuckets(types, records, (r) => r.resident);
}

export function gateCoverage(records: SampleRecord[]): GateCoverage[] {
  const total = records.length;
  const defs: { key: string; label: string; pred: (r: SampleRecord) => boolean }[] = [
    { key: 'ext', label: '3 extended', pred: (r) => r.ext },
    { key: 's4', label: 'Section 4', pred: (r) => r.s4 },
    { key: 's5', label: 'Section 5', pred: (r) => r.s5 },
    { key: 's7a', label: 'Section 7a', pred: (r) => r.s7a },
    { key: 's7b', label: 'Section 7b', pred: (r) => r.s7b },
  ];
  return defs.map((d) => {
    const count = records.filter(d.pred).length;
    return { key: d.key, label: d.label, count, pct: pct(count, total) };
  });
}

export function likertMeans(records: SampleRecord[]): LikertMean[] {
  if (records.length === 0) {
    return LIKERT_LABELS.map(({ key, label }) => ({ key, label, mean: 0 }));
  }
  return LIKERT_LABELS.map(({ key, label }) => {
    const sum = records.reduce((acc, r) => acc + r.section2[key], 0);
    const mean = Math.round((sum / records.length) * 10) / 10;
    return { key, label, mean };
  });
}

export function formatKpiCaption(count: number, total: number, pctValue: number): string {
  return `${count} of ${total} · ${pctValue}%`;
}

export function buildCsv(records: SampleRecord[]): string {
  const header = [
    'id',
    'submittedAt',
    'phase',
    'resident',
    'pwd',
    'section3_extended',
    'section4',
    'section5',
    'section7a',
    'section7b',
    'language',
  ];
  const rows = records.map((r) =>
    [
      r.id,
      r.submittedAt,
      r.phase,
      `"${r.resident.replace(/"/g, '""')}"`,
      r.pwd,
      r.ext ? '1' : '0',
      r.s4 ? '1' : '0',
      r.s5 ? '1' : '0',
      r.s7a ? '1' : '0',
      r.s7b ? '1' : '0',
      r.language,
    ].join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function buildSummaryText(
  kpis: DashboardKpis,
  byPhase: CountBucket[],
): string {
  const phaseLines = byPhase.map((b) => `  ${b.label}: ${b.count} (${b.pct}%)`).join('\n');
  return [
    'ReCARES dashboard summary (aggregates only)',
    `Total responses: ${kpis.total}`,
    `Section 4 shown: ${kpis.section4Count} (${kpis.section4Pct}%)`,
    `PWD-related: ${kpis.pwdRelatedCount} (${kpis.pwdRelatedPct}%)`,
    `Last 7 days: ${kpis.last7DaysCount}`,
    'By phase:',
    phaseLines,
  ].join('\n');
}
