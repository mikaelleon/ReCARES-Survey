'use client';

/**
 * Headline numbers for a list screen (Findings Log, Reviews): the total is the figure,
 * the breakdown is ruled rows. Same markup and styles as the Dashboard ledger, so the
 * `.ledger` rules in globals.css apply inside any `.dash-page`.
 */
export function CountLedger({
  label,
  total,
  totalNote,
  rows,
  empty = false,
  loading = false,
  ariaLabel,
}: {
  label: string;
  total: number;
  totalNote: string;
  rows: { label: string; value: number; note: string }[];
  empty?: boolean;
  loading?: boolean;
  ariaLabel: string;
}) {
  if (loading) {
    return (
      <div className="ledger count-ledger skel-region" aria-busy="true">
        <span className="visually-hidden">Loading summary</span>
        <div className="ledger__count skel-stat" style={{ minHeight: 120 }} />
        <div className="ledger__rows skel-stat" style={{ minHeight: 120 }} />
      </div>
    );
  }
  return (
    <section className="ledger count-ledger" aria-label={ariaLabel}>
      <div className="ledger__count">
        <p className="ledger__eyebrow">{label}</p>
        <p className="ledger__figure">{empty ? <span className="ledger__none">—</span> : total}</p>
        <p className="ledger__trend">{totalNote}</p>
      </div>
      <dl className="ledger__rows">
        {rows.map((r) => (
          <div key={r.label} className="ledger__row">
            <dt>{r.label}</dt>
            <dd>
              <span className="ledger__value">{empty ? '—' : r.value}</span>
              <span className="ledger__note">{r.note}</span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
