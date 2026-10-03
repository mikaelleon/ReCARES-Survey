'use client';

import { useState } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';
import { FirestoreBlockedNotice } from '@/components/admin/FirestoreBlockedNotice';
import { useAuth } from '@/lib/auth/AuthProvider';

/**
 * Admin chrome — sticky header shared by login, signup, and dashboard.
 * No Suspense wrapper: static export + useSearchParams Suspense caused React #318.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'EN' | 'FIL'>('EN');
  const { firestoreError } = useAuth();

  return (
    <div className="admin-shell">
      <AdminTopBar lang={lang} onLangChange={setLang} />
      {lang === 'FIL' ? (
        <div className="admin-fil-banner" role="status">
          Filipino translations are pending. Dashboard and auth strings stay in English for now.
        </div>
      ) : null}
      {firestoreError ? (
        <div style={{ maxWidth: 720, margin: '12px auto 0', padding: '0 16px' }}>
          <FirestoreBlockedNotice message={firestoreError} />
        </div>
      ) : null}
      {children}
    </div>
  );
}
