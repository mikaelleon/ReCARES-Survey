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
        <div
          className="dash-view-toggle"
          role="tablist"
          aria-label="Dashboard view"
          data-mode={viewMode}
          onKeyDown={(event) => {
            // Arrow keys move between the two views, as tabs do everywhere else.
            const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const next: DashboardViewMode =
              event.key === 'Home' || event.key === 'ArrowLeft' ? 'detailed' : 'simple';
            onViewModeChange(next);
            document.getElementById(`dash-view-tab-${next}`)?.focus();
          }}
        >
          {(['detailed', 'simple'] as const).map((mode) => (
            <button
              key={mode}
              id={`dash-view-tab-${mode}`}
              type="button"
              role="tab"
              aria-selected={viewMode === mode}
              aria-controls="dash-view-panel"
              tabIndex={viewMode === mode ? 0 : -1}
              className={`dash-view-toggle__btn${viewMode === mode ? ' is-active' : ''}`}
              onClick={() => onViewModeChange(mode)}
            >
              {mode === 'detailed' ? 'Detailed' : 'Simple'}
            </button>
          ))}
        </div>
      ) : null}
      <div className="dash-page__filter-open">
        <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
      </div>
    </div>
  );
}
