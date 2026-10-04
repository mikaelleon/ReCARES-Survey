'use client';

import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import type { DateRangeValue } from '@/lib/admin/dateRange';
import type { DashboardViewMode } from '@/lib/admin/dashboardView';

export interface DashboardHeaderToolsProps {
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
  viewMode?: DashboardViewMode;
  onViewModeChange?: (mode: DashboardViewMode) => void;
}

/**
 * Dashboard header — view toggle + always-open date range presets.
 */
export function DashboardHeaderTools({
  dateRange,
  onDateRangeChange,
  viewMode = 'detailed',
  onViewModeChange,
}: DashboardHeaderToolsProps) {
  return (
    <div className="dash-page__tools" aria-label="Dashboard filters">
      {onViewModeChange ? (
        <div className="dash-view-toggle" role="tablist" aria-label="Dashboard view">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'detailed'}
            className={`dash-view-toggle__btn${viewMode === 'detailed' ? ' is-active' : ''}`}
            onClick={() => onViewModeChange('detailed')}
          >
            Detailed
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'simple'}
            className={`dash-view-toggle__btn${viewMode === 'simple' ? ' is-active' : ''}`}
            onClick={() => onViewModeChange('simple')}
          >
            Simple
          </button>
        </div>
      ) : null}
      <div className="dash-page__filter-open">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </div>
  );
}
