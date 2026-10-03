'use client';

type BadgeTone = 'emerald' | 'amber' | 'neutral' | 'danger';

const TONE_CLASS: Record<BadgeTone, string> = {
  emerald: 'status-badge--emerald',
  amber: 'status-badge--amber',
  neutral: 'status-badge--neutral',
  danger: 'status-badge--danger',
};

/**
 * Compact status/role pill — same visual language as resident “Verified Homeowner” chips.
 */
export function StatusBadge({
  children,
  tone = 'emerald',
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
}) {
  return <span className={`status-badge ${TONE_CLASS[tone]}`}>{children}</span>;
}
