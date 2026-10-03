'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { InterviewBoard } from '@/components/admin/InterviewBoard';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Interview Invites — Kanban for interviewInterest (separate from Members board).
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
          <InterviewBoard />
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
