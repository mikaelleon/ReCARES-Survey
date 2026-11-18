import type { InquiryStatus } from '@/survey/schema';
import { filterLabel } from './inquiryMeta';

/** Status as plain words. New is the only one that asks for attention, so only it is set darker. */
export function InquiryStatusPill({ status }: { status: InquiryStatus }) {
  return <span className={`inq-status inq-status--${status}`}>{filterLabel(status)}</span>;
}
