import { ChartSkeleton } from '@/components/ui/Skeleton';

/** Loading placeholder that mirrors the Summary layout: count, tabs, then chart cards. */
export function ResponsesSkeleton() {
  return (
    <div className="admin-panel skel-region" aria-busy="true" aria-live="polite">
      <span className="visually-hidden">Loading responses</span>
      <div className="rr-skel-charts" aria-hidden="true">
        {Array.from({ length: 4 }, (_, i) => (
          <ChartSkeleton key={i} height={160} />
        ))}
      </div>
    </div>
  );
}
