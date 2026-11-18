'use client';

import { SearchField } from '@/components/admin/SearchField';
import { Select } from '@/components/ui/Select';
import { RESPONSE_QUESTION_OPTIONS } from '@/lib/admin/responseQuestions';
import {
  FINDING_STATUS_LABELS,
  FINDING_STATUSES,
  FINDING_TAG_LABELS,
  FINDING_TAGS,
} from '@/lib/firebase/findingNotes';

export const FINDING_SORT_OPTIONS = [
  'Updated (newest)',
  'Updated (oldest)',
  'Created (newest)',
  'Created (oldest)',
  'Title (A–Z)',
  'Status',
] as const;

export type FindingSortOption = (typeof FINDING_SORT_OPTIONS)[number];

const TAG_FILTER = ['All tags', ...FINDING_TAGS.map((t) => FINDING_TAG_LABELS[t])];
const STATUS_FILTER = ['All statuses', ...FINDING_STATUSES.map((s) => FINDING_STATUS_LABELS[s])];
const QUESTION_FILTER = ['All questions', ...RESPONSE_QUESTION_OPTIONS.map((q) => q.title)];

/**
 * Search, filter, and sort controls — Members-toolbar / Dashboard card surface.
 */
export function FindingNotesToolbar({
  search,
  onSearchChange,
  tagFilter,
  onTagFilterChange,
  statusFilter,
  onStatusFilterChange,
  questionFilter,
  onQuestionFilterChange,
  sortBy,
  onSortByChange,
  mineOnly,
  onMineOnlyChange,
  resultCount,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  tagFilter: string;
  onTagFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  questionFilter: string;
  onQuestionFilterChange: (value: string) => void;
  sortBy: FindingSortOption;
  onSortByChange: (value: FindingSortOption) => void;
  mineOnly: boolean;
  onMineOnlyChange: (value: boolean) => void;
  resultCount?: number;
}) {
  return (
    <div className="inq-toolbar" role="search">
      <SearchField
        id="finding-search"
        value={search}
        onChange={onSearchChange}
        placeholder="Search"
        ariaLabel="Search title or body"
      />
      <div className="inq-toolbar__sort">
        <Select label="Tag" options={TAG_FILTER} value={tagFilter} onChange={(e) => onTagFilterChange(e.target.value)} />
      </div>
      <div className="inq-toolbar__sort">
        <Select label="Status" options={STATUS_FILTER} value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)} />
      </div>
      <div className="inq-toolbar__sort">
        <Select label="Question" options={QUESTION_FILTER} value={questionFilter} onChange={(e) => onQuestionFilterChange(e.target.value)} />
      </div>
      <div className="inq-toolbar__sort">
        <Select
          label="Sort"
          options={[...FINDING_SORT_OPTIONS]}
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value as FindingSortOption)}
        />
      </div>
      <label className="ws-toggle">
        <input type="checkbox" checked={mineOnly} onChange={(e) => onMineOnlyChange(e.target.checked)} />
        My notes
      </label>
      <p className="visually-hidden" aria-live="polite">
        {typeof resultCount === 'number' ? `${resultCount} note${resultCount === 1 ? '' : 's'}` : ''}
      </p>
    </div>
  );
}
