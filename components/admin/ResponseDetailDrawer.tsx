'use client';

import { useEffect } from 'react';
import { GatedSectionChips } from '@/components/admin/GatedSectionChips';
import type { SampleRecord } from '@/lib/admin/sampleResponses';

/**
 * Read-only response detail drawer.
 */
export function ResponseDetailDrawer({
  record,
  onClose,
}: {
  record: SampleRecord | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [record, onClose]);

  if (!record) return null;

  const gates = [
    { label: 'Section 3 extended', shown: record.ext },
    { label: 'Section 4 (personal safety)', shown: record.s4, sensitive: true },
    { label: 'Section 5 (children)', shown: record.s5 },
    { label: 'Section 7a (own accessibility)', shown: record.s7a },
    { label: 'Section 7b (household accessibility)', shown: record.s7b },
  ];

  return (
    <div className="admin-drawer-root" role="presentation">
      <button
        type="button"
        className="admin-drawer__backdrop"
        aria-label="Close detail"
        onClick={onClose}
      />
      <aside
        className="admin-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-drawer-title"
      >
        <header className="admin-drawer__head">
          <div>
            <h2 id="admin-drawer-title" className="admin-drawer__title">
              {record.id}
            </h2>
            <p className="admin-drawer__sub">{record.ts}</p>
          </div>
          <button type="button" className="admin-drawer__close" onClick={onClose}>
            Close
          </button>
        </header>

        <div className="admin-drawer__body">
          <dl className="admin-drawer__dl">
            <div>
              <dt>Phase</dt>
              <dd>{record.phase}</dd>
            </div>
            <div>
              <dt>Resident type</dt>
              <dd>{record.resident}</dd>
            </div>
            <div>
              <dt>PWD (screening)</dt>
              <dd>{record.pwd}</dd>
            </div>
            <div>
              <dt>Language</dt>
              <dd>{record.language}</dd>
            </div>
          </dl>

          <h3 className="admin-drawer__h">Gated sections</h3>
          <ul className="admin-drawer__gates">
            {gates.map((g) => (
              <li
                key={g.label}
                className={g.sensitive && g.shown ? 'admin-drawer__gate--sensitive' : undefined}
              >
                <span>{g.label}</span>
                <span>{g.shown ? 'Shown' : 'not_shown'}</span>
              </li>
            ))}
          </ul>

          <div className="admin-drawer__chips">
            <GatedSectionChips
              ext={record.ext}
              s4={record.s4}
              s5={record.s5}
              s7a={record.s7a}
              s7b={record.s7b}
            />
          </div>

          <h3 className="admin-drawer__h">Screening notes</h3>
          <ul className="admin-drawer__notes">
            {record.screeningNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>

          <h3 className="admin-drawer__h">Section 2 (stub)</h3>
          <ul className="admin-drawer__notes">
            <li>Adequacy: {record.section2.s2_adequacy}</li>
            <li>Frequency: {record.section2.s2_frequency}</li>
            <li>Satisfaction: {record.section2.s2_satisfaction}</li>
            <li>Effectiveness: {record.section2.s2_effectiveness}</li>
            <li>Agreement: {record.section2.s2_agreement}</li>
          </ul>

          <p className="admin-drawer__hint">
            Edit is unavailable until Firestore writes are wired. Unasked gated fields stay{' '}
            <code>not_shown</code>, not blank.
          </p>
        </div>
      </aside>
    </div>
  );
}
