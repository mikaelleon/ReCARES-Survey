import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';

/**
 * Resident-facing chrome: navigation and footer on all public pages.
 */
export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
