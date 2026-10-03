'use client';

import { Button } from '@/components/ui/Button';
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
  onExport: () => void;
  onCopySummary: () => void;
  exportDisabled: boolean;
}

/**
 * Sticky page-level filters/actions for Responses (above Summary / Question / Individual card).
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
  onExport,
  onCopySummary,
  exportDisabled,
}: ResponsesToolbarProps) {
  return (
    <div className="responses-toolbar">
      <div className="responses-toolbar__inner">
        <div className="admin-toolbar__filters">
          <div className="admin-toolbar__search">
            <Input
              label="Search responses"
              placeholder="Response ID, phase, resident type"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
            />
          </div>
          <div className="admin-toolbar__select">
            <Select
              label="Phase"
              options={['All phases', ...PHASE_OPTIONS]}
              value={phase || 'All phases'}
              onChange={(e) =>
                onPhaseChange(e.target.value === 'All phases' ? '' : e.target.value)
              }
            />
          </div>
          <div className="admin-toolbar__select">
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
          <div className="admin-toolbar__select">
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
            className="admin-toolbar__dir"
            onClick={onToggleSortDir}
            aria-label={`Sort ${sortDir === 'asc' ? 'ascending' : 'descending'}. Click to toggle.`}
          >
            {sortDir === 'asc' ? 'Asc' : 'Desc'}
          </button>
        </div>

        <div className="admin-toolbar__meta">
          <p className="admin-toolbar__count" aria-live="polite">
            Showing {showing} of {total}
          </p>
          <div className="admin-toolbar__actions">
            <Button variant="secondary" onClick={onCopySummary} disabled={total === 0}>
              Copy summary
            </Button>
            <Button variant="secondary" onClick={onExport} disabled={exportDisabled}>
              Export CSV
            </Button>
            <span title="Manually add a test response (not wired yet)">
              <Button variant="secondary" disabled>
                Add response
              </Button>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
