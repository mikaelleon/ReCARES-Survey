'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ListFilter } from 'lucide-react';
import { DateRangePicker } from '@/components/dashboard/DateRangePicker';
import type { DateRangeValue } from '@/lib/admin/dateRange';

export interface DashboardHeaderToolsProps {
  query: string;
  onQueryChange: (value: string) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (next: DateRangeValue) => void;
}

/**
 * Dashboard header controls — filter (date range) + pill search.
 */
export function DashboardHeaderTools({
  query,
  onQueryChange,
  dateRange,
  onDateRangeChange,
}: DashboardHeaderToolsProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const searchId = useId();
  const filterActive = dateRange.preset !== '7d';

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="dash-page__tools" ref={rootRef}>
      <button
        type="button"
        className={`dash-page__filter-btn${open || filterActive ? ' is-active' : ''}`}
        aria-label="Open filters"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <ListFilter size={20} strokeWidth={2.25} aria-hidden="true" />
      </button>

      <div className="dash-page__search">
        <label className="visually-hidden" htmlFor={searchId}>
          Search responses
        </label>
        <input
          id={searchId}
          type="search"
          className="dash-page__search-input"
          placeholder="SEARCH..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {open ? (
        <div id={panelId} className="dash-page__filter-panel" role="dialog" aria-label="Dashboard filters">
          <p className="dash-page__filter-title">Date range</p>
          <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
        </div>
      ) : null}
    </div>
  );
}
