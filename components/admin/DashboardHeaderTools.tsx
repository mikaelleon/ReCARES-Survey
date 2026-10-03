'use client';

import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import type { DateRangeValue } from '@/lib/admin/dateRange';

export interface DashboardHeaderToolsProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
}

/**
 * Dashboard header filter — always-open date range presets.
 */
export function DashboardHeaderTools({
  dateRange,
  onDateRangeChange,
}: DashboardHeaderToolsProps) {
  return (
    <div className="dash-page__tools" aria-label="Dashboard filters">
      <div className="dash-page__filter-open">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </div>
  );
}
