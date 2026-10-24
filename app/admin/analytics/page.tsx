'use client';

import { AdminAppShell } from '@/components/admin/AdminAppShell';
import { AnalyticsView } from '@/components/admin/analytics/AnalyticsView';
import { useSurveyResponses } from '@/lib/admin/useSurveyResponses';
import { useAuth } from '@/lib/auth/AuthProvider';

function AnalyticsContent() {
  const { can } = useAuth();
  const { records, status, source, usingDemoSample } = useSurveyResponses();
  return (
    <AnalyticsView
      records={records}
      status={status}
      source={source}
      usingDemoSample={usingDemoSample}
      allowed={can('responsesDashboard')}
    />
  );
}

/** Data Analytics: compare, rank, and track survey answers with the same filters as the Dashboard. */
export default function AdminAnalyticsPage() {
  return (
    <AdminAppShell>
      <AnalyticsContent />
    </AdminAppShell>
  );
}
