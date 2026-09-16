'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FAQ } from '@/survey/content';

/**
 * Single-expand FAQ accordion with sidebar summary (homepage mock layout).
 */
export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div
      id="faq"
      style={{
        flex: '1 1 100%',
        minWidth: 0,
        width: '100%',
        paddingTop: 'clamp(24px, 4vw, 40px)',
        animation: 'riseIn 460ms ease-in-out both',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'clamp(16px, 2.4vw, 28px)',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ flex: '1 1 520px', minWidth: 0 }}>
          <h2
            style={{
              margin: '0 0 16px',
              color: 'var(--text-section-heading)',
              textTransform: 'uppercase',
              fontSize: 'clamp(20px, 4.5vw, 24px)',
              fontWeight: 700,
              letterSpacing: '.04em',
            }}
          >
            Frequently asked questions
          </h2>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {FAQ.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={item.question}
                  style={{
                    background: 'var(--card-fill-neutral)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'background var(--motion-duration) var(--motion-ease)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    style={{
                      width: '100%',
                      minHeight: 48,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      padding: '14px 18px',
                      color: 'var(--text-section-heading)',
                      textTransform: 'uppercase',
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '.05em',
                      lineHeight: 1.35,
                    }}
                  >
                    <span style={{ flex: 1 }}>{item.question}</span>
                    <ChevronDown
                      size={20}
                      strokeWidth={2.4}
                      aria-hidden="true"
                      style={{
                        flexShrink: 0,
                        color: 'var(--text-section-heading)',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 240ms var(--motion-ease)',
                      }}
                    />
                  </button>
                  <div
                    style={{
                      overflow: 'hidden',
                      maxHeight: isOpen ? '420px' : '0px',
                      opacity: isOpen ? 1 : 0,
                      transition:
                        'max-height 280ms var(--motion-ease), opacity 220ms var(--motion-ease)',
                    }}
                  >
                    <div
                      style={{
                        padding: '0 18px 16px',
                        fontSize: 15,
                        lineHeight: 1.55,
                        color: 'var(--text-on-card-neutral)',
                        textWrap: 'pretty',
                        fontWeight: 400,
                        textTransform: 'none',
                        letterSpacing: 'normal',
                      }}
                    >
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <aside
          style={{
            flex: '0 1 300px',
            minWidth: 240,
            maxWidth: 340,
            width: '100%',
            background: 'var(--card-fill-neutral)',
            borderRadius: 16,
            padding: 'clamp(20px, 3vw, 28px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            position: 'sticky',
            top: 72,
          }}
        >
          <SidebarRow
            color="var(--harvest-orange)"
            title="Estimated time"
            body="The survey takes around 10 to 15 minutes to complete."
          />
          <SidebarRow
            color="var(--bright-amber)"
            title="Voluntary"
            body="You can skip any question, and some sections only appear if they apply to you."
          />
          <SidebarRow
            color="var(--dark-emerald)"
            title="Confidential"
            body="Your answers are never shared with your name attached."
          />
          <div style={{ marginTop: 4 }}>
            <Button variant="primary" href="/survey" fullWidth>
              Start the survey.
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SidebarRow({
  color,
  title,
  body,
}: {
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span
        aria-hidden="true"
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: color,
          flexShrink: 0,
          marginTop: 4,
        }}
      />
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontFamily: 'var(--font-title)',
            color: 'var(--text-on-card-neutral)',
            textTransform: 'uppercase',
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.06em',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 4,
            color: 'var(--text-on-card-neutral)',
            fontSize: 14,
            lineHeight: 1.5,
            textWrap: 'pretty',
            opacity: 0.9,
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}
