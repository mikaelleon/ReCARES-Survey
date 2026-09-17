'use client';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PHASE_OPTIONS } from '@/lib/admin/sampleResponses';

export type Section4Filter = 'all' | 'yes' | 'no';
export type SortKey = 'submitted' | 'phase';
export type SortDir = 'asc' | 'desc';

/**
 * Search, filters, sort, export, and local add (disabled) for responses.
 */
export function ResponseToolbar({
  query,
  onQueryChange,
  phase,
  onPhaseChange,
  section4,
  onSection4Change,
  sortKey,
  sortDir,
  onSortKeyChange,
  onToggleSortDir,
  showing,
  total,
  onExport,
  onCopySummary,
  exportDisabled,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  phase: string;
  onPhaseChange: (value: string) => void;
  section4: Section4Filter;
  onSection4Change: (value: Section4Filter) => void;
  sortKey: SortKey;
  sortDir: SortDir;
  onSortKeyChange: (value: SortKey) => void;
  onToggleSortDir: () => void;
  showing: number;
  total: number;
  onExport: () => void;
  onCopySummary: () => void;
  exportDisabled: boolean;
}) {
  return (
    <div className="admin-toolbar">
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
            label="Section 4"
            options={['Any', 'Shown', 'Not shown']}
            value={
              section4 === 'yes' ? 'Shown' : section4 === 'no' ? 'Not shown' : 'Any'
            }
            onChange={(e) => {
              const v = e.target.value;
              onSection4Change(
                v === 'Shown' ? 'yes' : v === 'Not shown' ? 'no' : 'all',
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
          <span title="Coming when responses API is live">
            <Button variant="primary" disabled>
              Add response
            </Button>
          </span>
        </div>
      </div>
    </div>
  );
}
