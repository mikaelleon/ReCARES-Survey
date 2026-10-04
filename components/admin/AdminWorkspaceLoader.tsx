import { PageLoader } from '@/components/ui/PageLoader';

/**
 * Full-viewport admin gate loader — replaces the old top-left “Loading…” text.
 * Shows a shell silhouette so the wait feels intentional, not broken.
 */
export function AdminWorkspaceLoader({
  label = 'Opening the admin workspace…',
}: {
  label?: string;
}) {
  return (
    <div className="admin-workspace-loader" role="status" aria-live="polite" aria-busy="true">
      <aside className="admin-workspace-loader__rail" aria-hidden="true">
        <div className="admin-workspace-loader__brand" />
        <div className="admin-workspace-loader__nav">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="admin-workspace-loader__foot" />
      </aside>
      <div className="admin-workspace-loader__main">
        <PageLoader label={label} />
      </div>
    </div>
  );
}
