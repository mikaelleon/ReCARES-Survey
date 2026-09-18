import Image from 'next/image';
import { RecaresLogoForPage } from '@/components/brand/RecaresLogo';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { HeroCtas } from '@/components/home/HeroCtas';
import { InquiryContactChoices } from '@/components/home/InquiryContactChoices';
import { InquiryForm } from '@/components/home/InquiryForm';
import { RevealOnScroll } from '@/components/home/RevealOnScroll';
import { GoalCard } from '@/components/ui/GoalCard';
import { InfoCard } from '@/components/ui/InfoCard';
import { Accessibility, MapPin, Shield } from 'lucide-react';

function CamellaLogoMark() {
  return (
    <Image
      src="/images/Camella-LOGO.svg"
      alt="Camella Homes"
      width={200}
      height={200}
      unoptimized
      style={{ display: 'block', width: 200, height: 200, objectFit: 'contain' }}
    />
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
 * Resident homepage — hero, about, goals, FAQ, and inquiry form.
 */
export function HomePage() {
  return (
    <>
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(16px, 3vw, 32px) clamp(16px, 4vw, 32px) 0',
        }}
      >
        <RevealOnScroll>
          <div
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              minHeight: 'clamp(420px, 62vh, 560px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image
              src="/images/h1.png"
              alt="Camella Homes Tibig outdoor basketball court and community grounds"
              fill
              priority
              sizes="(max-width: 1120px) 100vw, 1120px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'var(--overlay-hero)',
                pointerEvents: 'none',
              }}
            />
            <div className="hero-stripe" aria-hidden="true">
              <div className="hero-stripe__seg" style={{ background: 'var(--dark-emerald)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--emerald-400)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--harvest-orange)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--bright-amber)' }} />
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
                }}
              >
                Help us understand what safety and service improvements Camella Homes Tibig residents
                need most, before we build anything.
              </div>
              <HeroCtas />
            </div>
          </div>
        </RevealOnScroll>
      </div>

      <div
        id="about"
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: 'clamp(48px, 8vw, 96px) clamp(16px, 4vw, 32px) 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 'clamp(16px, 2.4vw, 24px)',
            alignItems: 'stretch',
          }}
        >
          <RevealOnScroll
            className="lift"
            style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', transition: 'transform 220ms ease-in-out' }}
          >
            <div data-ic="" style={{ display: 'flex', width: '100%' }}>
              <InfoCard heading="What is this survey for?" iconSide="right" icon={<CamellaLogoMark />}>
                This survey is part of a research project by fourth-year Information Technology
                students at the University of Batangas, Lipa Campus, working with the Camella Homes
                Tibig Homeowners Association. It asks about your experience with the current HOA
                office hours, security setup, and reporting channels, so the proposed system reflects
                what residents actually deal with day to day, not just what looks good on paper. Your
                answers will shape which features get built first and which problems the system is
                designed to solve.
              </InfoCard>
            </div>
          </RevealOnScroll>

          <RevealOnScroll
            delayMs={80}
            className="lift"
            style={{ flex: '1 1 100%', minWidth: 0, display: 'flex', transition: 'transform 220ms ease-in-out' }}
          >
            <div data-ic="" style={{ display: 'flex', width: '100%' }}>
              <InfoCard
                heading="About us"
                iconSide="left"
                icon={<RecaresLogoForPage size={200} lightSurface="favicon" />}
              >
                ReCARES stands for Resident Centered Assistance for Reporting and Emergency System. We
                are a team of fourth-year Information Technology students from the University of
                Batangas, Lipa Campus, working on this as our capstone research project. We are
                currently exploring a possible collaboration with the Camella Homes Tibig Homeowners
                Association, and this survey is part of how we are assessing whether a system like
                this would actually be useful to the community before we design or build anything. Our
                work is supervised by our academic adviser. If you live in Camella Homes Tibig, your
                answers directly shape what we recommend next.
              </InfoCard>
            </div>
          </RevealOnScroll>

          <RevealOnScroll style={{ flex: '1 1 100%', paddingTop: 'clamp(24px, 4vw, 40px)' }}>
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
          </RevealOnScroll>

          <RevealOnScroll
            delayMs={0}
            className="lift"
            style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', transition: 'transform 220ms ease-in-out' }}
          >
            <GoalCard
              title="Safer, more private reporting"
              icon={<Shield size={28} strokeWidth={2} />}
            >
              Give residents a way to reach out about sensitive personal safety concerns privately,
              without relying on public posts or waiting for the office to open.
            </GoalCard>
          </RevealOnScroll>
          <RevealOnScroll
            delayMs={80}
            className="lift"
            style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', transition: 'transform 220ms ease-in-out' }}
          >
            <GoalCard
              title="Accessible services for every resident"
              icon={<Accessibility size={28} strokeWidth={2} />}
            >
              Make it possible for residents with disabilities or mobility challenges to request
              documents, raise concerns, and get help without needing to travel to the office in
              person.
            </GoalCard>
          </RevealOnScroll>
          <RevealOnScroll
            delayMs={160}
            className="lift"
            style={{ flex: '1 1 240px', minWidth: 0, display: 'flex', transition: 'transform 220ms ease-in-out' }}
          >
            <GoalCard
              title="Faster response to security concerns"
              icon={<MapPin size={28} strokeWidth={2} />}
            >
              Help guards and HOA staff respond more quickly to suspicious behavior, break-ins, and
              other safety concerns by sending your real-time location pin.
            </GoalCard>
          </RevealOnScroll>

          <RevealOnScroll style={{ flex: '1 1 100%', minWidth: 0, width: '100%' }}>
            <FaqAccordion />
          </RevealOnScroll>
        </div>
      </div>

      <div className="contact-band">
        <div
          id="contact"
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '0 clamp(16px, 4vw, 32px)',
          }}
        >
          <RevealOnScroll>
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
          </RevealOnScroll>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(16px, 2.4vw, 24px)',
              alignItems: 'stretch',
            }}
          >
            <RevealOnScroll
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
                transition: 'transform 220ms ease-in-out',
              }}
            >
              <InquiryContactChoices />
            </RevealOnScroll>
            <RevealOnScroll delayMs={80} style={{ flex: '1.4 1 380px', minWidth: 0, display: 'flex' }}>
              <InquiryForm />
            </RevealOnScroll>
          </div>
        </div>
      </div>
    </>
  );
}
