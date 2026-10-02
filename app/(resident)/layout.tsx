import { ResidentChrome } from '@/components/layout/ResidentChrome';

/**
 * Resident-facing chrome: navigation on public pages.
 * Footer and RAGbot stay off survey routes.
 */
export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return <ResidentChrome>{children}</ResidentChrome>;
}
