'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { SurveyControlPanel } from '@/components/admin/SurveyControlPanel';

export default function AdminSurveyControlPage() {
  return (
    <AdminAppShell>
      <SurveyControlPanel />
    </AdminAppShell>
  );
}
