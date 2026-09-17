'use client';

/**
 * Empty states for search/filter miss vs truly empty dataset.
 */
export function ResponseEmptyState({
  kind,
  onReset,
}: {
  kind: 'filtered' | 'empty' | 'error';
  onReset?: () => void;
}) {
  if (kind === 'error') {
    return (
      <div className="admin-empty" role="alert">
        <p className="admin-empty__title">Could not load responses</p>
        <p className="admin-empty__body">
          Stub fetch failed. Retry or switch back to sample data.
        </p>
        {onReset ? (
          <button type="button" className="admin-empty__btn" onClick={onReset}>
            Retry
          </button>
        ) : null}
      </div>
    );
  }

  if (kind === 'empty') {
    return (
      <div className="admin-empty">
        <p className="admin-empty__title">No responses yet</p>
        <p className="admin-empty__body">
          When residents submit the survey, aggregates and rows will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-empty">
      <p className="admin-empty__title">No responses match</p>
      <p className="admin-empty__body">Try a different search or clear filters.</p>
      {onReset ? (
        <button type="button" className="admin-empty__btn" onClick={onReset}>
          Reset filters
        </button>
      ) : null}
    </div>
  );
}
