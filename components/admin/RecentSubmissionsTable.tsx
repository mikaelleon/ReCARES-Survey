'use client';

import Link from 'next/link';
import { parseSubmittedAt } from '@/lib/admin/dateRange';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

export interface RecentSubmissionRow {
  responseId: string;
  phase: string;
  submittedAt: string;
  status: 'complete' | 'partial';
}

function toRows(records: SampleRecord[], limit: number): RecentSubmissionRow[] {
  return [...records]
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
    .slice(0, limit)
    .map((r) => ({
      responseId: r.id,
      phase: r.phase || '—',
      submittedAt: r.submittedAt,
      status: r.status === 'partial' ? 'partial' : 'complete',
    }));
}

function formatRelative(iso: string, now = Date.now()): string {
  const t = parseSubmittedAt(iso);
  if (!Number.isFinite(t)) return '—';
  const diffSec = Math.round((now - t) / 1000);
  if (diffSec < 60) return 'Just now';
  const mins = Math.round(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days}d ago`;
  try {
    return new Date(t).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

function shortId(id: string): string {
  if (id.length <= 14) return id;
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

/**
 * Latest individual responses — table (default) or tall brand panel for Dashboard hero.
 */
export function RecentSubmissionsTable({
  records,
  limit = 5,
  loading = false,
  variant = 'table',
}: {
  records: SampleRecord[];
  limit?: number;
  loading?: boolean;
  variant?: 'table' | 'panel';
}) {
  const rows = toRows(records, limit);

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
        ) : rows.length === 0 ? (
          <p className="dash-recent-panel__empty">No submissions in this range yet.</p>
        ) : (
          <ul className="dash-recent-panel__list">
            {rows.map((row) => (
              <li key={row.responseId}>
                <Link
                  href={`/admin/responses/?tab=individual&responseId=${encodeURIComponent(row.responseId)}`}
                  className="dash-recent-panel__item"
                >
                  <span className="dash-recent-panel__dot" aria-hidden="true" />
                  <span className="dash-recent-panel__meta">
                    <span className="dash-recent-panel__id" title={row.responseId}>
                      {shortId(row.responseId)}
                    </span>
                    <span className="dash-recent-panel__sub">
                      {row.phase} · {formatRelative(row.submittedAt)}
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
      ) : rows.length === 0 ? (
        <p className="dash-tile__empty">No submissions in this date range yet.</p>
      ) : (
        <div className="dash-recent__table-wrap">
          <table className="dash-recent__table">
            <thead>
              <tr>
                <th scope="col">Response ID</th>
                <th scope="col">Phase</th>
                <th scope="col">Submitted</th>
                <th scope="col">Status</th>
                <th scope="col">
                  <span className="visually-hidden">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.responseId}>
                  <td>
                    <code className="dash-recent__id">{row.responseId}</code>
                  </td>
                  <td>{row.phase}</td>
                  <td>
                    <time dateTime={row.submittedAt}>{formatRelative(row.submittedAt)}</time>
                  </td>
                  <td>
                    <span
                      className={`dash-recent__status dash-recent__status--${row.status}`}
                    >
                      {row.status === 'partial' ? 'Partial' : 'Complete'}
                    </span>
                  </td>
                  <td>
                    <Link
                      href={`/admin/responses/?tab=individual&responseId=${encodeURIComponent(row.responseId)}`}
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
