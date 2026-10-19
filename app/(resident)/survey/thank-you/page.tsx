'use client';

import Link from 'next/link';
import { useState } from 'react';
import { BarChart3, Check, CheckCircle2, Copy, Layers, Share2, ShieldCheck, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { RichText } from '@/components/survey/RichText';
import {
  SurveyLanguageProvider,
  SurveyLanguageToggle,
  useT,
} from '@/components/survey/SurveyLanguage';
import { COPY } from '@/survey/copy';
import { useQueryParam } from '@/lib/navigation/useQueryParam';

const NEXT_STEPS = [
  { icon: Layers, title: COPY.next1Title, body: COPY.next1Body },
  { icon: BarChart3, title: COPY.next2Title, body: COPY.next2Body },
  { icon: UsersRound, title: COPY.next3Title, body: COPY.next3Body },
] as const;

export default function ThankYouPage() {
  return (
    <SurveyLanguageProvider>
      <ThankYou />
    </SurveyLanguageProvider>
  );
}

function ThankYou() {
  const t = useT();
  const interview = useQueryParam('interview');
  const interviewSent = interview === 'sent';
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    const url = `${window.location.origin}/survey/`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard can be blocked: fall back to a temporary field.
      const field = document.createElement('input');
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand('copy');
      field.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2400);
  };

  return (
    <div className="survey-flow ty-page">
      <div className="survey-toolbar ty-toolbar">
        <span />
        <SurveyLanguageToggle />
      </div>

      <div className="survey-body">
      <section className="ty-hero" aria-labelledby="ty-title">
        <span className="ty-badge" aria-hidden="true">
          <CheckCircle2 size={44} strokeWidth={1.8} />
        </span>
        <h1 id="ty-title" className="ty-title">
          {t(COPY.thanksTitle)}
        </h1>
        <p className="ty-lead">
          <RichText text={t(COPY.thanksLead)} />
        </p>
        {interviewSent ? (
          <p className="ty-notice" role="status">
            <Check size={18} strokeWidth={2.6} aria-hidden="true" />
            <span>
              <RichText text={t(COPY.thanksInterview)} />
            </span>
          </p>
        ) : null}
      </section>

      <section className="ty-card" aria-labelledby="ty-next">
        <h2 id="ty-next" className="ty-heading">
          {t(COPY.nextTitle)}
        </h2>
        <ol className="ty-steps">
          {NEXT_STEPS.map(({ icon: Icon, title, body }, index) => (
            <li key={title} style={{ animationDelay: `${index * 80}ms` }}>
              <span className="ty-steps__icon" aria-hidden="true">
                <Icon size={20} strokeWidth={2.1} />
              </span>
              <div>
                <h3>{t(title)}</h3>
                <p>
                  <RichText text={t(body)} />
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="ty-grid">
        <section className="ty-card" aria-labelledby="ty-good">
          <h2 id="ty-good" className="ty-heading">
            <ShieldCheck size={20} strokeWidth={2.2} aria-hidden="true" />
            {t(COPY.goodTitle)}
          </h2>
          <ul className="ty-list">
            <li>
              <RichText text={t(COPY.good1)} />
            </li>
            <li>
              <RichText text={t(COPY.good2)} />
            </li>
            <li>
              {t('Questions about the study? Use the')} <Link href="/#contact">{t('inquiry form')}</Link>.
            </li>
          </ul>
        </section>

        <section className="ty-card" aria-labelledby="ty-share">
          <h2 id="ty-share" className="ty-heading">
            <Share2 size={20} strokeWidth={2.2} aria-hidden="true" />
            {t(COPY.shareTitle)}
          </h2>
          <p className="ty-body">
            <RichText text={t(COPY.shareBody)} />
          </p>
          <button type="button" className="ty-copy" data-copied={copied || undefined} onClick={copyLink}>
            {copied ? <Check size={16} strokeWidth={2.6} aria-hidden="true" /> : <Copy size={16} strokeWidth={2.2} aria-hidden="true" />}
            <span aria-live="polite">{copied ? t(COPY.linkCopied) : t(COPY.copyLink)}</span>
          </button>
        </section>
      </div>

      <div className="ty-actions">
        <Button variant="primary" href="/">
          {t(COPY.backHome)}
        </Button>
      </div>
      </div>
    </div>
  );
}
