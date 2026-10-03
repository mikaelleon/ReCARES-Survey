'use client';

import { ListFilter } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import type { DateRangeValue } from '@/lib/admin/dateRange';

export interface DashboardHeaderToolsProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
}

/**
 * Dashboard header filter — always-open date range (replaces collapsed filter + search).
 */
export function DashboardHeaderTools({
  dateRange,
  onDateRangeChange,
}: DashboardHeaderToolsProps) {
  return (
    <div className="dash-page__tools" aria-label="Dashboard filters">
      <span className="dash-page__filter-btn is-active" aria-hidden="true">
        <ListFilter size={18} strokeWidth={2.25} />
      </span>
      <div className="dash-page__filter-open">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </div>
  );
}
