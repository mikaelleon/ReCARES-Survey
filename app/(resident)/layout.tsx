import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { RagBotChat } from '@/components/ragbot/RagBotChat';

/**
 * Resident-facing chrome: navigation and footer on all public pages.
 */
export default function ResidentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <ScrollToTop />
      <RagBotChat />
    </>
  );
}
