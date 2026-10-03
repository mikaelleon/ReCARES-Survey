# ReCARES design system

Portable specification of the ReCARES website as it is built. Copy this file, plus `styles/tokens.css` and the font loading in `app/layout.tsx`, into another repository when the sites must look and behave the same way.

ReCARES is a bilingual community needs-assessment site for residents of Camella Homes Tibig, Lipa City. Two audiences stay visually related and structurally separate:

- **Residents** use the public site: homepage, survey, thank-you. The sticky bar carries only resident links. Admin entry is a quiet footer link labeled “Proponent access”.
- **Proponents** use the admin shell: login, signup, and the response dashboard. That shell has its own emerald top bar and never reuses the resident navbar.

Primary readers include older homeowners and residents with limited digital literacy or mobility limits. Clarity, large tap targets, and plain language outrank decoration.

---

## 1. How to apply this in another repo

1. Load the same fonts (section 4).
2. Paste the CSS custom properties (section 3) onto `:root` and `[data-theme="dark"]`.
3. Apply the **shell accent override** on `body` (section 3.4). Buttons, links, and the progress bar read those overridden values.
4. Set `data-theme="light"` on `<html>` by default. Persist the choice in `localStorage` under `recares-theme` (`"light"` or `"dark"`) and set the attribute before paint so the page does not flash the wrong theme.
5. Build pages from the layout widths, type roles, and component recipes below. Match radii, uppercase rules, and the emerald chrome even when the page content changes.

Theme transition on `body`: `background-color` and `color` over `200ms ease-in-out`.

---

## 2. Voice and content

- Tone is a community notice: plain, respectful, instructional. Tell the resident what to do next.
- Address the resident directly (“your household”, “your responses”). The research team uses “we” only in About and the inquiry form.
- **Sentence case** for headlines, subtitles, and body. **Uppercase** for eyebrows, section headings, card titles, nav labels, and button labels. Body paragraphs stay sentence case even inside an uppercase heading’s card.
- One label per action. The survey call to action is **“Start the survey”** (rendered uppercase by the button). Language-specific survey strings exist in English and Filipino, including errors and button labels.
- Required fields show a red asterisk and a written error (“This field is required”). Color never carries meaning alone.
- Errors are words next to the field. Success on the inquiry form replaces the form with a confirmation sentence.
- Emoji are unused. Icons are line icons.
- Long copy uses `text-wrap: pretty` and a comfortable line length (about 62 characters for admin leads, about 620px for the hero paragraph).

---

## 3. Color

### 3.1 Brand primitives

| Token | Hex | Role |
| --- | --- | --- |
| `--black` | `#0b0b0b` | Dark canvas, text on amber/orange |
| `--white` | `#e5ebe8` | Light page canvas and text on emerald |
| `--dark-emerald` | `#13693f` | Brand, chrome, goal cards, bot bubbles |
| `--harvest-orange` | `#f78021` | Live primary actions, chart accent, mic-live |
| `--bright-amber` | `#feca09` | Selected, focus, active nav, dark-mode section headings |
| `--dim-grey` | `#7b7170` | Structural borders only |
| `--error-red` | `#d64545` | Validation only |

Emerald ramp used for the hero wordmark, stripe, and hover on the chat button:

| Token | Hex |
| --- | --- |
| `--emerald-900` | `#0f5a35` |
| `--emerald-800` | `#13693f` (same as brand) |
| `--emerald-700` | `#1b7c4c` |
| `--emerald-600` | `#227e52` |
| `--emerald-500` | `#2a9a63` |
| `--emerald-400` | `#3db579` |

Hover orange used by the shell override: `#c2600f` (see 3.4).

Pie slices cycle this fixed palette, in order: `#13693f`, `#e87820`, `#1a8f56`, `#c45c12`, `#2d6a4f`, `#f0a060`, `#0d4d2e`, `#8f4510`. Horizontal summary bars use `#5f6368` (a Forms-style grey), with emerald, orange, and amber reserved for the other chart types.

### 3.2 Semantic tokens

| Token | Light | Dark |
| --- | --- | --- |
| `--page-bg` | `#e5ebe8` | `#0b0b0b` |
| `--surface-1` | `#f4f4f4` | `#141414` |
| `--surface-2` | `#eaeaea` | `#1f1f1f` |
| `--surface-3` | `#e5ebe8` | `#262626` |
| `--surface-3-border` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.12)` |
| `--card-fill-neutral` | `#ffffff` | `#2a2a28` |
| `--card-fill-brand` | `#13693f` both modes | same |
| `--card-fill-accordion-open` | `rgba(0,0,0,0.09)` | `rgba(255,255,255,0.14)` |
| `--text-headline` | `#13693f` | `#8ee4b5` (light mint — Dark Emerald fails contrast on near-black at UI sizes) |
| `--text-body` | `#13693f` | `#e5ebe8` |
| `--text-caption` | `rgba(0,0,0,0.7)` | `rgba(255,255,255,0.7)` |
| `--text-section-heading` | `#13693f` | `#feca09` |
| `--text-on-card-neutral` | `#13693f` | `#e5ebe8` |
| `--text-on-card-brand` | `#e5ebe8` | `#e5ebe8` |
| `--text-on-accent` | `#0b0b0b` | `#0b0b0b` |
| `--text-on-primary` | `#e5ebe8` in tokens, **`#0b0b0b` on the live shell** | same override |
| `--border-structural` | `#7b7170` | `#7b7170` |
| `--border-default` | `rgba(0,0,0,0.3)` | `rgba(255,255,255,0.3)` |
| `--border-subtle` | `rgba(0,0,0,0.12)` | `rgba(255,255,255,0.14)` |
| `--border-focus` | `#feca09` | `#feca09` |
| `--overlay-backdrop` | `rgba(0,0,0,0.6)` | same |
| `--overlay-hero` | `rgba(0,0,0,0.55)` | same |

Brand cards (`--card-fill-brand`) stay emerald in both themes. That fixedness is intentional for goal cards and the inquiry form.

### 3.3 Contrast rules

- Dark Emerald on white is safe at body size. Dark Emerald on black is not used for UI text — dark mode `--text-headline` is light mint (`#8ee4b5`). Questions, labels, and paragraphs use `--text-body` (the off-white), and section headings use Bright Amber via `--text-section-heading`.
- Text on emerald chrome (nav, footer, admin bar, chat header, drawer header) is `--white` (`#e5ebe8`) or white at 75–94% opacity for secondary lines. Amber is the hover and the column label on the footer.
- Text on Harvest Orange and Bright Amber is `--black`.
- Dim Grey is a border color. It is never a fill and never the page background.
- Orange and amber do not sit on the same control at the same time. Amber means selected or focused. Orange means the primary action (after the shell override).

### 3.4 Shell accent override (required)

Token defaults set `--accent-primary` to Dark Emerald and `--accent-hover` to Harvest Orange. The live app **replaces those on `body`**:

```css
body {
  --accent-primary: var(--harvest-orange); /* #f78021 */
  --accent-hover: #c2600f;
  --text-on-primary: var(--black);         /* #0b0b0b */
}
```

Anything that reads `--accent-primary` (default buttons, text links, progress fill) is therefore orange with black text. Hover darkens to `#c2600f`.

`onDark` buttons (hero, any control sitting on emerald or a photo) ignore that resting fill and use Bright Amber instead. See Buttons.

### 3.5 Backgrounds and imagery

- Page background is a flat token color. No page-wide gradients, grain, or patterns.
- The homepage hero is the one photograph: full-bleed inside a 16px-radius frame, covered by `--overlay-hero`, with a 22px four-color stripe along the bottom edge. Stripe segments, left to right: `--dark-emerald`, `--emerald-400`, `--harvest-orange`, `--bright-amber`. The stripe sits above the overlay so the colors stay true.
- Admin skeleton loaders use a shimmer between `--surface-1` and `--surface-2`.
- Summary bar tracks add a 25% repeating grid line (`rgba(0,0,0,0.06)` light, `rgba(255,255,255,0.08)` dark).

---

## 4. Typography

Two weights only: **400** and **700**. A third weight is drift. (The language toggle uses `font-weight: 600` on its pills; treat 700 as the standard for new bold UI.)

| Role | Family | Size | Weight | Line height | Tracking | Case |
| --- | --- | --- | --- | --- | --- | --- |
| Hero wordmark | Poppins | `clamp(44px, 11vw, 92px)` | 700 | 1 | `0.01em` | As drawn: ReCARES |
| H1 | Open Sauce One | 32px, often `clamp(24px, 6vw, 32px)` | 700 | 1.25 | normal | Sentence |
| H2 / section heading | Open Sauce One | 24px, often `clamp(20px, 4.5vw, 24px)` | 700 | 1.3 | `0.04em` | Uppercase |
| H3 | Open Sauce One | 18px | 700 | 1.4 | normal | Sentence unless it is a card title |
| Card title | Lato | 15px | 700 | 1.35 | `0.06em` | Uppercase |
| Body | Lato | 16px | 400 | 1.55 | normal | Sentence |
| Admin lead | Lato | 15px | 400 | 1.55 | normal | Sentence |
| Label | Lato | 14px | 700 | 1.4 | normal | Sentence, or uppercase when it is a button |
| Caption | Lato | 14px (12–13px for meta) | 400 | 1.5 | normal | Sentence |
| Eyebrow | Lato or Open Sauce One | 13px | 700 | — | `0.12em` | Uppercase |
| Button | Lato | 14px | 700 | — | `0.06em` | Uppercase |
| Nav link | Lato | 13px (12px on the desktop survey pill) | 700 | — | `0.08em` | Uppercase |

Families:

```css
--font-sans: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-title: 'Open Sauce One', 'Lato', sans-serif;
```

Load Lato 400 and 700, Poppins 700 (hero wordmark only), and Open Sauce One 400 and 700. Headings `h1–h3` use `--font-title`. UI controls, body, and nav use `--font-sans`.

Hero wordmark letter colors, in order: white, white, `--emerald-400`, `--harvest-orange`, `--harvest-orange`, `--bright-amber`, white. Each letter rises in with a 60ms stagger (section 7).

The logo image is separate from this wordmark. Use the SVG that matches the surface behind it (section 9).

---

## 5. Spacing, layout, radii, elevation

### 5.1 Space scale

Base unit 8px. Named steps:

| Token | Value |
| --- | --- |
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 16px |
| `--space-4` | 24px |
| `--space-5` | 32px |
| `--space-6` | 48px |
| `--space-7` | 64px |
| `--section-gap` | 96px |
| `--card-padding` | 32px |

Page padding is fluid: horizontal `clamp(16px, 4vw, 32px)`, vertical section padding `clamp(48px, 8vw, 96px)`. Gaps between cards are `clamp(16px, 2.4vw, 24px)`.

### 5.2 Columns

| Context | Max width | Alignment |
| --- | --- | --- |
| Homepage sections, footer, admin dashboard | 1120px | Centered, `margin: 0 auto` |
| Survey, thank-you, consent | 720px | Centered |
| Hero copy block | 820px, paragraph 620px | Centered in the photo |
| Auth card (login / signup) | 440px | Centered, page min-height about 80vh |
| Modal | 420px, width 90% | Centered in the viewport |
| Admin drawer | `min(420px, 100%)` | Anchored to the right edge |
| Mobile nav drawer | `min(320px, 88vw)` | Anchored to the right edge |
| FAQ sidebar | 240–340px, flex basis 300px | Sticky `top: 72px` |
| Chat panel | `min(360px, 100vw - 32px)` | Fixed bottom-right |

Goal cards flex at `1 1 240px`. Info cards are full width of the column with a 220px icon slot beside the text (the slot drops under the card below 640px).

Anchor targets `#about`, `#faq`, and `#contact` use `scroll-margin-top: 72px` so the sticky bar does not cover the heading.

### 5.3 Breakpoints

| Width | What changes |
| --- | --- |
| `max-width: 767px` | Resident nav becomes a hamburger and right drawer. Admin response table hides; stacked response cards show. |
| `max-width: 640px` | Info-card icon slot goes full width. Horizontal bar chart rows stack to one column. |
| `max-width: 480px` | Chat and scroll-to-top insets tighten from 20px to 16px. Chat panel uses `100vw - 32px` and up to 70vh tall. |

There is no separate tablet grid. `clamp()` and `flex-wrap` / `auto-fit` cover the middle sizes. Admin stat cards use `repeat(auto-fit, minmax(180px, 1fr))`. Chart cards use `minmax(260px, 1fr)`.

### 5.4 Radii

| Token / use | Value |
| --- | --- |
| `--radius-sm` | 8px — buttons, inputs, selects, logout, toasts’ inner controls |
| `--radius-checkbox` | 4px |
| FAQ row | 12px |
| `--radius-md`, `--radius-card`, Likert cards, hero frame, admin panels | 16px |
| `--radius-lg` | 20px — modal |
| Nav “Start the survey”, language pills, theme toggle, icon menus, pager | 999px (pill) |
| Chat FAB | 14px |
| Chat panel | 16px |
| Scroll-to-top | 12px |
| Progress and chart tracks | 999px, except Forms-style bars which use 2px |

### 5.5 Elevation

```css
--shadow-card: 0 2px 8px rgba(0, 0, 0, 0.18);
--shadow-modal: 0 12px 32px rgba(0, 0, 0, 0.35);
--shadow-focus-ring: 0 0 0 2px var(--bright-amber);
```

Also used:

- Sticky nav after 8px of scroll: `0 4px 18px rgba(0,0,0,0.28)`
- Admin top bar: `0 4px 18px rgba(0,0,0,0.22)`
- Scroll-to-top: `0 8px 24px rgba(0,0,0,0.14)`
- Chat FAB: `0 10px 28px rgba(19,105,63,0.35)`
- Chat panel: `0 16px 40px rgba(0,0,0,0.18)`
- Drawer: `-12px 0 40px rgba(0,0,0,0.18)`
- Undo snackbar: `0 12px 32px rgba(0,0,0,0.28)`

Borders are 1px. Cards on the homepage often rely on fill plus radius; admin cards add `1px solid var(--border-subtle)` and `--shadow-card`. Colored left-edge accents are unused.

### 5.6 Z-index

| Layer | z-index |
| --- | --- |
| Modal | 100 |
| Admin undo snackbar | 90 |
| Admin drawer | 80 |
| Mobile nav overlay | 60 |
| Resident navbar | 50 |
| Chat widget | 41 |
| Scroll-to-top | 40 |
| Admin top bar | 30 |
| Dropdown menus inside admin | 20 |

Floating utilities sit at the bottom-right: scroll-to-top is `56px + 12px` to the left of the 56px chat button (10px gap on small screens). Both clear the footer because they are `position: fixed`.

---

## 6. Interaction states

### Focus

`:focus-visible` on buttons, links, inputs, selects, and textareas:

- `outline: 2px solid var(--border-focus)` (amber)
- `outline-offset: 2px`
- `box-shadow: var(--shadow-focus-ring)`

Mouse focus does not show that ring (`:focus:not(:focus-visible) { outline: none }`).

### Hover and press

- Primary button resting fill is `--accent-primary` (orange on the shell). Hover fill is `--accent-hover`. Text becomes `--text-on-accent` (black) on hover.
- `onDark` primary rests on `--accent-selected` (amber) with black text, and hovers to `--accent-hover`.
- Hero primary (the amber one) also lifts `translateY(-1px)` and gains an amber glow: `0 0 0 1px rgba(254,202,9,0.35), 0 8px 22px rgba(254,202,9,0.35)`. Press scales to `0.98`.
- Hero secondary brightens (`filter: brightness(1.15)`) and its border and label shift to amber.
- Secondary buttons elsewhere keep a transparent fill and a 1px border. On emerald, border and text are white at about 70% (`rgba(255,255,255,0.7)`).
- Ghost buttons have no border, amber text, horizontal padding 8px. Hover fills `--surface-2`.
- `.lift` cards move `translateY(-4px)` on hover. Goal cards also pick up `--shadow-card`. In dark mode the goal-card title shifts to amber on hover.
- Nav and footer links turn amber on hover. They have no underline in the nav. Footer links that are sentences stay underlined with `text-underline-offset: 3px` or `4px`.
- Disabled controls use `opacity: 0.5` (buttons) or `0.45` (admin actions, chat send) and `cursor: not-allowed`.
- Pressed admin actions and the chat FAB scale to `0.98` or `0.96`.

### Selection

Checked checkbox, selected Likert point, active language pill, and active nav link use Bright Amber with black text or icon. Unselected Likert and checkbox use `--surface-1` plus a `--border-default` outline.

---

## 7. Motion

Default timing token: `--motion-duration: 220ms` and `--motion-ease: ease-in-out`. Stay inside 160–280ms for UI, up to 460ms only for the hero wordmark. No bounce, spring, or overshoot.

| Motion | Spec |
| --- | --- |
| `riseIn` | Opacity 0→1 and `translateY(14px)`→0. Hero letters 460ms, staggered 60ms. Cards and drawers often 240–360ms. |
| `.reveal` | Same 14px rise, 260ms, triggered when the block enters the viewport. |
| Hero stripe | Each segment `scaleX(0)`→`1` from the left, 280ms, delays 0/60/120/180ms. |
| FAQ panel | `max-height` 280ms, opacity 220ms. Chevron rotates 180° in 240ms. |
| FAQ CTA pulse | Amber ring pulses twice over 1.1s when the FAQ scrolls into view (threshold 0.2), once per page view. |
| Theme icon | 200ms rotate to 180° with a brief 1.08 scale at the midpoint. |
| Chart fills | Width transition 560ms. |
| Accordion / button color | 220ms ease-in-out. |

`prefers-reduced-motion: reduce` collapses animation and transition durations to 1ms, disables reveal offsets, hero glow, FAQ pulse, stripe scale, theme spin, chat pulse, and smooth scrolling (`scroll-behavior` returns to `auto`). Smooth scroll is otherwise on for `html` and for in-page nav.

---

## 8. Components

Shared primitives live as small React components, styled with the tokens above. Recreate the look in whatever framework the other repo uses; the measurements are what must match.

### Button

Inline flex, centered, `gap: 8px`, `padding: 0 20px`, radius 8px, uppercase Lato 14/700 tracking `0.06em`. `white-space: nowrap`. Can be a link or a `<button>`.

| Size | Height |
| --- | --- |
| `md` (default) | 44px |
| `sm` | 40px |

| Variant | Resting | Hover |
| --- | --- | --- |
| `primary` | Fill `--accent-primary`, text `--text-on-primary` | Fill `--accent-hover`, text black |
| `primary` + `onDark` | Fill amber, text black | Fill `--accent-hover`, text black |
| `secondary` | Transparent, 1px `--border-default`, body text | Same fill; hero secondary shifts border and label to amber via CSS |
| `secondary` + `onDark` | Transparent, 1px `rgba(255,255,255,0.7)`, white text | Hero rule above |
| `ghost` | Transparent, amber text, padding `0 8px` | Background `--surface-2` |
| `fullWidth` | `width: 100%` | — |
| disabled | Opacity 0.5, `not-allowed` | No hover color change |

Minimum width equals the height so icon-only buttons stay square.

### Input and select

- Column, `gap: 6px`, width 100%.
- Label: 14px/700, body color, red `*` when required (`aria-label="required"`).
- Helper text above the control: 14px, caption color, line-height 1.5.
- Control: height 44px, padding `0 14px`, radius 8px, background `--surface-2`, border `1px solid transparent`. Error border is `1px solid var(--error-red)`. Error message under the field is caption size in `--status-error`.
- Select uses `appearance: none`. Placeholder option is disabled and hidden; the closed control uses caption color until a value exists.
- On a brand-fill form (`data-inq` or `data-auth`), placeholders are `rgba(229,235,232,0.78)`. Auth inputs set `color` and `caret-color` to `--white`.

Inquiry form re-scopes tokens on the emerald card so the same Input works on brand fill:

- `--text-body: var(--white)`
- `--surface-2: rgba(255,255,255,0.14)`
- `--text-caption: rgba(255,255,255,0.75)`
- `--error-red` and `--status-error: var(--bright-amber)` (errors on emerald are amber, so they stay visible)

### Checkbox

Hit area at least 44px tall. Box is 24×24, radius 4px. Unchecked: `--surface-1` plus `--border-default`. Checked: amber fill, black `✓` at 15px/700. Label is 16px body color, `gap: 10px`. The native input is visually hidden; the whole label is the control.

### Likert scale

Card: `--surface-1`, radius 16px, `--shadow-card`, padding `clamp(20px, 3vw, 32px)`, `riseIn` 360ms.

Question is 18px/700, line-height 1.4. Optional subtext is 14px caption with 8px top and 20px bottom margin.

Five equal buttons in a row, `gap: 8px`, each height 44px, radius 8px, number centered. Selected: amber, black text, no border. Unselected: `--surface-1`, body text, 1px `--border-default`. Endpoint labels (first and last only) sit under the row, caption size, 6px margin, space-between.

### Progress bar

Track height 8px, radius 999px, fill `--surface-1`. Fill is `--accent-primary` (orange on the shell) and animates width over 220ms. Value is clamped 0–100.

### Cards

| Kind | Fill | Title | Body | Notes |
| --- | --- | --- | --- | --- |
| Info card | `--card-fill-neutral` | Uppercase section heading, 24px, `--text-section-heading`, 16px below | 16px `--text-on-card-neutral`, line-height 1.55 | Padding 32px. Icon slot 220px, transparent background, vertically centered. `iconSide` left or right. |
| Goal card | `--card-fill-brand` | Uppercase 15px white, tracking `0.06em` | 16px white, line-height 1.55 | Lucide icon 28px, stroke 2, white, 14px below the icon. Hover lifts and, in dark mode, title turns amber. |
| Generic `Card` | `--surface-1` | — | body color | Radius 16px, shadow card, padding defaults to 24px. |
| Survey / consent cards | `--card-fill-neutral` or `--surface-1` | 16px/700 headline color | 15px / 1.55 | Radius 16px. Consent cards also get a subtle border. |
| Contact choice card | `--card-fill-neutral` | — | — | Radius 16px, padding `clamp(20px, 3vw, 32px)`, column gap 14px. |
| Admin panel / stat / chart | `--card-fill-neutral` | See admin type | caption meta | Radius 16px, subtle border, card shadow. |

Pending survey copy uses a dashed `--border-structural` box, radius 8px, caption text, padding `clamp(16px, 3vw, 24px)`.

### FAQ accordion

Single panel open at a time (the first item starts open). Row radius 12px, resting fill `--card-fill-neutral`, hover fill `--card-fill-accordion-open` when closed. Header button min-height 48px, padding `14px 18px`, uppercase 14px/700, tracking `0.05em`, color `--text-section-heading`. Chevron 20px, stroke 2.4. Answer padding `0 18px 16px`, 15px, line-height 1.55, sentence case, `--text-on-card-neutral`.

Keyboard: Arrow Up/Down move focus between headers, Home/End jump to the ends. `aria-expanded` and `aria-controls` are set. The sidebar beside the list is sticky and holds three fact rows plus a full-width “Start the survey” button.

Sidebar fact rows use a 4px colored bar (orange, amber, emerald) as a marker next to a short title and a 15px sentence. That bar is the one place a color stripe marks a list item.

### Modal

Fixed inset overlay, `--overlay-backdrop`, flex center, z-index 100. Panel: `--surface-3`, 1px `--surface-3-border`, radius 20px, `--shadow-modal`, padding 32px, max-width 420px, width 90%. Clicking the backdrop closes; clicks inside the panel do not.

### Language toggle

Two pills, `gap: 8px`, height 40px, padding `0 20px`, radius 999px. Active: amber fill, black text. Inactive: `--surface-1`, body text. Labels are “EN” / “FIL” or “English” / “Filipino”. On the resident site this control lives on the consent step, not in the navbar or footer.

### Theme toggle

36×36 on dark chrome, 40×40 on light surfaces, pill, 1px border. On emerald the border is `rgba(255,255,255,0.55)` and the icon is white; hover fills `rgba(255,255,255,0.14)` and the border goes solid white. On a light surface the border is `--border-default` and hover fills `--surface-2`. Icon is an 18×18 moon, stroke 1.8. `aria-label` is “Dark mode” or “Light mode” depending on the current theme. Click spins the icon (section 7).

### Navbar (resident)

Sticky, full width, z-index 50, background `--dark-emerald` in both themes, min-height 56px, padding `0 clamp(12px, 3vw, 28px)`. Logo 40px, `surface="dark"`.

Desktop links: Home, About (`/#about`), FAQ (`/#faq`). Active section is amber; others are white. Survey pill: white fill, emerald text, height 36px, padding `0 18px`, pill radius, 12px uppercase.

Scroll spy uses a marker at `scrollY + 88`. Past the contact band, FAQ stays active. In-page clicks smooth-scroll and respect reduced motion.

Below 768px the links move into a right drawer (emerald, padding `20px 20px 32px`, shadow modal). Drawer links are 48px tall with a `rgba(255,255,255,0.14)` bottom border. The survey pill becomes 44px tall and full width of the drawer content. Escape closes, Tab cycles inside, body scroll locks, focus returns to the menu button. Menu button is 40×40, radius 8px, white icon, border `rgba(255,255,255,0.55)`.

### Footer

Emerald band, top margin `clamp(48px, 8vw, 96px)`, padding `clamp(32px, 5vw, 56px)` horizontal `clamp(16px, 4vw, 32px)`. Three columns, flex basis 230px, gap `clamp(24px, 3.5vw, 44px)`, inside the 1120px column.

- Column titles: amber, Open Sauce One, 14px/700, tracking `0.12em`, uppercase.
- Body: `rgba(255,255,255,0.94)`, 16px, line-height 1.65.
- Logo 56px, dark surface.
- “Proponent access” is an uppercase underlined link at 14px, `rgba(255,255,255,0.8)`, tracking `0.08em`, pointing at `/admin/login`. It is the only admin entry on the resident site.
- Bottom rule: `1px solid rgba(255,255,255,0.22)`, then a centered 14px line at 75% white.

### Admin top bar

Sticky, z-index 30, min-height 64px, padding `12px clamp(16px, 4vw, 32px)`, emerald, shadow as in 5.5. Wordmark “ReCARES Survey” is 20px/700 white, tracking `0.04em`, no logo image. Subtitle is 13px/700 uppercase, tracking `0.12em`, white at 75%. Logout is 40px tall, radius 8px, transparent, 1px `rgba(255,255,255,0.7)`, uppercase 14px. Email sits beside it at 14px, 75% white.

If the admin language pill is set to Filipino, a full-width amber banner (`--bright-amber`, black 14px text, radius 8px, max-width 1120px) says translations are pending. Admin UI copy stays English.

### Admin dashboard

Inner padding `clamp(20px, 3vw, 32px)` horizontal `clamp(16px, 4vw, 32px)`, bottom `clamp(48px, 8vw, 96px)`, max-width 1120px.

- Section title: Open Sauce One, `clamp(24px, 3vw, 32px)` / 700, `--text-headline`. Secondary titles `clamp(20px, 2.4vw, 24px)`.
- Lead: 15px caption, max-width 62ch, 8px above, 20px below.
- Stat value: 32px/700, line-height 1.1, headline color. Label above it: 13px/700 uppercase, tracking `0.06em`, caption color.
- Chart title: 15px/700 uppercase, tracking `0.04em`, `--text-section-heading`.
- Tracks are 8px, pill shaped. Emerald fill for distribution bars, orange for gate strips, amber for Likert means.
- Table: min-width 860px, 14px cells, 12px uppercase headers, caption color, tracking `0.06em`. Row flash uses `rgba(254,202,9,0.22)`. Below 768px the table is replaced by 12px-radius cards on `--surface-1`.
- Chips: height 24px, padding `0 8px`, radius 6px, 12px/700. Sensitive chips use an orange border and `rgba(247,128,33,0.12)` fill.
- Danger actions: `--status-error` text and border; hover `rgba(214,69,69,0.08)`.
- Empty state: 18px/700 title, 14px caption body, a 40px uppercase outline button.
- Drawer header is emerald with white type; body padding 18px; definition lists use 11px uppercase captions.
- Undo snackbar: fixed, centered, 24px from the bottom, emerald, radius 12px, white  text, amber uppercase Undo button.

Tabs (response views): 14px/700, padding `12px 16px`, inactive caption color, active headline color with a 3px bottom border in the headline color. The tab list sits on a 1px subtle bottom border.

### Chat and scroll-to-top

Scroll-to-top: 48×48, radius 12px, `--card-fill-neutral`, subtle border, hidden until scrolled (`opacity` and `translateY(8px)`). Appears with `data-visible="true"`.

Chat button: 56×56, radius 14px, emerald, white icon, hover `--emerald-700`. Panel header matches the admin drawer header (emerald, uppercase 16px title, 12px subtitle at 78% of `--white`). Bot bubbles: neutral card, subtle border, left aligned. User bubbles: emerald, white, right aligned. Both max-width 88%, radius 12px, 14px type. Composer input radius 10px on `--surface-2`. Send button 44×44, orange, black icon, hover amber. Live mic is orange with a pulse ring `rgba(247,128,33,0.45)`.

### Logo

| `surface` | Asset | Use on |
| --- | --- | --- |
| `dark` | `logo-darkmode.svg` | Emerald or black (nav 40px, footer 56px) |
| `light` | `logo-lightmode.svg` | Page background `#e5ebe8` |
| `favicon` | `logo-favicon.svg` | Compact mark on light cards (About, 200px on the homepage) |

`alt` text is “ReCARES Survey”. Match the asset to the background. On theme-aware page surfaces, use the dark asset when `data-theme="dark"` and the light or favicon asset when light.

---

## 9. Iconography

Library: [Lucide](https://lucide.dev/) (`lucide-react`), outline style, stroke width 2 (2.4 on the FAQ chevron). Color follows the text of the surface: white on emerald cards, `--text-section-heading` on FAQ headers, body color elsewhere. Active or selected icons may use amber.

Icon slots stay transparent. A fixed light tile behind an icon will read as a bright rectangle on the dark theme.

Icons should name the subject (shield, accessibility, map pin, menu, close, chevron). Decorative icons are `aria-hidden`. The control that contains them keeps a text label or `aria-label`.

---

## 10. Page patterns

### Resident homepage

1. **Hero** inside the 1120px column, top padding `clamp(16px, 3vw, 32px)`. Photo frame min-height `clamp(420px, 62vh, 560px)`, radius 16px, overlay, stripe, centered wordmark, amber subtitle (“Community needs assessment survey”), white eyebrow, white 16px paragraph, then amber primary and white-outline secondary CTAs (`onDark`).
2. **About** after `clamp(48px, 8vw, 96px)` of space. Two full-width info cards (survey purpose with the Camella mark on the right, About us with the favicon mark on the left).
3. **Goals** — uppercase section heading, then three goal cards.
4. **FAQ** — accordion plus sticky sidebar.
5. **Contact band** — `--surface-1` background, top border `--border-subtle`, padding `clamp(48px, 8vw, 96px)` top. Two-column wrap: choices card (`flex 1 1 260px`) and emerald inquiry form (`flex 1.4 1 380px`).

Blocks below the hero reveal on scroll, with optional 80ms or 160ms delay so a row staggers.

### Survey

720px column. Consent gate first: language pills, “Leave the survey” caption link, H1, terms card, privacy card, required acknowledgment checkbox, Continue button (disabled until checked).

After consent: eyebrow “Step N of M”, the same leave link, progress bar, H1, 14px intro. Each question group is a 16px-radius surface card with 20px vertical rhythm (`margin-top: 28px`, `gap: 20px`). Likert, checkboxes, and selects use the component rules above. Submit leads to a thank-you page in the same 720px column.

### Admin auth

Centered column, max-width 440px, card radius 16px, padding `clamp(20px, 3vw, 32px)`, heading `clamp(20px, 5vw, 24px)`. The card enters with `riseIn` 420ms. Inputs follow the auth placeholder rule when the card is emerald (`data-auth`).

---

## 11. Accessibility checklist

- Minimum target 44px for primary actions, inputs, selects, checkboxes, Likert points, and the mobile survey pill. Admin row actions may be 40px; chips and the desktop survey pill are smaller and are not the main tap path.
- Focus ring is always amber, 2px, offset 2px, and only for keyboard focus.
- Modals, the mobile drawer, and the admin drawer trap or restore focus and close on Escape (drawer and mobile nav) or backdrop click (modal).
- `aria-expanded`, `aria-controls`, `aria-invalid`, `aria-describedby`, and `role="alert"` on field errors.
- `lang` on `<html>` follows the active language where a single language is in force. Mixed pages keep `en` at the document and translate the visible strings.
- Reduced motion is mandatory (section 7).
- Hero photo has a descriptive `alt`. Decorative stripes and wordmark animations are `aria-hidden` or purely visual.
- Do not rely on emerald body text in dark mode (section 3.3).

---

## 12. CSS to copy

Drop this in the other project’s global stylesheet, then add the component classes you actually use. The shell override at the bottom is what makes buttons orange.

```css
:root {
  --black: #0b0b0b;
  --white: #e5ebe8;
  --dark-emerald: #13693f;
  --harvest-orange: #f78021;
  --bright-amber: #feca09;
  --dim-grey: #7b7170;
  --error-red: #d64545;

  --page-bg: var(--white);
  --surface-1: #f4f4f4;
  --surface-2: #eaeaea;
  --surface-3: var(--white);
  --surface-3-border: rgba(0, 0, 0, 0.12);
  --card-fill-neutral: #ffffff;
  --card-fill-brand: var(--dark-emerald);
  --card-fill-accordion-open: rgba(0, 0, 0, 0.09);

  --text-headline: var(--dark-emerald);
  --text-body: var(--dark-emerald);
  --text-caption: rgba(0, 0, 0, 0.7);
  --text-section-heading: var(--dark-emerald);
  --text-on-card-neutral: var(--dark-emerald);
  --text-on-card-brand: var(--white);
  --text-on-accent: var(--black);
  --text-on-primary: var(--white);

  --accent-primary: var(--dark-emerald);
  --accent-hover: var(--harvest-orange);
  --accent-selected: var(--bright-amber);

  --border-structural: var(--dim-grey);
  --border-default: rgba(0, 0, 0, 0.3);
  --border-subtle: rgba(0, 0, 0, 0.12);
  --border-focus: var(--bright-amber);
  --status-error: var(--error-red);
  --overlay-backdrop: rgba(0, 0, 0, 0.6);
  --overlay-hero: rgba(0, 0, 0, 0.55);

  --emerald-900: #0f5a35;
  --emerald-800: #13693f;
  --emerald-700: #1b7c4c;
  --emerald-600: #227e52;
  --emerald-500: #2a9a63;
  --emerald-400: #3db579;

  --font-sans: 'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-title: 'Open Sauce One', 'Lato', sans-serif;

  --text-h1-size: 32px;
  --text-h2-size: 24px;
  --text-h3-size: 18px;
  --text-body-size: 16px;
  --text-label-size: 14px;
  --text-caption-size: 14px;
  --text-button-size: 14px;
  --text-button-weight: 700;
  --text-button-tracking: 0.06em;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 32px;
  --space-6: 48px;
  --space-7: 64px;
  --content-max-width: 1120px;
  --content-max-width-form: 720px;
  --section-gap: 96px;
  --card-padding: 32px;

  --radius-sm: 8px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-checkbox: 4px;
  --radius-card: 16px;
  --touch-target-min: 44px;

  --motion-duration: 220ms;
  --motion-ease: ease-in-out;
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.18);
  --shadow-modal: 0 12px 32px rgba(0, 0, 0, 0.35);
  --shadow-focus-ring: 0 0 0 2px var(--bright-amber);
}

[data-theme='dark'] {
  --page-bg: var(--black);
  --surface-1: #141414;
  --surface-2: #1f1f1f;
  --surface-3: #262626;
  --surface-3-border: rgba(255, 255, 255, 0.12);
  --card-fill-neutral: #2a2a28;
  --card-fill-accordion-open: rgba(255, 255, 255, 0.14);
  --text-headline: #8ee4b5;
  --text-body: var(--white);
  --text-caption: rgba(255, 255, 255, 0.7);
  --text-section-heading: var(--bright-amber);
  --text-on-card-neutral: var(--white);
  --border-default: rgba(255, 255, 255, 0.3);
  --border-subtle: rgba(255, 255, 255, 0.14);
}

body {
  background: var(--page-bg);
  color: var(--text-body);
  font-family: var(--font-sans);
  /* Live shell: orange primary, black label, darker orange hover */
  --accent-primary: var(--harvest-orange);
  --accent-hover: #c2600f;
  --text-on-primary: var(--black);
}

h1, h2, h3 { font-family: var(--font-title); }

:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
  box-shadow: var(--shadow-focus-ring);
}
```

---

## 13. Known tensions to keep stable

These are already shipped. Matching them keeps the next site consistent with this one.

- Token defaults say the primary accent is emerald. The body override makes the visible primary orange. Copy both, or buttons will not match.
- `--white` is `#e5ebe8`, the page canvas, not pure white. Pure white is `--card-fill-neutral` in light mode.
- Headlines use light mint (`#8ee4b5` via `--text-headline`) in dark mode — Dark Emerald is not readable on near-black at UI sizes. Section headings switch to amber. Body copy switches to off-white.
- Resident chrome (nav and footer) stays emerald in both themes. The page behind them is what flips.
- Goal cards and the inquiry form stay emerald in both themes.
- Admin copy is English even when the language pill is present.
