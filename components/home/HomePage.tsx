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
      width={160}
      height={160}
      unoptimized
      className="home-logo-mark"
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
      <section className="home-wrap home-wrap--hero" aria-label="Welcome">
        <RevealOnScroll>
          <div className="home-hero">
            <Image
              src="/images/h1.png"
              alt="Camella Homes Tibig outdoor basketball court and community grounds"
              fill
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1120px) 100vw, 1120px"
              style={{ objectFit: 'cover', objectPosition: 'center' }}
            />
            <div className="home-hero__overlay" />
            <div className="hero-stripe" aria-hidden="true">
              <div className="hero-stripe__seg" style={{ background: 'var(--dark-emerald)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--emerald-400)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--harvest-orange)' }} />
              <div className="hero-stripe__seg" style={{ background: 'var(--bright-amber)' }} />
            </div>
            <div className="home-hero__copy">
              <h1 className="home-hero__title">
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
              </h1>
              <p className="home-hero__kicker">Community needs assessment survey</p>
              <p className="home-hero__place">For residents of Camella Homes Tibig, Lipa City</p>
              <p className="home-hero__lead">
                Help us understand what safety and service improvements Camella Homes Tibig residents
                need most, before we build anything.
              </p>
              <HeroCtas />
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <section id="about" className="home-wrap" aria-labelledby="about-heading">
        <h2 id="about-heading" className="visually-hidden">
          About this survey
        </h2>
        <div className="home-stack">
          <RevealOnScroll className="lift home-info">
            <div data-ic="">
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

          <RevealOnScroll delayMs={80} className="lift home-info">
            <div data-ic="">
              <InfoCard
                heading="About us"
                iconSide="left"
                icon={<RecaresLogoForPage size={140} lightSurface="favicon" className="home-logo-mark" />}
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

          <RevealOnScroll>
            <h2 className="home-section-title">Goals of this study</h2>
          </RevealOnScroll>

          <div className="home-goals">
            <RevealOnScroll delayMs={0} className="lift">
              <GoalCard
                title="Safer, more private reporting"
                icon={<Shield size={28} strokeWidth={2} />}
              >
                Give residents a way to reach out about sensitive personal safety concerns privately,
                without relying on public posts or waiting for the office to open.
              </GoalCard>
            </RevealOnScroll>
            <RevealOnScroll delayMs={80} className="lift">
              <GoalCard
                title="Accessible services for every resident"
                icon={<Accessibility size={28} strokeWidth={2} />}
              >
                Make it possible for residents with disabilities or mobility challenges to request
                documents, raise concerns, and get help without needing to travel to the office in
                person.
              </GoalCard>
            </RevealOnScroll>
            <RevealOnScroll delayMs={160} className="lift">
              <GoalCard
                title="Faster response to security concerns"
                icon={<MapPin size={28} strokeWidth={2} />}
              >
                Help guards and HOA staff respond more quickly to suspicious behavior, break-ins, and
                other safety concerns by sending your real-time location pin.
              </GoalCard>
            </RevealOnScroll>
          </div>

          <RevealOnScroll>
            <FaqAccordion />
          </RevealOnScroll>
        </div>
      </section>

      <div className="contact-band">
        <section id="contact" className="home-wrap home-wrap--flush" aria-labelledby="contact-heading">
          <RevealOnScroll>
            <h2 id="contact-heading" className="home-section-title home-section-title--flush">
              For further inquiries or concerns
            </h2>
          </RevealOnScroll>
          <div className="home-contact">
            <RevealOnScroll className="lift home-contact__copy">
              <InquiryContactChoices />
            </RevealOnScroll>
            <RevealOnScroll delayMs={80} className="home-contact__form">
              <InquiryForm />
            </RevealOnScroll>
          </div>
        </section>
      </div>
    </>
  );
}
