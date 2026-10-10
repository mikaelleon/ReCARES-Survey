/** True when a notification time is a real event time (0 and 1 are placeholders). */
export function hasRealTime(ms: number): boolean {
  return Number.isFinite(ms) && ms > 86_400_000;
}

/** "Just now", "5 min ago", "3 h ago", "Yesterday", "Oct 3" — short, glanceable. */
export function formatRelativeTime(ms: number, now: number = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} h ago`;
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/** Full local date and time for tooltips and screen readers. */
export function formatAbsoluteTime(ms: number): string {
  return new Date(ms).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
