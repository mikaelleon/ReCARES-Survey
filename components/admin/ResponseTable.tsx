'use client';

import { GatedSectionChips } from '@/components/admin/GatedSectionChips';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/**
 * Semantic desktop table + stacked mobile cards for responses.
 */
export function ResponseTable({
  records,
  onView,
  onDelete,
  highlightId,
}: {
  records: SampleRecord[];
  onView: (record: SampleRecord) => void;
  onDelete: (record: SampleRecord) => void;
  highlightId?: string | null;
}) {
  return (
    <>
      <div className="admin-table-wrap admin-table-wrap--desktop">
        <table className="admin-table">
          <thead>
            <tr>
              <th scope="col">Response</th>
              <th scope="col">Submitted</th>
              <th scope="col">Phase</th>
              <th scope="col">Resident type</th>
              <th scope="col">PWD</th>
              <th scope="col">Gated sections</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr
                key={r.id}
                className={`admin-table__row${highlightId === r.id ? ' admin-table__row--flash' : ''}`}
                style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onView(r);
                }}
              >
                <th scope="row">{r.id}</th>
                <td>{r.ts}</td>
                <td>{r.phase}</td>
                <td>{r.resident}</td>
                <td>{r.pwd}</td>
                <td>
                  <GatedSectionChips
                    ext={r.ext}
                    s4={r.s4}
                    s5={r.s5}
                    s7a={r.s7a}
                    s7b={r.s7b}
                  />
                </td>
                <td>
                  <div className="admin-row-actions">
                    <button type="button" className="ghost-btn admin-action" onClick={() => onView(r)}>
                      View
                    </button>
                    <button
                      type="button"
                      className="admin-action admin-action--muted"
                      disabled
                      title="Coming when responses API is live"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-action admin-action--danger"
                      onClick={() => onDelete(r)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="admin-card-list admin-card-list--mobile">
        {records.map((r, i) => (
          <li
            key={r.id}
            className={`admin-response-card${highlightId === r.id ? ' admin-response-card--flash' : ''}`}
            style={{ animationDelay: `${Math.min(i, 12) * 40}ms` }}
          >
            <div className="admin-response-card__top">
              <strong>{r.id}</strong>
              <span>{r.ts}</span>
            </div>
            <dl className="admin-response-card__meta">
              <div>
                <dt>Phase</dt>
                <dd>{r.phase}</dd>
              </div>
              <div>
                <dt>Resident</dt>
                <dd>{r.resident}</dd>
              </div>
              <div>
                <dt>PWD</dt>
                <dd>{r.pwd}</dd>
              </div>
            </dl>
            <GatedSectionChips
              ext={r.ext}
              s4={r.s4}
              s5={r.s5}
              s7a={r.s7a}
              s7b={r.s7b}
            />
            <div className="admin-row-actions">
              <button type="button" className="ghost-btn admin-action" onClick={() => onView(r)}>
                View
              </button>
              <button
                type="button"
                className="admin-action admin-action--muted"
                disabled
                title="Coming when responses API is live"
              >
                Edit
              </button>
              <button
                type="button"
                className="admin-action admin-action--danger"
                onClick={() => onDelete(r)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
