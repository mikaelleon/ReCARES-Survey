'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import type { InquiryRow } from '@/lib/firebase/inquiryManage';
import { InquiryActions } from './InquiryActions';
import { InquiryStatusPill } from './InquiryStatusPill';
import {
  SORT_FROM,
  SORT_NEWEST,
  SORT_OLDEST,
  formatWhen,
  senderLabel,
  type InquiryHandlers,
} from './inquiryMeta';

function Sender({ row }: { row: InquiryRow }) {
  return (
    <div className="inq-sender">
      <span className="inq-sender__name" title={senderLabel(row)}>
        {senderLabel(row)}
      </span>
      {row.name && row.email ? (
        <a className="inq-email" href={`mailto:${row.email}`} title={row.email}>
          {row.email}
        </a>
      ) : null}
    </div>
  );
}

/** One single-line row per inquiry; wraps to two lines on narrow screens. */
export function InquiryList({ rows, ...handlers }: { rows: InquiryRow[] } & InquiryHandlers) {
  return (
    <ul className="inq-list" aria-label="Inquiries">
      {rows.map((row) => (
        <li key={row.id} className="inq-list__row">
          <div className="inq-list__status">
            <InquiryStatusPill status={row.status} />
          </div>
          <Sender row={row} />
          <p className="inq-list__msg" title={row.message}>
            {row.message}
          </p>
          <time className="inq-meta inq-list__when" dateTime={row.createdAt || undefined}>
            {formatWhen(row.createdAt)}
          </time>
          <InquiryActions row={row} {...handlers} />
        </li>
      ))}
    </ul>
  );
}

function SortHeader({
  label,
  direction,
  onClick,
}: {
  label: string;
  direction: 'ascending' | 'descending' | null;
  onClick: () => void;
}) {
  return (
    <th scope="col" aria-sort={direction ?? 'none'}>
      <button type="button" className="inq-sort" onClick={onClick}>
        {label}
        {direction === 'ascending' ? <ArrowUp size={14} aria-hidden="true" /> : null}
        {direction === 'descending' ? <ArrowDown size={14} aria-hidden="true" /> : null}
      </button>
    </th>
  );
}

/** Sortable table (the original layout). Sorting writes to the shared sort state. */
export function InquiryTable({
  rows,
  total,
  sortBy,
  onSort,
  ...handlers
}: {
  rows: InquiryRow[];
  total: number;
  sortBy: string;
  onSort: (next: string) => void;
} & InquiryHandlers) {
  const whenDir = sortBy === SORT_OLDEST ? 'ascending' : sortBy === SORT_NEWEST ? 'descending' : null;
  const fromDir = sortBy === SORT_FROM ? 'ascending' : null;

  return (
    <div className="inq-table-wrap">
      <table className="inq-table">
        <caption className="visually-hidden">
          Inquiries, {rows.length} of {total} shown
        </caption>
        <thead>
          <tr>
            <SortHeader
              label="When"
              direction={whenDir}
              onClick={() => onSort(sortBy === SORT_NEWEST ? SORT_OLDEST : SORT_NEWEST)}
            />
            <SortHeader label="From" direction={fromDir} onClick={() => onSort(SORT_FROM)} />
            <th scope="col">Message</th>
            <th scope="col">Status</th>
            <th scope="col" className="inq-table__actions-col">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="inq-table__when">
                <time className="inq-meta" dateTime={row.createdAt || undefined}>
                  {formatWhen(row.createdAt)}
                </time>
              </td>
              <td className="inq-table__from">
                <Sender row={row} />
              </td>
              <td className="inq-table__msg">
                <p title={row.message}>{row.message}</p>
              </td>
              <td>
                <InquiryStatusPill status={row.status} />
              </td>
              <td className="inq-table__actions-col">
                <InquiryActions row={row} {...handlers} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
