/**
 * Branded full-region loading state. Prefer this over a blank screen or “Loading…”.
 * Inline layout styles keep it centered even if stylesheet load is delayed.
 */
export function PageLoader({
  label = 'Loading',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`page-loader${compact ? ' page-loader--compact' : ''}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      style={{
        minHeight: compact ? '40vh' : '100dvh',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(32px, 8vw, 72px) 16px',
        boxSizing: 'border-box',
        background: 'var(--page-bg, #e5ebe8)',
      }}
    >
      <div
        className="page-loader__inner"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          textAlign: 'center',
        }}
      >
        <div className="page-loader__mark" aria-hidden="true">
          <span className="page-loader__word">
            <span>Re</span>
            <span className="page-loader__c">C</span>
            <span className="page-loader__ar">AR</span>
            <span className="page-loader__e">E</span>
            <span>S</span>
          </span>
          <span className="page-loader__spinner" />
        </div>
        <p className="page-loader__label">{label}</p>
      </div>
    </div>
  );
}
