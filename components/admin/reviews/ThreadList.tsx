'use client';

import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type FeedbackComment,
} from '@/lib/firebase/adviserFeedback';
import styles from '@/components/admin/reviews/styles';

function formatWhen(ms: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

/**
 * Index of root review comments: ruled rows, the comment first, then one line of plain facts.
 * Severity is bold only when it blocks (a required fix); status is a word, not a pill.
 */
export function ThreadList({
  roots,
  selectedId,
  targetLabel,
  replyCounts,
  showTarget = true,
  onSelect,
}: {
  roots: FeedbackComment[];
  selectedId: string | null;
  targetLabel: (row: FeedbackComment) => string;
  replyCounts: Map<string, number>;
  showTarget?: boolean;
  onSelect: (id: string) => void;
}) {
  if (roots.length === 0) {
    return <p className={styles.empty}>No review threads match these filters.</p>;
  }

  return (
    <ul className={styles.threadList}>
      {roots.map((row) => {
        const replies = replyCounts.get(row.id) ?? row.replyCount;
        const selected = row.id === selectedId;
        const parts: React.ReactNode[] = [];
        if (row.severity) {
          const label = SEVERITY_LABELS[row.severity];
          parts.push(row.severity === 'required_fix' ? <strong key="sev">{label}</strong> : label);
        }
        if (row.status) parts.push(STATUS_LABELS[row.status]);
        parts.push(row.authorName);
        parts.push(formatWhen(row.updatedAtMs));
        parts.push(`${replies} ${replies === 1 ? 'reply' : 'replies'}`);
        if (showTarget) parts.push(targetLabel(row));
        return (
          <li key={row.id}>
            <button
              type="button"
              className={styles.threadBtn}
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(row.id)}
            >
              <p className={styles.snippet}>{row.comment}</p>
              <p className={styles.meta}>
                {parts.map((part, i) => (
                  <span key={i}>
                    {i > 0 ? ' · ' : null}
                    {part}
                  </span>
                ))}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
