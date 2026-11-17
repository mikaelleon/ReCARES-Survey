'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { CSSProperties, MouseEvent } from 'react';
import { Notice, NoticeRule } from '@/components/ui/Notice';
import { stageGo } from '@/lib/ui/stage';
import { useSurveyTear } from '@/lib/ui/useSurveyTear';

/**
 * The first notice on the fence. The stub at the bottom is the primary action: it tears
 * off along the perforation, then the survey opens (see useSurveyTear).
 */
export function HeroNotice() {
  const { survey, label, tear, onStubClick, tearMs } = useSurveyTear();

  const onWhy = (e: MouseEvent<HTMLAnchorElement>) => {
    if (window.location.pathname !== '/') return;
    e.preventDefault();
    stageGo('about');
  };

  return (
    <Notice
      gust
      className="hero-notice"
      tear={tear}
      style={{ '--tear-ms': `${tearMs}ms` } as CSSProperties}
      stub={
        <Link href="/survey" className="notice__stub" data-survey={survey} onClick={onStubClick}>
          <span>{label}</span>
          {survey === 'open' ? <ArrowRight size={22} strokeWidth={2.4} aria-hidden="true" /> : null}
        </Link>
      }
    >
      <div className="hero-mast">
        <Image
          src="/images/ReCARES-LOGO_SVG/logo-favicon.svg"
          alt=""
          width={44}
          height={44}
          unoptimized
        />
        <span className="hero-mast__word">ReCARES</span>
      </div>
      <NoticeRule />

      <p className="notice__eyebrow">Camella Homes Tibig, Lipa City</p>
      <h1 className="notice__title">Which safety and service problems should come first?</h1>
      <p className="notice__body">
        Your answers decide what gets built first. It takes about 11 to 13 minutes, and your name
        is never asked.
      </p>
      <Link href="/#about" className="notice__link" onClick={onWhy}>
        Why we&rsquo;re asking
      </Link>
    </Notice>
  );
}
