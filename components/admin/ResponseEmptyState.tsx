'use client';

import Link from 'next/link';
import { Inbox, RefreshCw, SearchX, TriangleAlert, CalendarX } from 'lucide-react';

type EmptyKind = 'filtered' | 'empty' | 'error' | 'range';

/**
 * Empty states: truly empty, date range with nothing in it, filter miss, and load error.
 * Every state says what happened and offers the next action.
 */
export function ResponseEmptyState({
  kind,
  onReset,
  detail,
}: {
  kind: EmptyKind;
  /** Retry (error), clear filters (filtered) or widen the range (range). */
  onReset?: () => void;
  /** Optional specific reason, shown for the error state. */
  detail?: string;
}) {
  if (kind === 'error') {
    return (
      <div className="admin-empty" role="alert">
        <TriangleAlert className="admin-empty__icon" size={28} strokeWidth={2} aria-hidden="true" />
        <p className="admin-empty__title">Could not load responses</p>
        <p className="admin-empty__body">
          {detail ?? 'Something went wrong while loading. Check your connection, then try again.'}
        </p>
        {onReset ? (
          <button type="button" className="admin-empty__btn" onClick={onReset}>
            <RefreshCw size={16} strokeWidth={2.2} aria-hidden="true" />
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (kind === 'empty') {
    return (
      <div className="admin-empty">
        <Inbox className="admin-empty__icon" size={28} strokeWidth={2} aria-hidden="true" />
        <p className="admin-empty__title">No responses yet</p>
        <p className="admin-empty__body">
          When residents submit the survey, aggregates and responses will appear here.
        </p>
        <Link className="admin-empty__btn" href="/admin/">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (kind === 'range') {
    return (
      <div className="admin-empty">
        <CalendarX className="admin-empty__icon" size={28} strokeWidth={2} aria-hidden="true" />
        <p className="admin-empty__title">No responses in this date range</p>
        <p className="admin-empty__body">Responses exist, but none were submitted in the selected range.</p>
        {onReset ? (
          <button type="button" className="admin-empty__btn" onClick={onReset}>
            Show all time
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="admin-empty">
      <SearchX className="admin-empty__icon" size={28} strokeWidth={2} aria-hidden="true" />
      <p className="admin-empty__title">No responses match</p>
      <p className="admin-empty__body">Try a different search or clear the filters.</p>
      {onReset ? (
        <button type="button" className="admin-empty__btn" onClick={onReset}>
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
