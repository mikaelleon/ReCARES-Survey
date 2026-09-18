'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FAQ } from '@/survey/content';

/**
 * Single-expand FAQ accordion with measured panels, keyboard nav, and CTA pulse.
 */
export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [panelHeights, setPanelHeights] = useState<number[]>([]);
  const [hovered, setHovered] = useState<number | null>(null);
  const [pulseCta, setPulseCta] = useState(false);
  const contentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const pulsedRef = useRef(false);

  const measure = useCallback(() => {
    setPanelHeights(
      contentRefs.current.map((el) => (el ? el.scrollHeight : 0)),
    );
  }, []);

  useLayoutEffect(() => {
    measure();
  }, [measure, openIndex]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || pulsedRef.current) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !pulsedRef.current) {
          pulsedRef.current = true;
          setPulseCta(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const focusButton = (index: number) => {
    const clamped = Math.max(0, Math.min(FAQ.length - 1, index));
    buttonRefs.current[clamped]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        focusButton(index + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        focusButton(index - 1);
        break;
      case 'Home':
        e.preventDefault();
        focusButton(0);
        break;
      case 'End':
        e.preventDefault();
        focusButton(FAQ.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={sectionRef}
      id="faq"
      style={{
        flex: '1 1 100%',
        minWidth: 0,
        width: '100%',
        paddingTop: 'clamp(24px, 4vw, 40px)',
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
              const panelId = `faq-panel-${index}`;
              const headerId = `faq-header-${index}`;
              const showHover = !isOpen && hovered === index;
              return (
                <div
                  key={item.question}
                  onMouseEnter={() => setHovered(index)}
                  onMouseLeave={() => setHovered((h) => (h === index ? null : h))}
                  style={{
                    background: showHover
                      ? 'var(--card-fill-accordion-open)'
                      : 'var(--card-fill-neutral)',
                    borderRadius: 12,
                    overflow: 'hidden',
                    transition: 'background var(--motion-duration) var(--motion-ease)',
                  }}
                >
                  <button
                    ref={(el) => {
                      buttonRefs.current[index] = el;
                    }}
                    id={headerId}
                    type="button"
                    onClick={() => toggle(index)}
                    onKeyDown={(e) => onKeyDown(e, index)}
                    aria-expanded={isOpen}
                    aria-controls={panelId}
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
                    id={panelId}
                    role="region"
                    aria-labelledby={headerId}
                    hidden={!isOpen}
                    style={{
                      overflow: 'hidden',
                      maxHeight: isOpen ? panelHeights[index] ?? 0 : 0,
                      opacity: isOpen ? 1 : 0,
                      transition:
                        'max-height 280ms var(--motion-ease), opacity 220ms var(--motion-ease)',
                    }}
                  >
                    <div
                      ref={(el) => {
                        contentRefs.current[index] = el;
                      }}
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
          <div
            style={{ marginTop: 4 }}
            className={pulseCta ? 'faq-cta-pulse' : undefined}
            onAnimationEnd={() => setPulseCta(false)}
          >
            <Button variant="primary" href="/survey" fullWidth>
              Start the survey
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
