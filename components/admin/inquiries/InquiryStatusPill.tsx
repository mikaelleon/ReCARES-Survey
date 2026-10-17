import { CheckCircle2, Clock, Inbox } from 'lucide-react';
import type { InquiryStatus } from '@/survey/schema';
import { filterLabel } from './inquiryMeta';

const ICON = { new: Inbox, in_progress: Clock, resolved: CheckCircle2 } as const;
const TONE = { new: 'new', in_progress: 'progress', resolved: 'resolved' } as const;

/** Status as icon + text, so it never depends on color alone. */
export function InquiryStatusPill({ status }: { status: InquiryStatus }) {
  const Icon = ICON[status];
  return (
    <span className={`inq-pill inq-pill--${TONE[status]}`}>
      <Icon size={14} strokeWidth={2.4} aria-hidden="true" />
      {filterLabel(status)}
    </span>
  );
}
