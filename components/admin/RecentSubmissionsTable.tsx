'use client';

import Link from 'next/link';
import { parseSubmittedAt } from '@/lib/admin/dateRange';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { formatSubmissionLabel } from '@/lib/admin/submissionLabel';

export interface RecentSubmission {
  responseId: string;
  /** Human label: "Submission 001 - Phase 1" */
  displayLabel: string;
  submittedAt: string;
  completionStatus: 'complete' | 'partial';
}

export { formatSubmissionLabel };

function mapRecordsToRecentSubmissions(
  surveyRecords: SampleRecord[],
  maxItems: number,
): RecentSubmission[] {
  return [...surveyRecords]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, maxItems)
    .map((record) => ({
      responseId: record.id,
      displayLabel: formatSubmissionLabel(
        record.submissionNumber ?? 0,
        record.phase || 'Phase unknown',
      ),
      submittedAt: record.submittedAt,
      completionStatus: record.status === 'partial' ? 'partial' : 'complete',
    }));
}

function formatRelativeTime(isoTimestamp: string, nowMs = Date.now()): string {
  const submittedMs = parseSubmittedAt(isoTimestamp);
  if (!Number.isFinite(submittedMs)) return '—';
  const diffSec = Math.round((nowMs - submittedMs) / 1000);
  if (diffSec < 60) return 'Just now';
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  try {
    return new Date(submittedMs).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function completionLabel(status: RecentSubmission['completionStatus']): string {
  return status === 'partial' ? 'Partial' : 'Complete';
}

/**
 * Latest individual responses — table (default) or tall brand panel for Dashboard.
 */
export function RecentSubmissionsTable({
  records: surveyRecords,
  limit: maxItems = 5,
  loading = false,
  variant = 'table',
}: {
  records: SampleRecord[];
  limit?: number;
  loading?: boolean;
  variant?: 'table' | 'panel';
}) {
  const recentSubmissions = mapRecordsToRecentSubmissions(surveyRecords, maxItems);

  if (variant === 'panel') {
    return (
      <aside className="dash-recent-panel" aria-labelledby="dash-recent-title">
        <header className="dash-recent-panel__head">
          <h2 id="dash-recent-title" className="dash-recent-panel__title">
            Recent Submissions
          </h2>
          <Link href="/admin/responses/?tab=individual" className="dash-recent-panel__link">
            View all →
          </Link>
        </header>

        {loading ? (
          <div className="dash-stat--skeleton" style={{ minHeight: 120 }} aria-hidden="true" />
        ) : recentSubmissions.length === 0 ? (
          <p className="dash-recent-panel__empty">No submissions in this range yet.</p>
        ) : (
          <ul className="dash-recent-panel__list">
            {recentSubmissions.map((submission) => (
              <li key={submission.responseId}>
                <Link
                  href={`/admin/responses/?tab=individual&responseId=${encodeURIComponent(submission.responseId)}`}
                  className="dash-recent-panel__item"
                  title={`Open ${submission.displayLabel}`}
                >
                  <span className="dash-recent-panel__dot" aria-hidden="true" />
                  <span className="dash-recent-panel__meta">
                    <span className="dash-recent-panel__label">{submission.displayLabel}</span>
                    <span className="dash-recent-panel__sub">
                      {formatRelativeTime(submission.submittedAt)} ·{' '}
                      {completionLabel(submission.completionStatus)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </aside>
    );
  }

  return (
    <section className="dash-recent" aria-labelledby="dash-recent-title">
      <header className="dash-recent__head">
        <h2 id="dash-recent-title" className="dash-recent__title">
          Recent Submissions
        </h2>
        <Link href="/admin/responses/?tab=individual" className="dash-insight__link">
          View all →
        </Link>
      </header>

      {loading ? (
        <div className="dash-stat--skeleton" style={{ minHeight: 120 }} aria-hidden="true" />
      ) : recentSubmissions.length === 0 ? (
        <p className="dash-tile__empty">No submissions in this date range yet.</p>
      ) : (
        <div className="dash-recent__table-wrap">
          <table className="dash-recent__table">
            <thead>
              <tr>
                <th scope="col">Submission</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {recentSubmissions.map((submission) => (
                <tr key={submission.responseId}>
                  <td title={submission.responseId}>{submission.displayLabel}</td>
                  <td>
                    <time dateTime={submission.submittedAt}>
                      {formatRelativeTime(submission.submittedAt)}
                    </time>
                  </td>
                  <td>
                    <span
                      className={`dash-recent__status dash-recent__status--${submission.completionStatus}`}
                    >
                      {completionLabel(submission.completionStatus)}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/responses/?tab=individual&responseId=${encodeURIComponent(submission.responseId)}`}
                      className="dash-insight__link"
                    >
                      Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** @deprecated Prefer RecentSubmission — kept for any external imports. */
export type RecentSubmissionRow = RecentSubmission;
