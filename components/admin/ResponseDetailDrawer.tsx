'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { AdminOverlayPortal } from '@/components/admin/AdminOverlayPortal';
import { GatedSectionChips } from '@/components/admin/GatedSectionChips';
import { Button } from '@/components/ui/Button';
import { canWriteFindingNotes } from '@/lib/admin/access';
import { useAuth } from '@/lib/auth/AuthProvider';
import type { SampleRecord } from '@/lib/admin/sampleResponses';
import { formatSubmissionLabel } from '@/lib/admin/submissionLabel';

/**
 * Response detail drawer with optional delete action.
 */
export function ResponseDetailDrawer({
  record,
  onClose,
  onDelete,
  deleteDisabled = false,
}: {
  record: SampleRecord | null;
  onClose: () => void;
  onDelete?: (record: SampleRecord) => void;
  deleteDisabled?: boolean;
}) {
  const { user, can } = useAuth();
  const canAddFindingNote =
    can('findingNotes') &&
    canWriteFindingNotes(
      user
        ? {
            fullName: user.name || '',
            email: user.email,
            requestedRole: user.requestedRole || '',
            role: user.role,
            status: user.status === 'active' ? 'active' : 'pending',
            permissions: user.permissions,
          }
        : null,
    );

  useEffect(() => {
    if (!record) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [record, onClose]);

  useEffect(() => {
    if (!record) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [record]);

  if (!record) return null;

  const gates = [
    { label: 'Homeowner branch', shown: record.homeowner },
    { label: 'Tenant / lessee branch', shown: record.tenant },
    { label: 'Accessibility', shown: record.accessibility },
    { label: 'Permits extended', shown: record.permitsExtended },
    { label: 'Device-dependent digital', shown: record.deviceDependent },
  ];

  return (
    <AdminOverlayPortal>
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
                {formatSubmissionLabel(record.submissionNumber ?? 0, record.phase)}
              </h2>
              <p className="admin-drawer__sub">{record.ts}</p>
            </div>
            <div className="admin-drawer__head-actions">
              {onDelete ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onDark
                  disabled={deleteDisabled}
                  onClick={() => onDelete(record)}
                >
                  Delete
                </Button>
              ) : null}
              <button type="button" className="admin-drawer__close" onClick={onClose}>
                Close
              </button>
            </div>
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
              <div>
                <dt>Instrument</dt>
                <dd>{record.instrumentVersion || 'Not stored'}</dd>
              </div>
            </dl>

            <h3 className="admin-drawer__h">Gated branches</h3>
            <ul className="admin-drawer__gates">
              {gates.map((g) => (
                <li key={g.label}>
                  <span>{g.label}</span>
                  <span>{g.shown ? 'Shown' : 'not_shown'}</span>
                </li>
              ))}
            </ul>

            <div className="admin-drawer__chips">
              <GatedSectionChips
                homeowner={record.homeowner}
                tenant={record.tenant}
                accessibility={record.accessibility}
                permitsExtended={record.permitsExtended}
                deviceDependent={record.deviceDependent}
              />
            </div>

            <h3 className="admin-drawer__h">Screening notes</h3>
            <ul className="admin-drawer__notes">
              {record.screeningNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>

            <h3 className="admin-drawer__h">Communication quality (stub)</h3>
            <ul className="admin-drawer__notes">
              <li>Adequacy: {record.section2.s2_adequacy}</li>
              <li>Frequency: {record.section2.s2_frequency}</li>
              <li>Satisfaction: {record.section2.s2_satisfaction}</li>
              <li>Effectiveness: {record.section2.s2_effectiveness}</li>
              <li>Agreement: {record.section2.s2_agreement}</li>
            </ul>

            <p className="admin-drawer__hint">
              Unasked gated fields stay <code>not_shown</code>, not blank. Delete permanently
              removes the Firestore document when live data is loaded.
            </p>

            {canAddFindingNote ? (
              <p className="admin-drawer__hint">
                <Link href="/admin/notes/?new=1">Add note for this question</Link>
                {' — '}
                opens the Findings Log; pick the matching Responses question on the form.
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </AdminOverlayPortal>
  );
}
