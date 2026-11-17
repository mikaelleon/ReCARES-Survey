# One-screen landing · design log · 2026-11-17

Request: the landing page should not be a scroll experience. Lock it to one screen; reach the other sections by swiping or buttons.
Bar: Awwwards Site of the Day. Primary readers are older homeowners and residents with limited digital literacy (`docs/DESIGN-SYSTEM.md`), so every move must also be a visible, labelled button. Swiping is the bonus, never the only way.

## Starting point

A long page: hero, then three boards (About + Goals, FAQ + facts, Contact), then a footer. The hero was a boxed 1120px photo frame. The notices already hang from a green rail (`Board`), so the concept for the move is ready-made.

## Directions rendered (`directions.html`, `shots/`)

| # | Idea | Verdict |
| --- | --- | --- |
| 1 | **Fence walk.** One long rail, notices hung from it. Swipe or press Next and the rail slides; the photo behind drifts more slowly, so you walk along the fence. The next notice peeks in at the edge. | Chosen. It is the object we already have, it makes swiping mean something (you are moving along a fence), and the peek is a built-in "there is more" cue. The photo goes full-bleed, a much stronger first screen than the boxed frame. |
| 2 | **Tear-off pad.** Sections are sheets of a pad; tear the top sheet to see the next. | Rejected. Tearing already means "Start the survey", you cannot tear back, and a stack of blank sheet edges under the notice reads as an empty paper block. |
| 3 | **Index tabs.** One notice at a time, divider tabs on its edge, tap to swap. | Rejected. The conventional answer: it works, but nothing about it is this place, and it has no swipe. |

## Decisions

- **Concept:** you are walking along the court fence reading the notices on it. Every choice is checked against that.
- **Model:** a horizontal scroll-snap track (native swipe, momentum, trackpad, accessibility) inside a locked `100dvh` stage. No page scroll.
- **Stops.** Wide screens (1280px and up): four stops, each a pair of notices (Survey; About + Goals; FAQ + facts; Contact + message slip). Narrower: one notice per stop, seven stops, so nothing needs vertical scrolling on a phone.
- **Controls, always visible:** Previous and "Next: <name>" buttons with a plain label, plus the nav links, which are now the tabs. Also swipe, mouse drag on empty photo, mouse wheel (vertical wheel moves one stop, because nothing else would happen), arrow keys, Home and End, and tapping the peeking notice.
- **Physics:** the photo drifts at about a tenth of the rail's speed (depth). Hanging notices lag the moving rail and swing back (follow-through), driven by real scroll velocity. They rest on an exact identity transform so text is crisp.
- **Honest content.** The footer is gone from this page. Its unique facts are kept: the "Nothing here represents an established partnership" sentence moves into the "Why we're asking" notice, and "Proponent access" becomes a quiet link under the contact choices. Its repeats of the capstone line and the contact pointer are dropped.
- **Nav:** a Contact link is added, because Contact is now a stop of its own (it used to light up "FAQ").



## Round 1 (fresh critic, one round)

Score **7.2** (Design 7, Usability 8, Creativity 7, Content 8). Most wrong note: the floating call dock (third-party) sitting over content, and a concept that is faint in stills.

Fixed after the round:
- Photo read as "a forest": zoom cut from 140% to 125% and anchored to the bottom, so the court, fence and pergola show behind the notices.
- Rail is a heavier pipe (22px) so it reads as the fence, not navbar chrome.
- Big screens: notices scale 1.2x from 1700px wide and 1.45x from 2200px, so a 1920 screen is not mostly empty foliage.

Not fixed, and why:
- The call dock: third-party widget; its room is reserved on phones. Moving or shrinking it (for example `variant="tiny"`) is the owner's call.
- Short phones (360x640, 390x664) still scroll a few long notices inside their paper.
- Paper realism (texture, curl, tilt), a bigger differently shaped Survey poster, a display face, a "tear here" label: next round.
- Body text size: the critic read ~12px from scaled sheets; real size is 16 to 18px (not changed).
- Stop names differ between phone label and navbar (Goals vs About): left, since sections and stops differ by design.
- Not re-scored after the fixes.

## Unslop pass (shadows and theme)

- Removed the drop shadows on the rail and both end posts, the navbar's shadow on the stage, and the dark band at the top of the vignette. One depth cue per surface: a single highlight on each pipe.
- The theme did nothing here, because the photo and paper are theme-independent. Now light is the court by day and dark is the court at dusk (photo `brightness(.5) saturate(.72)`, cooler vignette, paper a touch dimmer), so the toggle visibly works.

## UX and animation pass

- Pipe highlights removed: rail and posts are flat `--emerald-600`.
- Arrow keys, Page Up/Down, Home and End now jump (no smooth scroll): keys are fired fast and often. Buttons, nav links, wheel and drag stay smooth.
- FAQ answer fades in over 160ms (ease-out) instead of appearing from nothing; off with reduced motion.
- Phone navbar Back/Next raised from 40 to 44px for touch.
- Reviewed and kept: press 0.96 with named properties, hover gated to real pointers, the 560ms tear (a rare moment), the damped swing (time-based, rests on identity), reduced motion (instant moves, still photo, no swing).
- Flagged, not changed: the move itself uses the browser's smooth scroll (about 0.5 to 0.8s, not tunable); a hand-run 350ms curve would be nearer the 300 to 400ms target for spatial moves but gives up native momentum and interruption.

## Night photo

Dark theme now uses the real night photo `h2.png` (AVIF/WebP at 640 to 2048 px in `public/images/hero/night-*`), not a darkened day photo. Both photos are in the page; CSS shows the one for the theme, and the night one loads lazily. Same 4:3 shape, so the drift is unchanged.

## Theme switch mask

Switching light/dark reveals the new theme with a 45 degree edge sweeping across from the side the toggle is on (View Transitions API, 400ms ease-in-out, a rare spatial move). Applies to every toggle (navbar, admin). Checked in Chrome: class set during the switch and cleared after about 440ms, theme and storage flip, reduced motion switches instantly, no console errors. The circle itself was not captured frame by frame (headless screenshots are too slow for a 400ms move).

## UX and animation pass on the theme switch

Reviewed: a few times a session, so animated; 400ms ease-in-out is in range for a whole-screen spatial move; reduced motion switches instantly; no color transitions during the swap.
Fixed:
- The night photo was lazy and hidden, so the first switch to dark could reveal an unloaded photo mid-sweep. It now loads right after the day photo at low priority; checked loaded before any toggle.
- Toggling twice mid-sweep: the older switch finishing no longer strips the class the newer one needs.
Not changed: the edge is hard (no feather); the second toggle skips the first sweep instead of reversing it from where it is (a browser limit of View Transitions).

## Theme change: time of day, not a mask (replaces the diagonal sweep)

Requested: no masking. Light to dark plays `h3.png` (day), `h4.png` (dusk), `h2.png` (night); dark to light plays `h2.png`, `h5.png` (dawn), `h3.png`.
- Four stacked shots in `HomePage`, each its own AVIF and WebP set (`hero/day-*`, `dusk-*`, `night-*`, `dawn-*`). The earlier `court-*` files (made from `h1.png`) are removed; light theme now shows `h3.png`.
- `ThemeProvider` announces `theme:shift`, then flips the theme. `FenceStage` plays two 450ms crossfades (about 0.9s) with the shot on screen kept opaque underneath, so there is never a dip to the background. Inline styles are dropped at the end and CSS holds the right shot for the theme.
- Checked by sampling opacities every frame: day, dusk, night in order and the reverse; end states right; no leftover inline styles; reduced motion switches at once; no console errors; all four photos load before any toggle.
- Cost: the three extra photos load at low priority (about 120 to 270KB each at the larger size).
- The vignette and paper no longer change with theme, so nothing pops while the photo fades.

## Theme change, more natural

The two 450ms fades ran one after the other, so the picture stopped at dusk or dawn and then started again. Now they overlap: 800ms fades, the second starting 450ms after the first (about 1.25s), on a sine curve, so the light drifts through the middle shot instead of passing it. Ambient light, so slower than a UI move (the 500ms per move guide is for responses). Checked by sampling opacities each frame.

## Unslop pass: top navbar

- Links and the phone section label: sentence case, 15px (14px on the label), no tracking. Uppercase tracked labels were the stock navbar look.
- "Start the survey": was a filled white pill that competed with the amber stub. Now an outlined 8px-radius link, so the stubs stay the only loud actions. 8px matches the other nav buttons (one radius family).
- Theme toggle: the icon now shows the mode you will get (moon in light, sun in dark; it was always a moon), 40px with 8px radius like the phone menu button.
- Kept: the logo mark, the emerald bar, the phone Back/Next. No shadow (removed earlier).

## UX and animation pass: top navbar

- Mobile drawer appeared from nothing. It now slides in from the right (250ms ease-out) with the backdrop fading, and leaves the way it came (180ms ease-in) before unmounting. Reduced motion: no animation.
- Press feedback (scale 0.96, 120ms ease-out) on the menu, theme, and phone Back/Next buttons.
- Link color moved to 150ms ease (was 220ms ease-in-out).
- Touch targets: menu and theme buttons 44px (were 40).
- Checked in Chrome at 390px: drawer animates in and out, a link closes it and moves the stage, reduced motion is instant, no console errors.
- Kept: nav link and stage changes stay instant to the keys (high frequency).

## UX and animation pass: theme button

- The icon used to swap instantly with a 200ms spin of the new icon. Now both icons share one cell and swap at once: the one leaving shrinks to 0.3 with a turn and a 3px blur, the one arriving grows in (200 to 250ms, ease-out, CSS transitions, so a second tap turns around from where it is). The icon shows the mode you will get. Reduced motion: instant.
- Kept: press scale 0.96, hover 150ms, 44px target. The photo's 1.25s time-of-day change is the main motion; the icon only confirms the tap.
- Checked by script: end states right both ways, quick double toggle settles right, reduced motion, no console errors. Removed the old spin keyframes.
