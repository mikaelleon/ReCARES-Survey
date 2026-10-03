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
  last7DaysCount: number;
  tenantCount: number;
  tenantPct: number;
  homeownerCount: number;
  homeownerPct: number;
  accessibilityCount: number;
  accessibilityPct: number;
  pwdRelatedCount: number;
  pwdRelatedPct: number;
}

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

/** Screening field only (A4 = yes). Not the same as accessibility-path gate. */
export function isPwdScreeningYes(r: SampleRecord): boolean {
  return r.pwd === 'Yes';
}

/** @deprecated Use isPwdScreeningYes — old helper double-counted accessibility. */
export function isPwdRelated(r: SampleRecord): boolean {
  return isPwdScreeningYes(r);
}

export function computeKpis(
  records: SampleRecord[],
  now = new Date(),
): DashboardKpis {
  const total = records.length;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const last7DaysCount = records.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return now.getTime() - t <= weekMs;
  }).length;
  const tenantCount = records.filter((r) => r.tenant).length;
  const homeownerCount = records.filter((r) => r.homeowner).length;
  /** Same flag as Responses chart label "Accessibility". */
  const accessibilityCount = records.filter((r) => r.accessibility).length;
  /** Distinct cut: screening Yes only (does not OR-in accessibility). */
  const pwdRelatedCount = records.filter(isPwdScreeningYes).length;

  return {
    total,
    last7DaysCount,
    tenantCount,
    tenantPct: pct(tenantCount, total),
    homeownerCount,
    homeownerPct: pct(homeownerCount, total),
    accessibilityCount,
    accessibilityPct: pct(accessibilityCount, total),
    pwdRelatedCount,
    pwdRelatedPct: pct(pwdRelatedCount, total),
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
    { key: 'homeowner', label: 'Homeowner', pred: (r) => r.homeowner },
    { key: 'tenant', label: 'Tenant/lessee', pred: (r) => r.tenant },
    { key: 'accessibility', label: 'Accessibility', pred: (r) => r.accessibility },
    { key: 'permits', label: 'Permits extended', pred: (r) => r.permitsExtended },
    { key: 'device', label: 'Device-dependent', pred: (r) => r.deviceDependent },
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

/** Mean communication-quality score (all Likert keys) by resident type. */
export function communicationByResident(records: SampleRecord[]): CountBucket[] {
  const groups = new Map<string, { sum: number; n: number }>();
  for (const r of records) {
    const keys = LIKERT_LABELS.map((l) => l.key);
    const avg = keys.reduce((acc, k) => acc + r.section2[k], 0) / keys.length;
    const cur = groups.get(r.resident) ?? { sum: 0, n: 0 };
    cur.sum += avg;
    cur.n += 1;
    groups.set(r.resident, cur);
  }
  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, { sum, n }]) => {
      const mean = n ? Math.round((sum / n) * 10) / 10 : 0;
      return {
        label,
        count: n,
        /** Reuse pct slot as mean×20 so bar charts have a 0–100-ish scale (mean 5 → 100). */
        pct: Math.round(mean * 20),
      };
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
    'homeowner',
    'tenant',
    'accessibility',
    'permitsExtended',
    'deviceDependent',
    'language',
    ...LIKERT_LABELS.map((l) => l.key),
  ];
  const rows = records.map((r) =>
    [
      r.id,
      r.submittedAt,
      r.phase,
      r.resident,
      r.pwd,
      r.homeowner,
      r.tenant,
      r.accessibility,
      r.permitsExtended,
      r.deviceDependent,
      r.language,
      ...LIKERT_LABELS.map((l) => r.section2[l.key]),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function buildSummaryText(records: SampleRecord[]): string {
  const kpis = computeKpis(records);
  return [
    'ReCARES dashboard summary (aggregates only)',
    `Responses: ${kpis.total}`,
    `Last 7 days: ${kpis.last7DaysCount}`,
    `Tenant/lessee branch: ${kpis.tenantCount} (${kpis.tenantPct}%)`,
    `Homeowner branch: ${kpis.homeownerCount} (${kpis.homeownerPct}%)`,
    `Accessibility path: ${kpis.accessibilityCount} (${kpis.accessibilityPct}%)`,
    `PWD screening (Yes): ${kpis.pwdRelatedCount} (${kpis.pwdRelatedPct}%)`,
    `Accessibility path: ${kpis.accessibilityCount} (${kpis.accessibilityPct}%)`,
  ].join('\n');
}
