'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PHASE_OPTIONS } from '@/lib/admin/sampleResponses';

export type BranchFilter = 'all' | 'tenant' | 'homeowner';
export type SortKey = 'submitted' | 'phase';
export type SortDir = 'asc' | 'desc';

export interface ResponsesToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  phase: string;
  onPhaseChange: (value: string) => void;
  branch: BranchFilter;
  onBranchChange: (value: BranchFilter) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKeyChange: (value: SortKey) => void;
  onToggleSortDir: () => void;
  showing: number;
  total: number;
  onResetFilters: () => void;
  /** Rendered at the right of the bar (the date range). */
  trailing?: ReactNode;
}

/**
 * Collapsed by default: one slim bar with the result count. Expanding reveals search,
 * filters and sort. Active filters are summarised on the bar so nothing is hidden silently.
 */
export function ResponsesToolbar({
  query,
  onQueryChange,
  phase,
  onPhaseChange,
  branch,
  onBranchChange,
  sortKey,
  sortDir,
  onSortKeyChange,
  onToggleSortDir,
  showing,
  total,
  onResetFilters,
  trailing,
}: ResponsesToolbarProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const SortIcon = sortDir === 'asc' ? ArrowUp : ArrowDown;

  const active: string[] = [];
  if (query.trim()) active.push(`“${query.trim()}”`);
  if (phase) active.push(phase);
  if (branch !== 'all') active.push(branch === 'tenant' ? 'Tenant / lessee' : 'Homeowner');

  return (
    <div className="responses-toolbar">
      <div className="rt-bar">
        <button
          type="button"
          className="rt-toggle"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <Search size={16} strokeWidth={2.2} aria-hidden="true" />
          Search &amp; filters
          {active.length > 0 ? (
            <span className="rt-badge" aria-label={`${active.length} active`}>
              {active.length}
            </span>
          ) : null}
          <ChevronDown
            size={16}
            strokeWidth={2.4}
            className={`rt-chev${open ? ' is-open' : ''}`}
            aria-hidden="true"
          />
        </button>

        {!open && active.length > 0 ? (
          <p className="rt-active" title={active.join(' · ')}>
            {active.join(' · ')}
          </p>
        ) : null}

        {active.length > 0 ? (
          <button type="button" className="rt-clear" onClick={onResetFilters}>
            Clear
          </button>
        ) : null}

        <p className="rt-count" aria-live="polite">
          Showing {showing} of {total}
        </p>

        {trailing ? <div className="rt-trailing">{trailing}</div> : null}
      </div>

      {open ? (
        <div id={panelId} className="rt-panel">
          <div className="rt-search">
            <Input
              label="Search responses"
              placeholder="Response ID, phase, resident type"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <div className="rt-select">
            <Select
              label="Phase"
              options={['All phases', ...PHASE_OPTIONS]}
              value={phase || 'All phases'}
              onChange={(e) =>
                onPhaseChange(e.target.value === 'All phases' ? '' : e.target.value)
              }
            />
          </div>
          <div className="rt-select">
            <Select
              label="Branch"
              options={['Any', 'Tenant / lessee', 'Homeowner']}
              value={
                branch === 'tenant'
                  ? 'Tenant / lessee'
                  : branch === 'homeowner'
                    ? 'Homeowner'
                    : 'Any'
              }
              onChange={(e) => {
                const v = e.target.value;
                onBranchChange(
                  v === 'Tenant / lessee' ? 'tenant' : v === 'Homeowner' ? 'homeowner' : 'all',
                );
              }}
            />
          </div>
          <div className="rt-select">
            <Select
              label="Sort by"
              options={['Submitted', 'Phase']}
              value={sortKey === 'phase' ? 'Phase' : 'Submitted'}
              onChange={(e) =>
                onSortKeyChange(e.target.value === 'Phase' ? 'phase' : 'submitted')
              }
            />
          </div>
          <button
            type="button"
            className="rt-dir"
            onClick={onToggleSortDir}
            aria-label={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}. Activate to switch direction.`}
          >
            <SortIcon size={16} strokeWidth={2.4} aria-hidden="true" />
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
