import type { InquiryRow } from '@/lib/firebase/inquiryManage';
import type { InquiryStatus } from '@/survey/schema';

export type InquiryViewMode = 'table' | 'comfortable' | 'compact' | 'list';

export const INQUIRY_VIEW_MODES: readonly InquiryViewMode[] = ['table', 'comfortable', 'compact', 'list'];

export const STATUS_FILTER = ['All', 'New', 'In progress', 'Resolved'];
export const SORT_NEWEST = 'Newest first';
export const SORT_OLDEST = 'Oldest first';
export const SORT_FROM = 'From (A–Z)';
export const SORT_OPTIONS = [SORT_NEWEST, SORT_OLDEST, SORT_FROM];

export function filterLabel(status: InquiryStatus): string {
  if (status === 'in_progress') return 'In progress';
  if (status === 'resolved') return 'Resolved';
  return 'New';
}

export function statusFromFilter(label: string): InquiryStatus | 'all' {
  if (label === 'New') return 'new';
  if (label === 'In progress') return 'in_progress';
  if (label === 'Resolved') return 'resolved';
  return 'all';
}

export function formatWhen(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

/** Main identifier for a message: the sender's name, else their email. */
export function senderLabel(row: InquiryRow): string {
  return row.name || row.email || 'Unknown sender';
}

/** Handlers and busy state shared by every view mode. */
export interface InquiryHandlers {
  busyId: string | null;
  /** True while a delete is in flight; locks every row action. */
  locked: boolean;
  onStatus: (row: InquiryRow, status: InquiryStatus) => void;
  onDelete: (row: InquiryRow) => void;
}
