/** Exact interview date and time helpers. Dates are YYYY-MM-DD, clocks are 24-hour HH:mm. */

export const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** Interviews run 8:00 AM to 10:00 PM, the same hours as the face-to-face venue. */
export const EARLIEST_MINUTES = 8 * 60;
export const LATEST_MINUTES = 22 * 60;

export const HOURS_12 = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'] as const;
export const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'));

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function isoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function tomorrowIso(now = new Date()): string {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return isoDate(next);
}

function parseIso(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function isValidFutureDate(value: string, now = new Date()): boolean {
  return Boolean(parseIso(value)) && value >= tomorrowIso(now);
}

export function weekdayOf(value: string): string | null {
  const date = parseIso(value);
  return date ? WEEKDAYS[date.getDay()]! : null;
}

export function formatDate(value: string): string {
  const date = parseIso(value);
  if (!date) return value;
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/** 12-hour pieces to a 24-hour "HH:mm" string, or null while incomplete. */
export function to24Hour(hour: string, minute: string, meridiem: 'AM' | 'PM' | ''): string | null {
  if (!hour || !minute || !meridiem) return null;
  const h = Number(hour);
  const m = Number(minute);
  if (!Number.isInteger(h) || h < 1 || h > 12 || !Number.isInteger(m) || m < 0 || m > 59) return null;
  const base = h % 12;
  return `${pad(meridiem === 'PM' ? base + 12 : base)}:${pad(m)}`;
}

export function minutesOf(clock: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(clock);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}

export function isWithinInterviewHours(clock: string): boolean {
  const minutes = minutesOf(clock);
  return minutes != null && minutes >= EARLIEST_MINUTES && minutes <= LATEST_MINUTES;
}

/** "18:30" to "6:30 PM". */
export function formatClock(clock: string): string {
  const minutes = minutesOf(clock);
  if (minutes == null) return clock;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** Part of day, kept so earlier reports that group by Morning/Afternoon/Evening still work. */
export function partOfDay(clock: string): 'Morning' | 'Afternoon' | 'Evening' {
  const minutes = minutesOf(clock) ?? 0;
  if (minutes < 12 * 60) return 'Morning';
  if (minutes < 17 * 60) return 'Afternoon';
  return 'Evening';
}
