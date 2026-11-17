import { FactsNotice, FaqNotice } from '@/components/home/FaqNotices';
import { FenceStage, StageCell, StagePanel } from '@/components/home/FenceStage';
import { HeroNotice } from '@/components/home/HeroNotice';
import { InquiryContactChoices } from '@/components/home/InquiryContactChoices';
import { InquiryForm } from '@/components/home/InquiryForm';
import { Notice } from '@/components/ui/Notice';
import '@/styles/notice.css';
import '@/styles/stage.css';
import '@/styles/hero.css';

const PHOTO_SIZES = '(min-width: 1280px) 140vw, 800px';

const goals = [
  {
    title: 'Private reporting',
    body: 'Residents can reach out about personal safety concerns without public posts or waiting for the office to open.',
  },
  {
    title: 'Services without a trip to the office',
    body: 'Residents with disabilities or mobility challenges can request documents, raise concerns and get help without going in person.',
  },
  {
    title: 'Faster security response',
    body: 'Guards and HOA staff get your real-time location pin, so they can respond sooner to suspicious behavior, break-ins and other safety concerns.',
  },
];

/**
 * Resident homepage: one locked screen. You walk along the court fence and read the
 * notices hung on it: the survey, why we are asking, the goals, the FAQ, and the contact slip.
 * See components/home/FenceStage.tsx.
 */
export function HomePage() {
  return (
    <FenceStage
      photo={
        <>
          <picture className="stage__shot stage__shot--day" data-shot="day">
            <source type="image/avif" srcSet="/images/hero/day-640.avif 640w, /images/hero/day-1024.avif 1024w, /images/hero/day-1536.avif 1536w, /images/hero/day-2048.avif 2048w" sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet="/images/hero/day-640.webp 640w, /images/hero/day-1024.webp 1024w, /images/hero/day-1536.webp 1536w, /images/hero/day-2048.webp 2048w" sizes={PHOTO_SIZES} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero/day-1536.webp"
              alt="The outdoor basketball court at Camella Homes Tibig by day, seen through its green mesh fence"
              width={2390}
              height={1792}
              decoding="async"
              fetchPriority="high"
            />
          </picture>
          <picture className="stage__shot stage__shot--dusk" data-shot="dusk">
            <source type="image/avif" srcSet="/images/hero/dusk-640.avif 640w, /images/hero/dusk-1024.avif 1024w, /images/hero/dusk-1536.avif 1536w, /images/hero/dusk-2048.avif 2048w" sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet="/images/hero/dusk-640.webp 640w, /images/hero/dusk-1024.webp 1024w, /images/hero/dusk-1536.webp 1536w, /images/hero/dusk-2048.webp 2048w" sizes={PHOTO_SIZES} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero/dusk-1536.webp"
              alt="The same court at dusk, the sky turning orange behind the fence"
              width={2390}
              height={1792}
              decoding="async"
              fetchPriority="low"
            />
          </picture>
          <picture className="stage__shot stage__shot--dawn" data-shot="dawn">
            <source type="image/avif" srcSet="/images/hero/dawn-640.avif 640w, /images/hero/dawn-1024.avif 1024w, /images/hero/dawn-1536.avif 1536w, /images/hero/dawn-2048.avif 2048w" sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet="/images/hero/dawn-640.webp 640w, /images/hero/dawn-1024.webp 1024w, /images/hero/dawn-1536.webp 1536w, /images/hero/dawn-2048.webp 2048w" sizes={PHOTO_SIZES} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero/dawn-1536.webp"
              alt="The same court at first light, the sky turning pale blue behind the fence"
              width={2390}
              height={1792}
              decoding="async"
              fetchPriority="low"
            />
          </picture>
          <picture className="stage__shot stage__shot--night" data-shot="night">
            <source type="image/avif" srcSet="/images/hero/night-640.avif 640w, /images/hero/night-1024.avif 1024w, /images/hero/night-1536.avif 1536w, /images/hero/night-2048.avif 2048w" sizes={PHOTO_SIZES} />
            <source type="image/webp" srcSet="/images/hero/night-640.webp 640w, /images/hero/night-1024.webp 1024w, /images/hero/night-1536.webp 1536w, /images/hero/night-2048.webp 2048w" sizes={PHOTO_SIZES} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/hero/night-1536.webp"
              alt="The same court at night, lit by floodlights behind its green mesh fence"
              width={2390}
              height={1792}
              decoding="async"
              fetchPriority="low"
            />
          </picture>
        </>
      }
    >
      <StagePanel section="survey" label="Survey" align="end">
        <StageCell label="Survey" width={480} grow={0}>
          <HeroNotice />
        </StageCell>
      </StagePanel>

      <StagePanel section="about" label="About">
        <StageCell label="About" width={560}>
          <Notice aria-labelledby="about-heading">
            <h2 id="about-heading" className="notice__title">
              Why we&rsquo;re asking
            </h2>
            <p className="notice__body">
              ReCARES (Resident Centered Assistance for Reporting and Emergency System) is a
              capstone project by fourth-year Information Technology students at the University of
              Batangas, Lipa Campus, supervised by our academic adviser.
            </p>
            <p className="notice__body">
              We are exploring a collaboration with the Camella Homes Tibig Homeowners Association.
              Nothing here represents an established partnership. This survey tells us whether a
              system like this would be useful before we design or build anything. It asks about
              HOA office hours, security and reporting channels. Your answers decide which features
              come first.
            </p>
          </Notice>
        </StageCell>
        <StageCell label="Goals" width={520}>
          <Notice aria-labelledby="goals-heading">
            <h2 id="goals-heading" className="notice__title">
              Goals of this study
            </h2>
            <ol className="notice__rows">
              {goals.map((g) => (
                <li key={g.title} className="notice__row">
                  <h3 className="goal__title">{g.title}</h3>
                  <p className="goal__body">{g.body}</p>
                </li>
              ))}
            </ol>
          </Notice>
        </StageCell>
      </StagePanel>

      <StagePanel section="faq" label="FAQ">
        <StageCell label="FAQ" width={880} grow={2.9}>
          <FaqNotice />
        </StageCell>
        <StageCell label="Facts" width={320}>
          <FactsNotice />
        </StageCell>
      </StagePanel>

      <StagePanel section="contact" label="Contact">
        <StageCell label="Contact" width={540}>
          <Notice aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="notice__title">
              For further inquiries or concerns
            </h2>
            <InquiryContactChoices />
          </Notice>
        </StageCell>
        <StageCell label="Message" width={520}>
          <InquiryForm />
        </StageCell>
      </StagePanel>
    </FenceStage>
  );
}
