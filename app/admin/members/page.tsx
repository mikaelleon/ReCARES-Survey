'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { MemberManagement } from '@/components/admin/MemberManagement';

/**
 * Members pipeline — all active admins can view.
 * Grant/remove roles, invites, and access-code rotation stay superadmin-only in UI + rules.
 */
export default function AdminMembersPage() {
  return (
    <AdminAppShell fitViewport>
      <MemberManagement />
    </AdminAppShell>
  );
}
