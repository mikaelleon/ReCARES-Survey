'use client';

import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  SEVERITY_LABELS,
  STATUS_LABELS,
  type FeedbackComment,
  type FeedbackSeverity,
  type FeedbackStatus,
} from '@/lib/firebase/adviserFeedback';
import styles from '@/components/admin/reviews/reviews.module.css';

function severityTone(severity: FeedbackSeverity): 'amber' | 'danger' | 'emerald' {
  if (severity === 'required_fix') return 'danger';
  if (severity === 'approved') return 'emerald';
  return 'amber';
}

function statusTone(status: FeedbackStatus): 'amber' | 'neutral' | 'emerald' {
  if (status === 'resolved') return 'emerald';
  if (status === 'addressed') return 'neutral';
  return 'amber';
}

function formatWhen(ms: number): string {
  if (!ms) return '—';
  try {
    return new Date(ms).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/**
 * Inbox rows for root review comments.
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
        return (
          <li key={row.id}>
            <button
              type="button"
              className={styles.threadBtn}
              aria-current={selected ? 'true' : undefined}
              onClick={() => onSelect(row.id)}
            >
              <span className={styles.badges}>
                {row.severity ? (
                  <StatusBadge tone={severityTone(row.severity)}>
                    {SEVERITY_LABELS[row.severity]}
                  </StatusBadge>
                ) : null}
                {row.status ? (
                  <StatusBadge tone={statusTone(row.status)}>{STATUS_LABELS[row.status]}</StatusBadge>
                ) : null}
              </span>
              <p className={styles.snippet}>{row.comment}</p>
              <p className={styles.meta}>
                {row.authorName}
                {' · '}
                {formatWhen(row.updatedAtMs)}
                {' · '}
                {replies} {replies === 1 ? 'reply' : 'replies'}
                {showTarget ? ` · ${targetLabel(row)}` : ''}
              </p>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
