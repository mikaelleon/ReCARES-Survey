'use client';

import { Input } from '@/components/ui/Input';
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
    <div className="finding-notes-toolbar" role="search">
      <div className="finding-notes-toolbar__filters">
        <div className="finding-notes-toolbar__search">
          <Input
            id="finding-search"
            label="Search"
            placeholder="Search title or body…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="finding-notes-toolbar__select">
          <Select
            label="Tag"
            options={TAG_FILTER}
            value={tagFilter}
            onChange={(e) => onTagFilterChange(e.target.value)}
          />
        </div>
        <div className="finding-notes-toolbar__select">
          <Select
            label="Status"
            options={STATUS_FILTER}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          />
        </div>
        <div className="finding-notes-toolbar__select finding-notes-toolbar__select--wide">
          <Select
            label="Question"
            options={QUESTION_FILTER}
            value={questionFilter}
            onChange={(e) => onQuestionFilterChange(e.target.value)}
          />
        </div>
        <div className="finding-notes-toolbar__select">
          <Select
            label="Sort"
            options={[...FINDING_SORT_OPTIONS]}
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as FindingSortOption)}
          />
        </div>
      </div>
      <div className="finding-notes-toolbar__actions">
        <p className="finding-notes-toolbar__count" aria-live="polite">
          {typeof resultCount === 'number'
            ? `${resultCount} note${resultCount === 1 ? '' : 's'}`
            : ' '}
        </p>
        <label className="finding-notes-toolbar__mine">
          <input
            type="checkbox"
            checked={mineOnly}
            onChange={(e) => onMineOnlyChange(e.target.checked)}
          />
          <span>My notes</span>
        </label>
      </div>
    </div>
  );
}
