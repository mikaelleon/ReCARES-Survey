import { FaqAccordion } from '@/components/home/FaqAccordion';
import { InquiryForm } from '@/components/home/InquiryForm';
import { Button } from '@/components/ui/Button';
import { GoalCard } from '@/components/ui/GoalCard';
import { InfoCard } from '@/components/ui/InfoCard';

function SurveyIcon() {
  return (
    <svg
      width={150}
      height={150}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: 'var(--text-body)', background: 'transparent' }}
    >
      <path d="M16 12h32a3 3 0 0 1 3 3v37a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V15a3 3 0 0 1 3-3z" />
      <path d="M25 12V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v3z" />
      <path d="M21 25h10" />
      <path d="M21 33h22" />
      <path d="M21 41h16" />
      <path d="M38 22.5l3 3 6-6" />
    </svg>
  );
}

function AboutIcon() {
  return (
    <svg
      width={130}
      height={130}
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: 'var(--text-body)', background: 'transparent' }}
    >
      <path d="M6 27 32 8l26 19" />
      <path d="M11 25v29h42V25" />
      <circle cx={32} cy={33} r={4} />
      <path d="M25 48c0-4.2 3.1-7.5 7-7.5s7 3.3 7 7.5" />
      <circle cx={21} cy={38} r={3.2} />
      <path d="M16 50c0-3.4 2.3-6 5-6 1.3 0 2.5.6 3.4 1.6" />
      <circle cx={43} cy={38} r={3.2} />
      <path d="M48 50c0-3.4-2.3-6-5-6-1.3 0-2.5.6-3.4 1.6" />
    </svg>
  );
}

const heroLetters = [
  { char: 'R', color: 'var(--white)', delay: '0ms' },
  { char: 'e', color: 'var(--white)', delay: '60ms' },
  { char: 'C', color: 'var(--emerald-400)', delay: '120ms' },
  { char: 'A', color: 'var(--harvest-orange)', delay: '180ms' },
  { char: 'R', color: 'var(--harvest-orange)', delay: '240ms' },
  { char: 'E', color: 'var(--bright-amber)', delay: '300ms' },
  { char: 'S', color: 'var(--white)', delay: '360ms' },
];

/**
 * Resident homepage — hero, about, goals, FAQ, ready cards, and inquiry form.
 */
export function HomePage() {
  return (
    <>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 32px) 0' }}>
        <div
          style={{
            position: 'relative',
            borderRadius: 16,
            overflow: 'hidden',
            minHeight: 'clamp(420px, 62vh, 560px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 420ms ease-in-out both',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--surface-2)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: 20,
              color: '#e5ebe8',
              fontSize: 14,
            }}
          >
            Drop the perimeter photograph
          </div>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'var(--overlay-hero)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 22,
              display: 'flex',
              pointerEvents: 'none',
            }}
          >
            <div style={{ flex: 1, background: 'var(--dark-emerald)' }} />
            <div style={{ flex: 1, background: 'var(--emerald-400)' }} />
            <div style={{ flex: 1, background: 'var(--harvest-orange)' }} />
            <div style={{ flex: 1, background: 'var(--bright-amber)' }} />
          </div>
          <div
            style={{
              position: 'relative',
              padding: 'clamp(48px, 9vw, 80px) clamp(20px, 5vw, 40px) clamp(56px, 10vw, 92px)',
              textAlign: 'center',
              pointerEvents: 'none',
              maxWidth: 820,
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-poppins), Poppins, sans-serif',
                fontWeight: 700,
                lineHeight: 1,
                fontSize: 'clamp(44px, 11vw, 92px)',
                letterSpacing: '.01em',
              }}
            >
              {heroLetters.map(({ char, color, delay }) => (
                <span
                  key={char + delay}
                  style={{
                    color,
                    display: 'inline-block',
                    animation: `riseIn 460ms ease-in-out ${delay} both`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: 'var(--font-title)',
                fontSize: 'clamp(18px, 4.6vw, 24px)',
                fontWeight: 700,
                color: 'var(--bright-amber)',
                animation: 'riseIn 460ms ease-in-out 380ms both',
              }}
            >
              Community needs assessment survey
            </div>
            <div
              style={{
                marginTop: 14,
                fontFamily: 'var(--font-title)',
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '.12em',
                textTransform: 'uppercase',
                color: 'var(--white)',
                animation: 'riseIn 460ms ease-in-out 440ms both',
              }}
            >
              For residents of Camella Homes Tibig, Lipa City
            </div>
            <div
              style={{
                margin: '18px auto 0',
                maxWidth: 620,
                fontSize: 16,
                lineHeight: 1.55,
                color: 'var(--white)',
                textWrap: 'pretty',
                animation: 'riseIn 460ms ease-in-out 500ms both',
              }}
            >
              Help us understand what safety and service improvements Camella Homes Tibig residents
              need most, before we build anything.
            </div>
            <div
              style={{
                marginTop: 28,
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                flexWrap: 'wrap',
                pointerEvents: 'auto',
                animation: 'riseIn 460ms ease-in-out 560ms both',
              }}
            >
              <Button variant="primary" onDark href="/survey">
                Start the survey.
              </Button>
              <Button variant="secondary" onDark href="/#about">
                Learn more
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div
        id="about"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px) 0',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 24px)', alignItems: 'stretch' }}>
          <div
            data-ic=""
            className="lift"
            style={{
              flex: '1 1 100%',
              minWidth: 0,
              display: 'flex',
              animation: 'riseIn 460ms ease-in-out both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <InfoCard heading="What is this survey for?" iconSide="right" icon={<SurveyIcon />}>
              This survey is part of a research project by fourth-year Information Technology students
              at the University of Batangas, Lipa Campus, working with the Camella Homes Tibig
              Homeowners Association. It asks about your experience with the current HOA office hours,
              security setup, and reporting channels, so the proposed system reflects what residents
              actually deal with day to day, not just what looks good on paper. Your answers will shape
              which features get built first and which problems the system is designed to solve.
            </InfoCard>
          </div>

          <div
            data-ic=""
            className="lift"
            style={{
              flex: '1 1 100%',
              minWidth: 0,
              display: 'flex',
              animation: 'riseIn 460ms ease-in-out 80ms both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <InfoCard heading="About us" iconSide="left" icon={<AboutIcon />}>
              ReCARES stands for Resident Centered Assistance for Reporting and Emergency System. We
              are a team of fourth-year Information Technology students from the University of
              Batangas, Lipa Campus, working on this as our capstone research project. We are
              currently exploring a possible collaboration with the Camella Homes Tibig Homeowners
              Association, and this survey is part of how we are assessing whether a system like this
              would actually be useful to the community before we design or build anything. Our work
              is supervised by our academic adviser. If you live in Camella Homes Tibig, your answers
              directly shape what we recommend next.
            </InfoCard>
          </div>

          <div style={{ flex: '1 1 100%', paddingTop: 'clamp(24px, 4vw, 40px)' }}>
            <h2
              style={{
                margin: 0,
                color: 'var(--text-section-heading)',
                textTransform: 'uppercase',
                fontSize: 'clamp(20px, 4.5vw, 24px)',
                fontWeight: 700,
                letterSpacing: '.04em',
              }}
            >
              Goals of this study
            </h2>
          </div>

          <div
            className="lift"
            style={{
              flex: '1 1 240px',
              minWidth: 0,
              display: 'flex',
              animation: 'riseIn 460ms ease-in-out both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <GoalCard title="Safer, more private reporting">
              Give residents a way to reach out about sensitive personal safety concerns privately,
              without relying on public posts or waiting for the office to open.
            </GoalCard>
          </div>
          <div
            className="lift"
            style={{
              flex: '1 1 240px',
              minWidth: 0,
              display: 'flex',
              animation: 'riseIn 460ms ease-in-out 80ms both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <GoalCard title="Accessible services for every resident">
              Make it possible for residents with disabilities or mobility challenges to request
              documents, raise concerns, and get help without needing to travel to the office in
              person.
            </GoalCard>
          </div>
          <div
            className="lift"
            style={{
              flex: '1 1 240px',
              minWidth: 0,
              display: 'flex',
              animation: 'riseIn 460ms ease-in-out 160ms both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <GoalCard title="Faster response to security concerns">
              Help guards and HOA staff respond more quickly to suspicious behavior, break-ins, and
              other safety concerns by sending your real-time location pin.
            </GoalCard>
          </div>

          <FaqAccordion />
        </div>
      </div>

      <div
        id="contact"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px) 0',
        }}
      >
        <h2
          style={{
            margin: '0 0 clamp(16px, 2.4vw, 24px)',
            color: 'var(--text-section-heading)',
            textTransform: 'uppercase',
            fontSize: 'clamp(20px, 4.5vw, 24px)',
            fontWeight: 700,
            letterSpacing: '.04em',
          }}
        >
          For further inquiries or concerns
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2.4vw, 24px)', alignItems: 'stretch' }}>
          <div
            className="lift"
            style={{
              flex: '1 1 260px',
              minWidth: 0,
              background: 'var(--card-fill-neutral)',
              borderRadius: 16,
              padding: 'clamp(20px, 3vw, 32px)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
              animation: 'riseIn 460ms ease-in-out both',
              transition: 'transform 220ms ease-in-out',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--text-on-card-neutral)',
                fontSize: 16,
                lineHeight: 1.6,
                textWrap: 'pretty',
              }}
            >
              Have a question about this survey or the study behind it? Send us a message and we will
              get back to you.
            </p>
            <p
              style={{
                margin: 0,
                color: 'var(--text-on-card-neutral)',
                fontSize: 16,
                lineHeight: 1.6,
                textWrap: 'pretty',
              }}
            >
              This is also where you can reach out if you would like to know more about the study
              before deciding whether to participate.
            </p>
          </div>
          <InquiryForm />
        </div>
      </div>
    </>
  );
}
