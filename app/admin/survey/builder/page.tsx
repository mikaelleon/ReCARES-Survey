'use client';

import { SurveyBuilder } from '@/components/admin/builder/SurveyBuilder';
import { AdminAppShell } from '@/components/admin/AdminAppShell';

export default function AdminSurveyBuilderPage() {
  return (
    <AdminAppShell>
      <SurveyBuilder />
    </AdminAppShell>
  );
}
