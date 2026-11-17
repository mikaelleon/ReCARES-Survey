# Hero design log · 2026-11-17

Scope: the hero section of the resident landing page (`components/home/HomePage.tsx`).
Bar: Awwwards Site of the Day. Primary readers are older homeowners and residents with limited digital literacy or mobility (`docs/DESIGN-SYSTEM.md`, intro), so clarity and a large, obvious action outrank decoration.

## Starting point

Centered wordmark over a photo with a flat 55% scrim, two buttons, a four-color stripe. The "obvious" hero: centered stack on a scrim. Also, `public/images/h1.png` was a 6.6 MB PNG served unoptimized (`next.config.js` sets `images.unoptimized`).

## Directions rendered (`directions.html`, `shots/`)

| # | Idea | Verdict |
| --- | --- | --- |
| 1 | **Notice on the fence.** A flyer hung in front of the court photo. The paper carries the type, so the photo stays clean. The tear-off stub at the bottom is the primary button. | Chosen. Fits the system's stated tone ("a community notice"), says who and where without a scrim, and has one memorable behavior. |
| 2 | **Ask first.** One sentence as the whole screen over a dark photo. | Legible, but the scrim kills the photo and nothing about it is ownable. Same slot as the current hero. |
| 3 | **Wordmark through the photo.** Photo clipped into huge letters. | Rejected. The last letter crops off ("ReCARE"), it names the product and says nothing about the place, and it is hard to read for the target audience. |

Problem found in the raw prototype of 1: the paper is far larger than the fence panels it would hang on, so it reads as a card pasted on a photo. Fix: treat the paper as a near-camera object (it hangs from the top edge of the frame by cable ties, the court sits behind it), and keep it believable through craft: material, light, cast shadow, one-sided swing against the fence, a real tear.

## Decisions

- **Concept:** a notice posted at the court. Every later choice is checked against it.
- **Moment people remember:** the stub. It is the CTA, has a perforation, and tears off when pressed (arc, anticipation, follow-through), then the survey opens.
- **Honest content only.** Copy is taken from the project's own FAQ and About text: 11 to 13 minutes, no name asked, UB Lipa capstone. No invented stats or testimonials. The photo is real. No generated imagery: a generated "court" would present something invented as real, and the real photo is the strongest asset.
- **Voice:** the system says residents are addressed directly and "we" is reserved for About and the inquiry form, so the notice uses "your answers".

## System (inherited, with proposed changes)

Tokens come from `styles/tokens.css`: `--white`, `--black`, `--dark-emerald`, `--emerald-400/900`, `--harvest-orange`, `--bright-amber`, `--accent-hover`; fonts Poppins (wordmark), Open Sauce One (headline), Lato (body, buttons). Paper is `color-mix(--white 68%, #fff)`, ink is `color-mix(--black 90%, --dark-emerald)`. The paper stays light in dark theme (same precedent as emerald cards staying emerald).

Changes proposed to `docs/DESIGN-SYSTEM.md` (applied in the same change):

1. Section 3.5 and 10: hero is a photo with a notice, not a scrim with a centered wordmark; stripe becomes a 72px four-color rule on the notice.
2. Section 6: the hero primary no longer has an amber glow (colored glow removed in the earlier unslop pass); hover uses the existing `--accent-hover`.
3. Section 7: hero-only physical motion. A one-sided swing on load (paper cannot swing into the fence) and a 360ms tear. Everything else keeps "no bounce, spring, or overshoot".
4. Section 2 and 4: section headings were set to sentence case in the earlier unslop pass. The doc still says uppercase. Needs a decision from the owner.
5. Hero primary focus ring is black, because the amber ring is invisible on the amber stub.

## Round log

### Round 1 (fresh critic, one round)

Score **6.65** (Design 6, Usability 7.5, Creativity 6.5, Content 7). Most wrong note: the flyer's materiality, a dashed line carries the whole physical idea.

Fixed after the round:
- Paper was cool grey satin: now warmer stock, shade bands cut to 3.5%.
- Cable ties were small pegs: strap 9px, head 17x22, holes 17px.
- Type too small: body 16 to 18, link 14 to 16, footnote 13 to 14, stub label 14 to 17, headline up to 40px, notice 440 to 480px wide. Eyebrow stays on one line (no orphaned "CITY").
- Tear had no weight: 320 to 560ms, longer fall, stronger paper recoil.
- Gust read as a tilt toward the viewer: smaller out-swing plus a roll about the tie line.
- Phones: footnote hidden and rule tightened so the stub rises toward the fold.

Not fixed, and why:
- Photo crop and a dusk photo for dark theme: needs new photography from the owner. Nothing generated, on purpose.
- Flyer breaking the frame, rest tilt, grommets: not attempted; rest tilt blurs text, frame-break needs a layout change. Next round.
- HOA named in the notice and a Filipino version: content decision for the owner. The HOA link is still only "exploring a collaboration".
- Floating "Start a call" widget competes on phones: third-party, outside the hero.
- Hover color: kept the system's `--accent-hover` (black on it measures about 5:1, the critic estimated 4:1 by eye).
- Tear-to-survey handoff (carry the stub into the survey page): the 9 needs it. Not started.

Not re-scored after the fixes; no second critic round was run. Recaptures of 1440 and 360 only.


### Sections follow the hero (2026-11-17)

Everything below the hero now uses the hero's object: `Notice` (paper, shadow, ties, stub, gust, tear) hung from a `Board` (a green CSS fence rail, like the pipe in the photo). Shared styles: `styles/notice.css`, `styles/board.css`. The hero was moved onto the same `Notice`, so there is one copy of the paper CSS. Tear logic is shared in `lib/ui/useTear.ts` and `lib/ui/useSurveyTear.ts`.

Found on disk at the start: a half-finished version of this work (the `Notice` component, tokens, tear hooks, deleted old cards, a design-system section describing a photo-backed board with a 12-column grid) with no `notice.css`, so the page returned 500. I kept the primitives, finished them as a rail board, and rewrote the design-system section to match what is built. The photo-backed board was not built.

- About: two notices on one rail. Goals: ruled rows instead of three equal cards. FAQ: ruled rows on paper plus a fact notice with the stub. Contact: text notice plus a reply slip whose stub tears off when the message is sent.
- Every primary action is a stub: hero, FAQ, and the form's send button.
- Removed: info/goal cards, emerald inquiry card, scroll reveal, `.lift`, sticky FAQ sidebar, the two-logo theme swap (the paper is always light).
- Content change: the FAQ sidebar said 10 to 15 minutes; it now says 11 to 13, matching the hero and the FAQ answer.
- Checked: no horizontal overflow 320 to 1920 (rail ends and shadows clipped by `.home-boards`), 0 console errors, 0 animations under reduced motion, board gust fires on scroll and settles on an identity transform, FAQ stub tears and opens the survey, Back restores, tab order logical. Not checked: a real inquiry send (needs Firestore) and frame capture of the torn form state.

### Unslop pass 3 (2026-11-17)

Few signs left, so only these were fixed:
- Board gust on scroll removed: three boards swinging dilutes the one moment. Only the hero gusts now; `Board` is a plain server component.
- FAQ fact dots (orange, amber, emerald) removed: color with no meaning.
- About notice mark and "About the study" eyebrow removed: they repeated the hero masthead and the title.
- Hero footnote ("Capstone project, University of Batangas, Lipa Campus") removed: the About notice says it directly below, and the footer says it again.

Left alone, outside the landing page body: the footer repeats the capstone and collaboration facts a third time; the FAQ stub is a second "Start the survey" (kept: it ends the FAQ path); the floating call widget.
