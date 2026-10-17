import { SkelLine } from '@/components/ui/Skeleton';
import type { InquiryViewMode } from './inquiryMeta';

/** Loading placeholder shaped like the layout the user will actually get. */
export function InquirySkeleton({ mode }: { mode: InquiryViewMode }) {
  const cardLike = mode === 'comfortable' || mode === 'compact';
  const count = cardLike ? 6 : 5;
  return (
    <div aria-busy="true" role="status">
      <span className="visually-hidden">Loading inquiries…</span>
      <div
        className={cardLike ? `inq-cards inq-cards--${mode}` : 'inq-list inq-list--skel'}
        aria-hidden="true"
      >
        {Array.from({ length: count }, (_, i) =>
          cardLike ? (
            <div key={i} className={`inq-card inq-card--${mode}`}>
              <SkelLine size="md" />
              <SkelLine size="sm" />
              <SkelLine size="full" />
              {mode === 'comfortable' ? <SkelLine size="md" /> : null}
            </div>
          ) : (
            <div key={i} className="inq-list__row">
              <SkelLine size="sm" />
              <SkelLine size="md" />
              <SkelLine size="full" />
            </div>
          ),
        )}
      </div>
    </div>
  );
}
