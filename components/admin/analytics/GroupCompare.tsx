'use client';

import type { GroupMeans } from '@/lib/admin/dataAnalytics';

const MIN_N = 5;

/**
 * Homeowners and tenants side by side: one pair of bars per feature, length is
 * the average likelihood out of 5. Groups with very few answers are marked, so a
 * gap is not read as a finding when it rests on a handful of people.
 */
export function GroupCompare({
  rows,
  homeownerCount,
  tenantCount,
}: {
  rows: GroupMeans[];
  homeownerCount: number;
  tenantCount: number;
}) {
  if (homeownerCount === 0 && tenantCount === 0) {
    return <p className="gf-chart-empty">No homeowner or tenant answers yet.</p>;
  }
  const small = Math.min(homeownerCount, tenantCount) < MIN_N;

  return (
    <div className="an-cmp">
      <ul className="an-scale__legend" aria-hidden="true">
        <li>
          <span className="an-swatch an-cmp__owner" /> Homeowners ({homeownerCount})
        </li>
        <li>
          <span className="an-swatch an-cmp__tenant" /> Tenants ({tenantCount})
        </li>
      </ul>
      <ul className="an-cmp__rows">
        {rows.map((row) => (
          <li key={row.code} className="an-cmp__row">
            <span className="an-cmp__label">{row.label}</span>
            {(
              [
                ['owner', 'Homeowners', row.homeowner],
                ['tenant', 'Tenants', row.tenant],
              ] as const
            ).map(([kind, name, group]) => (
              <span
                key={kind}
                className="an-cmp__bar"
                title={`${name}: ${group.mean ?? 'no answers'} of 5 (${group.n} answered)`}
              >
                <span className="an-cmp__track">
                  <span
                    className={`an-cmp__fill an-cmp__${kind}`}
                    style={{ width: group.mean ? `${(group.mean / 5) * 100}%` : '0%' }}
                  />
                </span>
                <span className="an-cmp__val">{group.mean ? group.mean.toFixed(1) : '—'}</span>
              </span>
            ))}
          </li>
        ))}
      </ul>
      {small ? (
        <p className="an-card__note">
          One group has fewer than {MIN_N} residents, so treat gaps as a hint, not a result.
        </p>
      ) : null}
    </div>
  );
}
