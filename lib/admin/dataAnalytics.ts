import type { CountBucket } from '@/lib/admin/analytics';
import { parseSubmittedAt } from '@/lib/admin/dateRange';
import { scaleScore } from '@/lib/admin/extendedWidgets';
import { PHASE_OPTIONS, type SampleRecord } from '@/lib/admin/sampleResponses';
import { O1_CATEGORIES } from '@/survey/o1';

function pct(part: number, total: number): number {
  return total <= 0 ? 0 : Math.round((part / total) * 100);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function isoDay(ms: number): string {
  const d = new Date(ms);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

// ---- trend ------------------------------------------------------------------

export interface DayPoint {
  iso: string;
  label: string;
  /** Responses that day. */
  count: number;
  /** Responses up to and including that day. */
  total: number;
}

/** One point per calendar day, gaps filled with zero, capped to the most recent `maxDays`. */
export function dailySeries(records: SampleRecord[], maxDays = 45): DayPoint[] {
  const times = records.map((r) => parseSubmittedAt(r.submittedAt)).filter((t) => Number.isFinite(t));
  if (times.length === 0) return [];
  const perDay = new Map<string, number>();
  for (const t of times) perDay.set(isoDay(t), (perDay.get(isoDay(t)) ?? 0) + 1);

  const first = new Date(Math.min(...times));
  const last = new Date(Math.max(...times));
  first.setHours(12, 0, 0, 0);
  last.setHours(12, 0, 0, 0);

  const all: DayPoint[] = [];
  let running = 0;
  for (const d = new Date(first); d <= last; d.setDate(d.getDate() + 1)) {
    const iso = isoDay(d.getTime());
    const count = perDay.get(iso) ?? 0;
    running += count;
    all.push({
      iso,
      label: d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
      count,
      total: running,
    });
  }
  return all.slice(-maxDays);
}

// ---- scale questions --------------------------------------------------------

export type ScaleKind = 'agreement' | 'likelihood';

export interface ScaleDef {
  code: string;
  label: string;
}

export interface ScaleRow {
  code: string;
  label: string;
  /** Answers scored 1 to 5, index 0 is score 1. */
  counts: [number, number, number, number, number];
  n: number;
  mean: number;
  /** Mean to full precision, for reports that need two decimals. */
  meanExact: number;
  /** Sample standard deviation of the scored answers. */
  sd: number;
  /** Answered "Not applicable". Left out of n and the mean. */
  notApplicable: number;
}

export const FEATURE_ITEMS: ScaleDef[] = [
  { code: 'F1', label: 'Visitor and worker pre-registration' },
  { code: 'F2', label: 'Street and event closure permits' },
  { code: 'F3', label: 'Tenant and owner forms' },
  { code: 'F4', label: 'Online registration with ID' },
  { code: 'F5', label: 'Requests with status tracking' },
  { code: 'F6', label: 'Accessible version of the website' },
];

export const ACCESS_ITEMS: ScaleDef[] = [
  { code: 'S1', label: 'Office hours make transactions hard' },
  { code: 'S2', label: 'Must visit the office for simple matters' },
  { code: 'S3', label: 'Concerns get a reasonable response time' },
  { code: 'F7', label: 'A website like this would solve resident problems' },
];

export const READINESS_ITEMS: ScaleDef[] = [
  { code: 'B7', label: 'Internet stable enough for an online form' },
  { code: 'B9', label: 'Comfortable opening a website on a phone' },
  { code: 'R1', label: 'Comfortable uploading a photo of an ID' },
  { code: 'R2', label: 'Trust that only authorized staff see an ID' },
];

export function scaleRows(records: SampleRecord[], items: ScaleDef[]): ScaleRow[] {
  return items.map(({ code, label }) => {
    const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0];
    let notApplicable = 0;
    for (const r of records) {
      const raw = (r.answers as Record<string, unknown> | undefined)?.[code];
      if (raw === 'not_applicable') {
        notApplicable += 1;
        continue;
      }
      const score = scaleScore(raw);
      if (score != null) counts[score - 1]! += 1;
    }
    const n = counts.reduce((a, b) => a + b, 0);
    const sum = counts.reduce((acc, c, i) => acc + c * (i + 1), 0);
    const meanExact = n ? sum / n : 0;
    const variance = n > 1 ? counts.reduce((acc, c, i) => acc + c * (i + 1 - meanExact) ** 2, 0) / (n - 1) : 0;
    return { code, label, counts, n, mean: n ? round1(sum / n) : 0, meanExact, sd: Math.sqrt(variance), notApplicable };
  });
}

// ---- distributions ----------------------------------------------------------

export function phaseBuckets(records: SampleRecord[]): CountBucket[] {
  const total = records.length;
  return PHASE_OPTIONS.map((label) => {
    const count = records.filter((r) => r.phase === label).length;
    return { label, count, pct: pct(count, total) };
  });
}

const AGE_LABELS: Array<[string, string]> = [
  ['18-24', '18–24'],
  ['25-34', '25–34'],
  ['35-44', '35–44'],
  ['45-54', '45–54'],
  ['55-64', '55–64'],
  ['65+', '65+'],
  ['prefer_not_to_say', 'No answer'],
];

export function ageBuckets(records: SampleRecord[]): CountBucket[] {
  const total = records.length;
  return AGE_LABELS.map(([id, label]) => {
    const count = records.filter((r) => r.answers?.A6 === id).length;
    return { label, count, pct: pct(count, total) };
  });
}

export function deviceBuckets(records: SampleRecord[]): CountBucket[] {
  const total = records.length;
  const phone = records.filter((r) => (r.deviceClass ?? 'phone') === 'phone').length;
  const computer = total - phone;
  return [
    { label: 'Phone', count: phone, pct: pct(phone, total) },
    { label: 'Computer', count: computer, pct: pct(computer, total) },
  ];
}

export function residentBuckets(records: SampleRecord[]): CountBucket[] {
  const total = records.length;
  const labels = Array.from(new Set(records.map((r) => r.resident)));
  return labels
    .map((label) => {
      const count = records.filter((r) => r.resident === label).length;
      return { label, count, pct: pct(count, total) };
    })
    .sort((a, b) => b.count - a.count);
}

// ---- problems ---------------------------------------------------------------

export interface ProblemRow {
  id: string;
  label: string;
  count: number;
  pct: number;
}

export function problemRanking(records: SampleRecord[]): ProblemRow[] {
  const total = records.length;
  return O1_CATEGORIES.map((c) => {
    const count = records.filter((r) => (r.answers?.O1 as string[] | undefined)?.includes(c.id)).length;
    return { id: c.id, label: c.label, count, pct: pct(count, total) };
  }).sort((a, b) => b.count - a.count);
}

export interface HeatRow {
  id: string;
  label: string;
  cells: Array<{ phase: string; count: number; pct: number }>;
}

/** Share of each phase's respondents who reported each of the top problems. */
export function problemsByPhase(records: SampleRecord[], top = 6): { phases: string[]; rows: HeatRow[]; max: number } {
  const ranked = problemRanking(records).filter((p) => p.count > 0).slice(0, top);
  const phases = [...PHASE_OPTIONS];
  let max = 0;
  const rows = ranked.map((problem) => {
    const cells = phases.map((phase) => {
      const inPhase = records.filter((r) => r.phase === phase);
      const count = inPhase.filter((r) => (r.answers?.O1 as string[] | undefined)?.includes(problem.id)).length;
      const share = pct(count, inPhase.length);
      if (share > max) max = share;
      return { phase, count, pct: share };
    });
    return { id: problem.id, label: problem.label, cells };
  });
  return { phases, rows, max };
}

// ---- headline numbers -------------------------------------------------------

export function averageFeatureInterest(records: SampleRecord[]): { mean: number; n: number } {
  const rows = scaleRows(records, FEATURE_ITEMS);
  const n = rows.reduce((a, r) => a + r.n, 0);
  const sum = rows.reduce((a, r) => a + r.counts.reduce((acc, c, i) => acc + c * (i + 1), 0), 0);
  return { mean: n ? round1(sum / n) : 0, n };
}

export function interviewShare(records: SampleRecord[]): { yes: number; pct: number } {
  const yes = records.filter((r) => r.answers?.IV1 === 'yes').length;
  return { yes, pct: pct(yes, records.length) };
}

export function highlightLines(records: SampleRecord[], last7: number): string[] {
  if (records.length === 0) return [];
  const lines: string[] = [];
  lines.push(`${last7} new ${last7 === 1 ? 'response' : 'responses'} in the last 7 days`);

  const features = scaleRows(records, FEATURE_ITEMS)
    .filter((r) => r.n > 0)
    .sort((a, b) => b.mean - a.mean);
  if (features[0]) lines.push(`Most wanted feature: ${features[0].label} (${features[0].mean} of 5)`);

  const topProblem = problemRanking(records)[0];
  if (topProblem && topProblem.count > 0) {
    lines.push(`Most reported problem: ${topProblem.label} (${topProblem.pct}% of residents)`);
  }

  const phase = phaseBuckets(records).sort((a, b) => b.count - a.count)[0];
  if (phase && phase.count > 0) lines.push(`Most responses from ${phase.label} (${phase.pct}%)`);
  return lines;
}

// ---- group comparison -------------------------------------------------------

export interface GroupMeans {
  code: string;
  label: string;
  /** Average likelihood (1 to 5) per group, or null when nobody in the group answered. */
  homeowner: { mean: number | null; n: number };
  tenant: { mean: number | null; n: number };
}

/** Average interest in each feature, homeowners next to tenants. */
export function featureByResidentGroup(records: SampleRecord[]): {
  rows: GroupMeans[];
  homeownerCount: number;
  tenantCount: number;
} {
  const homeowners = records.filter((r) => r.homeowner);
  const tenants = records.filter((r) => r.tenant);
  const ownerRows = scaleRows(homeowners, FEATURE_ITEMS);
  const tenantRows = scaleRows(tenants, FEATURE_ITEMS);
  const rows = FEATURE_ITEMS.map((item, i) => ({
    code: item.code,
    label: item.label,
    homeowner: { mean: ownerRows[i]!.n ? ownerRows[i]!.mean : null, n: ownerRows[i]!.n },
    tenant: { mean: tenantRows[i]!.n ? tenantRows[i]!.mean : null, n: tenantRows[i]!.n },
  }));
  return { rows, homeownerCount: homeowners.length, tenantCount: tenants.length };
}

// ---- responses by resident type over time -----------------------------------

export type ResidentGroupId = 'owner' | 'away' | 'tenant' | 'household';

export const RESIDENT_GROUPS: Array<{ id: ResidentGroupId; label: string }> = [
  { id: 'owner', label: 'Homeowner living in the unit' },
  { id: 'away', label: 'Homeowner living elsewhere' },
  { id: 'tenant', label: 'Tenant or lessee' },
  { id: 'household', label: 'Household member' },
];

/** The six resident answers folded into four groups that stay readable on one chart. */
export function residentGroupOf(resident: string): ResidentGroupId | null {
  if (resident === 'Homeowner living in the unit') return 'owner';
  if (resident === 'OFW homeowner' || resident === 'Absentee homeowner') return 'away';
  if (resident === 'Tenant or lessee') return 'tenant';
  if (resident.startsWith('Family or household member')) return 'household';
  return null;
}

export interface ResidentSeries {
  points: DayPoint[];
  groups: Array<{
    id: ResidentGroupId;
    label: string;
    /** Responses per day, aligned with points. */
    daily: number[];
    /** Running total, aligned with points. */
    total: number[];
    sum: number;
  }>;
}

/** Per-day and running counts for each resident group, on the same days as dailySeries. */
export function residentSeries(records: SampleRecord[], maxDays = 45): ResidentSeries {
  const points = dailySeries(records, maxDays);
  if (points.length === 0) return { points, groups: [] };

  const perGroupDay = new Map<string, number>();
  const before = new Map<ResidentGroupId, number>();
  const firstIso = points[0]!.iso;
  for (const r of records) {
    const group = residentGroupOf(r.resident);
    const t = parseSubmittedAt(r.submittedAt);
    if (!group || !Number.isFinite(t)) continue;
    const iso = isoDay(t);
    if (iso < firstIso) before.set(group, (before.get(group) ?? 0) + 1);
    else perGroupDay.set(`${group}|${iso}`, (perGroupDay.get(`${group}|${iso}`) ?? 0) + 1);
  }

  const groups = RESIDENT_GROUPS.map(({ id, label }) => {
    let running = before.get(id) ?? 0;
    const daily = points.map((p) => perGroupDay.get(`${id}|${p.iso}`) ?? 0);
    const total = daily.map((count) => (running += count));
    return { id, label, daily, total, sum: daily.reduce((a, b) => a + b, 0) + (before.get(id) ?? 0) };
  }).filter((g) => g.sum > 0);

  return { points, groups };
}
