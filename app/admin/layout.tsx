'use client';

import { Suspense, useState } from 'react';
import { AdminTopBar } from '@/components/admin/AdminTopBar';

/**
 * Admin chrome — sticky header shared by login, signup, and dashboard.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<'EN' | 'FIL'>('EN');

  return (
    <div className="admin-shell">
      <AdminTopBar lang={lang} onLangChange={setLang} />
      {lang === 'FIL' ? (
        <div className="admin-fil-banner" role="status">
          Filipino translations are pending. Dashboard and auth strings stay in English for now.
        </div>
      ) : null}
      <Suspense fallback={<div className="admin-dashboard__inner">Loading…</div>}>
        {children}
      </Suspense>
    </div>
  );
}
