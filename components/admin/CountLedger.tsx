'use client';

/**
 * Headline numbers for a list screen (Findings Log, Reviews): the total is the figure,
 * the breakdown is ruled rows. Same markup and styles as the Dashboard ledger, so the
 * `.ledger` rules in globals.css apply inside any `.dash-page`.
 */
const LABEL_WIDTHS = [96, 72, 120, 84];

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
  /** `onSelect` turns a row into a filter toggle; `active` marks the one in force. */
  rows: { label: string; value: number | string; note: string; active?: boolean; onSelect?: () => void }[];
  empty?: boolean;
  loading?: boolean;
  ariaLabel: string;
}) {
  if (loading) {
    // Same elements as the loaded ledger, with a bar where each piece of text goes, so the
    // page does not move when the numbers arrive.
    return (
      <section className="ledger count-ledger" aria-label={ariaLabel} aria-busy="true">
        <span className="visually-hidden">Loading summary</span>
        <div className="ledger__count" aria-hidden="true">
          <p className="ledger__eyebrow">
            <span className="skel ledger-skel" style={{ width: 64, height: 12 }} />
          </p>
          <p className="ledger__figure">
            <span className="skel ledger-skel ledger-skel--figure" />
          </p>
          <p className="ledger__trend">
            <span className="skel ledger-skel" style={{ width: 112, height: 10 }} />
          </p>
        </div>
        <dl className="ledger__rows" aria-hidden="true">
          {Array.from({ length: Math.max(rows.length, 3) }, (_, i) => (
            <div key={i} className="ledger__row">
              <dt>
                <span
                  className="skel ledger-skel"
                  style={{ width: LABEL_WIDTHS[i % LABEL_WIDTHS.length], height: 12, animationDelay: `${i * -120}ms` }}
                />
              </dt>
              <dd>
                <span className="skel ledger-skel" style={{ width: 20, height: 12, animationDelay: `${i * -120}ms` }} />
                <span className="skel ledger-skel" style={{ width: 72, height: 10, animationDelay: `${i * -120}ms` }} />
              </dd>
            </div>
          ))}
        </dl>
      </section>
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
            <dt>
              {r.onSelect ? (
                <button
                  type="button"
                  className="ledger__link ledger__link--button"
                  aria-pressed={Boolean(r.active)}
                  onClick={r.onSelect}
                >
                  {r.label}
                </button>
              ) : (
                r.label
              )}
            </dt>
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
