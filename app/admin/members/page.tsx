'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Members pipeline — proponents and superadmins may view.
 * Advisers are blocked. Grant/remove roles, invites, and access-code rotation stay superadmin-only.
 */
export default function AdminMembersPage() {
  const { canTeamOps } = useAuth();

  return (
    <AdminAppShell fitViewport>
      {canTeamOps ? (
        <MemberManagement />
      ) : (
        <section className="dash-page" aria-labelledby="admin-members-title">
          <div className="dash-page__header">
            <h1 id="admin-members-title" className="dash-page__title">
              Members
            </h1>
          </div>
          <p className="na-error" role="alert">
            Advisers cannot view Members &amp; Invites. Ask a proponent or superadmin if you need
            help with access requests.
          </p>
        </section>
      )}
    </AdminAppShell>
  );
}
