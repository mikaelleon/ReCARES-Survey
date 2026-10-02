'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';
import { RagBotChat } from '@/components/ragbot/RagBotChat';

function isSurveyPath(pathname: string): boolean {
  return pathname === '/survey' || pathname.startsWith('/survey/');
}

/**
 * Resident chrome. Survey screens keep the navbar and drop the footer and chat.
 */
export function ResidentChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const survey = isSurveyPath(pathname);

  return (
    <>
      <Navbar />
      {children}
      {survey ? null : <Footer />}
      <ScrollToTop />
      {survey ? null : <RagBotChat />}
    </>
  );
}
