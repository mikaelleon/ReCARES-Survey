'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { ScrollToTop } from '@/components/layout/ScrollToTop';

function isSurveyPath(pathname: string): boolean {
  return pathname === '/survey' || pathname.startsWith('/survey/');
}

/**
 * Resident chrome. Survey screens drop the navbar so the form has the whole screen. The landing page is one locked screen (see FenceStage), so it has no footer: the footer's facts live on its notices.
 * RAGbot lives in the root layout as the ElevenLabs widget.
 */
export function ResidentChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const survey = isSurveyPath(pathname);

  return (
    <>
      {survey ? null : <Navbar />}
      {survey ? <div className="survey-stage">{children}</div> : children}
      <ScrollToTop />
    </>
  );
}
