'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { LanguageToggle, type LanguageValue } from '@/components/layout/LanguageToggle';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';

/**
 * Retention bullet is a deliberate placeholder — confirm the real period with the
 * academic adviser before shipping (see SurveyConsentGate privacyBullets).
 */
const RETENTION_PLACEHOLDER_EN =
  '[Retention period to confirm with your adviser, for example: “Responses will be kept until the study is completed and defended, then deleted.”]';

const RETENTION_PLACEHOLDER_FIL =
  '[Panahon ng pagtatago — kumpirmahin sa inyong adviser, halimbawa: “Itatago ang mga sagot hanggang matapos at maidepensa ang pag-aaral, pagkatapos ay buburahin.”]';

const COPY = {
  EN: {
    title: 'Before You Begin',
    leave: 'Leave the survey',
    languageLabel: 'Language',
    termsTitle: 'Terms and Conditions',
    termsBody:
      'This survey is part of a capstone research study. Taking part is completely voluntary. You can stop at any point before you submit, and skipping any question will not affect your standing with the Homeowners Association in any way. Your answers will be used only for this research and reported as combined results, not as individual responses tied to you.',
    privacyTitle: 'Data Privacy Notice',
    privacyIntro:
      'This survey collects your address details, household information, and your answers to the questions that follow. In line with the Data Privacy Act of 2012 (Republic Act No. 10173), here is how your information will be handled:',
    privacyBullets: [
      'Your answers are stored securely and are accessible only to the student researchers conducting this study, under the supervision of their academic adviser.',
      "Your information will be used only to guide the design of the proposed system and to prepare the study's findings.",
      'You have the right to ask what information was collected, to request a correction, or to have your response excluded, for as long as your response can still be identified as yours.',
      RETENTION_PLACEHOLDER_EN,
    ],
    ackTitle: 'Acknowledgment (required)',
    ackLabel:
      'I have read and understood the information above, and I agree to take part in this survey voluntarily.',
    cta: 'Continue',
  },
  FIL: {
    title: 'Bago Ka Magsimula',
    leave: 'Umalis sa survey',
    languageLabel: 'Wika',
    termsTitle: 'Mga Tuntunin at Kondisyon',
    termsBody:
      'Bahagi ang survey na ito ng isang capstone research study. Boluntaryo ang paglahok. Maaari kang tumigil anumang oras bago mag-submit, at ang paglaktaw sa anumang tanong ay hindi makakaapekto sa iyong katayuan sa Homeowners Association sa anumang paraan. Gagamitin ang iyong mga sagot para lamang sa pananaliksik na ito at iuulat bilang pinagsama-samang resulta, hindi bilang indibidwal na sagot na nakaugnay sa iyo.',
    privacyTitle: 'Abiso sa Privacy ng Datos',
    privacyIntro:
      'Kinokolekta ng survey na ito ang mga detalye ng iyong address, impormasyon ng sambahayan, at ang iyong mga sagot sa mga susunod na tanong. Alinsunod sa Data Privacy Act of 2012 (Republic Act No. 10173), ganito hahawakan ang iyong impormasyon:',
    privacyBullets: [
      'Ligtas na iniimbak ang iyong mga sagot at maa-access lamang ng mga student researchers na nagsasagawa ng pag-aaral na ito, sa ilalim ng pangangasiwa ng kanilang academic adviser.',
      'Gagamitin ang iyong impormasyon upang gabayan ang disenyo ng iminumungkahing sistema at upang ihanda ang mga natuklasan ng pag-aaral.',
      'May karapatan kang itanong kung anong impormasyon ang nakolekta, humiling ng pagwawasto, o magpaalis ng iyong sagot, habang matutukoy pa ang sagot bilang sa iyo.',
      RETENTION_PLACEHOLDER_FIL,
    ],
    ackTitle: 'Pagkilala (kailangan)',
    ackLabel:
      'Nabasa at naintindihan ko ang impormasyon sa itaas, at boluntaryo akong sumasang-ayon na lumahok sa survey na ito.',
    cta: 'Magpatuloy',
  },
} as const;

export interface SurveyConsentGateProps {
  language: LanguageValue;
  onLanguageChange: (value: LanguageValue) => void;
  onContinue: () => void;
}

/**
 * Before You Begin — language, terms, privacy, and required acknowledgment gate.
 */
export function SurveyConsentGate({
  language,
  onLanguageChange,
  onContinue,
}: SurveyConsentGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const copy = COPY[language];

  const cardStyle = useMemo(
    () => ({
      marginTop: 20,
      background: 'var(--card-fill-neutral)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 16,
      padding: 'clamp(16px, 2.4vw, 22px)',
      display: 'flex' as const,
      flexDirection: 'column' as const,
      gap: 12,
    }),
    [],
  );

  const headingStyle = useMemo(
    () => ({
      margin: 0,
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--text-headline)',
    }),
    [],
  );

  const bodyStyle = useMemo(
    () => ({
      margin: 0,
      fontSize: 15,
      lineHeight: 1.55,
      color: 'var(--text-body)',
      textWrap: 'pretty' as const,
    }),
    [],
  );

  return (
    <div
      style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '8px clamp(16px, 4vw, 32px) clamp(48px, 8vw, 96px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 10,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: 'var(--text-section-heading)',
            }}
          >
            {copy.languageLabel}
          </span>
          <LanguageToggle
            value={language}
            onChange={onLanguageChange}
            labels={{ EN: 'English', FIL: 'Filipino' }}
          />
        </div>
        <Link
          href="/"
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            color: 'var(--text-caption)',
            textDecoration: 'underline',
          }}
        >
          {copy.leave}
        </Link>
      </div>

      <h1
        style={{
          margin: '12px 0 0',
          color: 'var(--text-headline)',
          fontSize: 'clamp(24px, 6vw, 32px)',
          fontWeight: 700,
          lineHeight: 1.25,
          textWrap: 'pretty',
        }}
      >
        {copy.title}
      </h1>

      <section style={cardStyle} aria-labelledby="consent-terms-title">
        <h2 id="consent-terms-title" style={headingStyle}>
          {copy.termsTitle}
        </h2>
        <p style={bodyStyle}>{copy.termsBody}</p>
      </section>

      <section style={cardStyle} aria-labelledby="consent-privacy-title">
        <h2 id="consent-privacy-title" style={headingStyle}>
          {copy.privacyTitle}
        </h2>
        <p style={bodyStyle}>{copy.privacyIntro}</p>
        <ul
          style={{
            margin: 0,
            padding: '0 0 0 1.2em',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            color: 'var(--text-body)',
            fontSize: 15,
            lineHeight: 1.55,
          }}
        >
          {copy.privacyBullets.map((bullet) => (
            <li key={bullet} style={{ textWrap: 'pretty' }}>
              {bullet}
            </li>
          ))}
        </ul>
      </section>

      <section style={cardStyle} aria-labelledby="consent-ack-title">
        <h2 id="consent-ack-title" style={headingStyle}>
          {copy.ackTitle}
        </h2>
        <Checkbox
          label={copy.ackLabel}
          checked={acknowledged}
          onChange={(e) => setAcknowledged(e.target.checked)}
        />
      </section>

      <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="primary" onClick={onContinue} disabled={!acknowledged}>
          {copy.cta}
        </Button>
      </div>
    </div>
  );
}
