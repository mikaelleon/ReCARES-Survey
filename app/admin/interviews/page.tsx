'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Interview invites — permission-gated placeholder until Firestore viewer lands.
 */
export default function AdminInterviewsPage() {
  const { can } = useAuth();
  const canInterview = can('interviewInvites');

  return (
    <AdminAppShell>
      <section className="admin-section" aria-labelledby="admin-interview-title">
        <h1 id="admin-interview-title" className="admin-section__title">
          Interview Invites
        </h1>
        {canInterview ? (
          <p className="admin-section__lead">
            Interview interest documents live in the <code>interviewInterest</code> collection. A
            dedicated viewer can be wired here later; the permission gate is already enforced.
          </p>
        ) : (
          <p className="admin-section__lead">
            You do not have permission to view interview invites. Ask a superadmin if you need
            access.
          </p>
        )}
      </section>
    </AdminAppShell>
  );
}
