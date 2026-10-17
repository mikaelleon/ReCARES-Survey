'use client';

import { useState } from 'react';
import type { InquiryRow } from '@/lib/firebase/inquiryManage';
import { InquiryActions } from './InquiryActions';
import { InquiryStatusPill } from './InquiryStatusPill';
import { formatWhen, senderLabel, type InquiryHandlers } from './inquiryMeta';

type CardVariant = 'comfortable' | 'compact';

/** Rough "is this long enough to need Show more" test, so no measuring or layout shift. */
const LONG_AT: Record<CardVariant, number> = { comfortable: 240, compact: 90 };

function InquiryCard({
  row,
  variant,
  ...handlers
}: { row: InquiryRow; variant: CardVariant } & InquiryHandlers) {
  const [expanded, setExpanded] = useState(false);
  const who = senderLabel(row);
  const long = row.message.length > LONG_AT[variant] || row.message.split('\n').length > 3;

  return (
    <li className={`inq-card inq-card--${variant}`}>
      <div className="inq-card__head">
        <div className="inq-card__who">
          <p className="inq-card__name" title={row.name && row.email ? `${who} · ${row.email}` : who}>
            {who}
          </p>
          {row.name && row.email ? (
            <a className="inq-email" href={`mailto:${row.email}`} title={row.email}>
              {row.email}
            </a>
          ) : null}
        </div>
        <InquiryStatusPill status={row.status} />
      </div>
      <p
        className={`inq-card__msg${expanded ? ' is-open' : ''}`}
        title={expanded ? undefined : row.message}
      >
        {row.message}
      </p>
      {long ? (
        <button
          type="button"
          className="inq-link-btn"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      ) : null}
      <div className="inq-card__foot">
        <time className="inq-meta" dateTime={row.createdAt || undefined}>
          {formatWhen(row.createdAt)}
        </time>
        <InquiryActions row={row} {...handlers} />
      </div>
    </li>
  );
}

export function InquiryCards({
  rows,
  variant,
  ...handlers
}: { rows: InquiryRow[]; variant: CardVariant } & InquiryHandlers) {
  return (
    <ul className={`inq-cards inq-cards--${variant}`} aria-label="Inquiries">
      {rows.map((row) => (
        <InquiryCard key={row.id} row={row} variant={variant} {...handlers} />
      ))}
    </ul>
  );
}
