'use client';

import { useEffect } from 'react';
import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { MemberManagement } from '@/components/admin/MemberManagement';
import { useAuth } from '@/lib/auth/AuthProvider';
import { goToAdminPath } from '@/lib/firebase/auth';

/**
 * Superadmin-only members and invites. Non-superadmins are redirected.
 */
export default function AdminMembersPage() {
  const { isSuperadmin, ready } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!isSuperadmin) goToAdminPath('/admin/dashboard');
  }, [ready, isSuperadmin]);

  if (!ready || !isSuperadmin) {
    return (
      <AdminAppShell>
        <p className="admin-section__lead">Loading…</p>
      </AdminAppShell>
    );
  }

  return (
    <AdminAppShell>
      <MemberManagement />
    </AdminAppShell>
  );
}
