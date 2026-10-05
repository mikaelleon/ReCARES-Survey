import type { InterviewInviteRow } from '@/lib/firebase/interviewManage';

export const INTERVIEW_WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const INTERVIEW_FORM_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const INTERVIEW_TIMES = ['Morning', 'Afternoon', 'Evening', 'Other'] as const;

export interface InterviewKpis {
  total: number;
  notContacted: number;
  pending: number;
  confirmed: number;
  withdrawn: number;
  online: number;
  faceToFace: number;
  topDay: { label: string; count: number } | null;
  topTime: { label: string; count: number } | null;
  dayCounts: { label: string; count: number }[];
  timeCounts: { label: string; count: number }[];
}

export interface AvailabilityDay {
  date: Date;
  isoDate: string;
  weekday: string;
  count: number;
  /** Open invites (not confirmed or withdrawn) who prefer this weekday. */
  matches: InterviewInviteRow[];
  isPeak: boolean;
  inMonth: boolean;
}

function countByLabel(
  labels: readonly string[],
  rows: InterviewInviteRow[],
  pick: (row: InterviewInviteRow) => string | string[],
): { label: string; count: number }[] {
  return labels.map((label) => {
    const count = rows.filter((row) => {
      const value = pick(row);
      return Array.isArray(value) ? value.includes(label) : value === label;
    }).length;
    return { label, count };
  });
}

function topOf(items: { label: string; count: number }[]): { label: string; count: number } | null {
  if (items.length === 0) return null;
  const best = items.reduce((a, b) => (b.count > a.count ? b : a), items[0]!);
  return best.count > 0 ? best : null;
}

/** KPIs derived only from InterviewInvitation form fields + contact pipeline. */
export function computeInterviewKpis(rows: InterviewInviteRow[]): InterviewKpis {
  const dayCounts = countByLabel(INTERVIEW_FORM_DAYS, rows, (r) => r.preferredDays);
  const timeCounts = countByLabel(INTERVIEW_TIMES, rows, (r) => r.preferredTime);

  return {
    total: rows.length,
    notContacted: rows.filter((r) => r.contactStatus === 'not_contacted').length,
    pending: rows.filter((r) => r.contactStatus === 'pending_confirmation').length,
    confirmed: rows.filter((r) => r.contactStatus === 'confirmed').length,
    withdrawn: rows.filter((r) => r.contactStatus === 'withdrawn').length,
    online: rows.filter((r) => r.interviewFormat === 'Online').length,
    faceToFace: rows.filter((r) => r.interviewFormat === 'Face-to-face').length,
    topDay: topOf(dayCounts),
    topTime: topOf(timeCounts),
    dayCounts,
    timeCounts,
  };
}

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Month grid availability from preferredDays on open (not confirmed) invites.
 * Each calendar date inherits the weekday preference count for that weekday name.
 */
export function buildAvailabilityMonth(
  rows: InterviewInviteRow[],
  year: number,
  monthIndex: number,
): { days: AvailabilityDay[]; maxCount: number; peakWeekday: string | null } {
  const open = rows.filter(
    (r) => r.contactStatus !== 'confirmed' && r.contactStatus !== 'withdrawn',
  );
  const first = new Date(year, monthIndex, 1);
  const startPad = first.getDay(); // 0 = Sunday
  const gridStart = new Date(year, monthIndex, 1 - startPad);
  const days: AvailabilityDay[] = [];
  let maxCount = 0;

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + i);
    const weekday = INTERVIEW_WEEKDAYS[date.getDay()]!;
    const matches = open.filter((r) => r.preferredDays.includes(weekday));
    const count = matches.length;
    if (date.getMonth() === monthIndex && count > maxCount) maxCount = count;
    days.push({
      date,
      isoDate: toIsoDate(date),
      weekday,
      count,
      matches,
      isPeak: false,
      inMonth: date.getMonth() === monthIndex,
    });
  }

  for (const day of days) {
    day.isPeak = day.inMonth && maxCount > 0 && day.count === maxCount;
  }

  const peakWeekday =
    maxCount > 0
      ? days.find((d) => d.inMonth && d.isPeak)?.weekday ?? null
      : null;

  return { days, maxCount, peakWeekday };
}

export function buildInterviewContactsCsv(rows: InterviewInviteRow[]): string {
  const header = [
    'email',
    'interviewFormat',
    'preferredDays',
    'preferredTime',
    'preferredTimeOther',
    'submittedAt',
    'contactStatus',
    'confirmedDateTime',
    'notes',
  ];
  const body = rows.map((row) => {
    const notes = (row.notes ?? [])
      .map((n) => `${n.at} ${n.byName}: ${n.text}`)
      .join(' | ');
    return [
      row.email,
      row.interviewFormat,
      row.preferredDays.join('; '),
      row.preferredTime,
      row.preferredTimeOther ?? '',
      row.submittedAt,
      row.contactStatus,
      row.confirmedDateTime ?? '',
      notes,
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',');
  });
  return [header.join(','), ...body].join('\n');
}

