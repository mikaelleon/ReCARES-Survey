import type { SampleRecord } from '@/lib/admin/sampleResponses';

export type DatePreset = '7d' | '30d' | 'all' | 'custom';

export interface DateRangeValue {
  preset: DatePreset;
  /** Inclusive start (YYYY-MM-DD) when custom or derived. */
  start: string | null;
  /** Inclusive end (YYYY-MM-DD) when custom or derived. */
  end: string | null;
}

export const DEFAULT_DATE_RANGE: DateRangeValue = {
  preset: 'all',
  start: null,
  end: null,
};

const STORAGE_KEY = 'recares-admin-date-range';

function toDayStart(isoDate: string): number {
  return new Date(`${isoDate}T00:00:00`).getTime();
}

function toDayEnd(isoDate: string): number {
  return new Date(`${isoDate}T23:59:59.999`).getTime();
}

export function resolveDateBounds(
  range: DateRangeValue,
  now = new Date(),
): { startMs: number | null; endMs: number | null } {
  if (range.preset === 'all') return { startMs: null, endMs: null };

  if (range.preset === 'custom' && range.start && range.end) {
    return { startMs: toDayStart(range.start), endMs: toDayEnd(range.end) };
  }

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const days = range.preset === '30d' ? 30 : 7;
  start.setDate(start.getDate() - (days - 1));
  return { startMs: start.getTime(), endMs: end.getTime() };
}

export function filterRecordsByDateRange(
  records: SampleRecord[],
  range: DateRangeValue,
  now = new Date(),
): SampleRecord[] {
  const { startMs, endMs } = resolveDateBounds(range, now);
  if (startMs == null || endMs == null) return records;
  return records.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return t >= startMs && t <= endMs;
  });
}

/** Previous window of equal length — for trend captions. Null when not comparable. */
export function previousPeriodBounds(
  range: DateRangeValue,
  now = new Date(),
): { startMs: number; endMs: number } | null {
  if (range.preset === 'all' || range.preset === 'custom') return null;
  const { startMs, endMs } = resolveDateBounds(range, now);
  if (startMs == null || endMs == null) return null;
  const len = endMs - startMs + 1;
  return { startMs: startMs - len, endMs: startMs - 1 };
}

export function countInBounds(
  records: SampleRecord[],
  startMs: number,
  endMs: number,
): number {
  return records.filter((r) => {
    const t = new Date(r.submittedAt).getTime();
    return t >= startMs && t <= endMs;
  }).length;
}

export function loadStoredDateRange(): DateRangeValue {
  if (typeof window === 'undefined') return DEFAULT_DATE_RANGE;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DATE_RANGE;
    const parsed = JSON.parse(raw) as DateRangeValue;
    if (!parsed || typeof parsed.preset !== 'string') return DEFAULT_DATE_RANGE;
    return parsed;
  } catch {
    return DEFAULT_DATE_RANGE;
  }
}

export function storeDateRange(range: DateRangeValue): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(range));
  } catch {
    /* ignore */
  }
}

export function formatRangeLabel(range: DateRangeValue, now = new Date()): string {
  if (range.preset === 'all') return 'All time';
  if (range.preset === '7d') return 'Last 7 days';
  if (range.preset === '30d') return 'Last 30 days';
  if (range.start && range.end) {
    const a = new Date(`${range.start}T12:00:00`);
    const b = new Date(`${range.end}T12:00:00`);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(a)} – ${fmt(b)}`;
  }
  void now;
  return 'Custom range';
}
