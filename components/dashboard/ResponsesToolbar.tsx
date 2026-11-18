'use client';

import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { SearchField } from '@/components/admin/SearchField';
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
 * The shared admin filter bar: search, filters, sort and the date range inline, with Clear and
 * the result count at the end. Same bar as every other list screen (`.inq-toolbar`).
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
  const SortIcon = sortDir === 'asc' ? ArrowUp : ArrowDown;

  const active: string[] = [];
  if (query.trim()) active.push(`“${query.trim()}”`);
  if (phase) active.push(phase);
  if (branch !== 'all') active.push(branch === 'tenant' ? 'Tenant / lessee' : 'Homeowner');

  return (
    <div className="inq-toolbar responses-toolbar" role="search">
      <SearchField
        value={query}
        onChange={onQueryChange}
        placeholder="Search"
        ariaLabel="Search responses by ID, phase or resident type"
      />
      <div className="inq-toolbar__sort">
        <Select
          label="Phase"
          options={['All phases', ...PHASE_OPTIONS]}
          value={phase || 'All phases'}
          onChange={(e) => onPhaseChange(e.target.value === 'All phases' ? '' : e.target.value)}
        />
      </div>
      <div className="inq-toolbar__sort">
        <Select
          label="Branch"
          options={['Any', 'Tenant / lessee', 'Homeowner']}
          value={
            branch === 'tenant' ? 'Tenant / lessee' : branch === 'homeowner' ? 'Homeowner' : 'Any'
          }
          onChange={(e) => {
            const v = e.target.value;
            onBranchChange(v === 'Tenant / lessee' ? 'tenant' : v === 'Homeowner' ? 'homeowner' : 'all');
          }}
        />
      </div>
      <div className="inq-toolbar__sort">
        <Select
          label="Sort by"
          options={['Submitted', 'Phase']}
          value={sortKey === 'phase' ? 'Phase' : 'Submitted'}
          onChange={(e) => onSortKeyChange(e.target.value === 'Phase' ? 'phase' : 'submitted')}
        />
      </div>
      <button
        type="button"
        className="inq-btn"
        onClick={onToggleSortDir}
        aria-label={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}. Activate to switch direction.`}
      >
        <SortIcon size={16} strokeWidth={2} aria-hidden="true" />
        {sortDir === 'asc' ? 'Asc' : 'Desc'}
      </button>
      {trailing}
      <div className="inq-toolbar__end">
        {active.length > 0 ? (
          <button type="button" className="inq-toolbar__reset" onClick={onResetFilters}>
            Clear filters
          </button>
        ) : null}
        <p className="inq-toolbar__count" aria-live="polite">
          Showing {showing} of {total}
        </p>
      </div>
    </div>
  );
}
