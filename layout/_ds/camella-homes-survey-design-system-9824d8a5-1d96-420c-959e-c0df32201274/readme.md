# ReCARES — Camella Homes Tibig Resident Survey Design System

## Overview

**ReCARES** is a **community needs assessment survey website** for residents of **Camella Homes Tibig, Lipa City** — a student capstone project built with the Camella Homes Tibig Homeowners Association. It collects feedback from two respondent tracks, **homeowners** and **tenants**, through a multi-section form using Likert scales, checkboxes, and dropdowns, in English and Filipino.

There are two audiences and they are deliberately kept apart: **residents** taking the survey, and **proponents** managing responses through a CRUD admin panel. Resident-facing navigation carries only resident links; Sign Up / Login live in the footer.

Primary users include people with limited digital literacy, older homeowners, and PWD/physically-hindered residents. Clarity always beats decoration.

**Source material:** built from a written brand/design brief provided directly by the user, revised twice — first from a dark-only theme to light + dark mode, then to **v3**, which documents what the built homepage established and lists corrections to apply. No Figma file, codebase, slide deck, logo file, photograph, or icon set was ever attached. Everything visual here traces to those written briefs; placeholders are labeled as such rather than invented.

## Components

**Forms** — `Button`, `Input`, `Select`, `Checkbox`, `LikertScale`
**Content** — `InfoCard`, `GoalCard`, `StatRow`, `FaqList`
**Feedback** — `ProgressBar`, `Modal`
**Layout** — `Card`, `Footer`
**Navigation** — `NavBar`, `LanguageToggle`

### Intentional additions
The brief describes controls in prose rather than naming components. Each of the above implements something the brief specifies directly (v3 §4 component specifications and §5 buttons). Nothing was added that the brief doesn't call for — no Toast, Tabs, or Avatar.

## Index

- `styles.css` — root stylesheet, imports everything below
- `tokens/colors.css`, `typography.css`, `spacing.css`, `shadows.css` — design tokens
- `guidelines/` — foundation specimen cards (base palette, surfaces, card fills, semantic states, contrast rule, heading rule, type scale, uppercase treatments, spacing, radii, brand, do/don't)
- `components/forms/`, `content/`, `feedback/`, `layout/`, `navigation/` — reusable primitives
- `ui_kits/recares-homepage/` — recreation of the resident homepage (nav, hero, info cards, goals, FAQ + sidebar, inquiry form, footer) with a light/dark toggle
- `ui_kits/survey-website/` — click-through survey flow: landing → language/privacy modal → question section → confirmation
- `SKILL.md` — portable skill definition for use in Claude Code

## Content fundamentals

- **Tone:** plain, respectful, instructional — a community notice, not a marketing page. Copy tells the resident what to do next.
- **Voice:** direct address to the resident ("your household," "your responses"). The research team says "we" sparingly, only in About Us and the inquiry form.
- **Casing is a system, not a preference.** Sentence case for headlines, subtitles, and body copy. **Uppercase** for eyebrow labels, section headings, card titles, and button labels. Never uppercase a body paragraph.
- **One canonical label per action.** The survey CTA is "START THE SURVEY" everywhere it appears — hero, sidebar, and any future placement. Variants like "Take the survey" are a bug, not a synonym.
- **Bilingual by design:** every string exists in English and Filipino, toggled by the language pill, including error messages and button labels.
- **No emoji.** Line icons only, per the iconography rules.
- **Accessibility in language:** required fields and errors are always labeled in words ("This field is required"), never signaled by color alone.
- **Example pairs:** EN "Before we start" / FIL "Bago magsimula" · EN "Continue" / FIL "Magpatuloy" · EN "Thank you." / FIL "Salamat!"

## Visual foundations

**Color:** light and dark mode via a `data-theme="light"|"dark"` attribute (light is the default). Page canvas is White in light mode, near-black `#0B0B0B` in dark mode, with a per-mode surface ramp behind cards, inputs, and modals.

Dark Emerald `#13693F` carries the brand and is the **primary accent** — primary buttons and the progress-bar fill are Emerald with white text. Harvest Orange `#F78021` is the **hover** color (primary buttons swap to Orange with dark text on hover). Bright Amber `#FECA09` marks **selected/active state** — checked checkbox, selected Likert point, active nav link, active language pill, focus outline. Orange and Amber never appear on the same element at once. Dim Grey `#7B7170` is for **borders and dividers only** — never a fill, never a page background.

**Emerald-on-Emerald:** because the primary accent and `--card-fill-brand` are the same colour, a default primary button vanishes on a brand-fill card. Pass `onDark` to `Button` on any Emerald or dark ground (hero overlay, goal cards, inquiry form) — primary then fills Bright Amber with dark text, secondary inverts to white text and outline.

> v3's token table lists `--accent-primary` as Harvest Orange, which contradicts the later instruction to lead with green. This system implements **green primary / orange hover**; if v3's table is authoritative, swap `--accent-primary` and `--accent-hover` in `tokens/colors.css` and nothing else needs to change.

**Two colour rules to enforce above all others:**
1. **Dark Emerald contrast rule.** Emerald-on-black reaches only ~3.1:1, which clears the bar for large/bold text but fails AA for body copy. In dark mode, restrict Emerald to large or bold text (18px+ bold, 24px+ regular). Regular-size questions, labels, and paragraphs use White. In light mode Emerald is safe at any size (~6.7:1 on white). See `guidelines/contrast-rule.html`.
2. **Section heading rule.** Section headings ("What is this survey for?", "About Us", "Goals of this study") are Dark Emerald in light mode and **Bright Amber** in dark mode — not white, not Emerald. Encoded as `--text-section-heading` so future sections inherit it automatically. See `guidelines/heading-rule.html`.

Card fills are their own axis: `--card-fill-neutral` (beige `#DCDCCE` light / charcoal `#2A2A28` dark) for info and FAQ cards, and `--card-fill-brand` (Emerald, **identical in both modes**) for goal cards and the inquiry form. Goal cards deliberately do not flip with the page background; that fixedness is intentional.

A muted red `#D64545` exists for form validation errors only and is still **pending confirmation** — it falls outside the original brand set and has not been used in the built homepage.

**Type:** one typeface — Plus Jakarta Sans, a humanist sans with Filipino diacritic support. **Exactly two weights: 400 body, 700 everything bold.** A third weight would be drift. Scale runs H1 32 → H2 24 → H3 18 → Body 16 → Label/Caption 14, with body line-height at 1.5–1.6 for older and second-language readers. The "ReCARES" wordmark is a multi-color-per-letter logotype and is not a reusable text token.

**Spacing & layout:** 8px base unit, scale 4/8/16/24/32/48/64. Content sits in a centered column — 1120px for marketing/homepage sections, 720px for form-dominant views — with consistent 32px side padding. One consistent 96px vertical gap between major sections, and one consistent card padding value regardless of whether a card holds a paragraph, stat rows, or a form.

**Corner radii:** 8px buttons and inputs, **16px for all card types** (info, goal, form, FAQ rows share one rounding), 20px modal, 4px checkbox. The only pill is the language toggle, which is a pill to read as a two-state switch.

**Backgrounds:** flat colour, with two exceptions from the built homepage — the hero's full-width photograph with a dark overlay for legibility, and a narrow four-color stripe (dark green, light green, orange, amber) banding the hero's lower edge as a graphic accent. The stripe sits above the overlay so its colours stay true; do not spread it across the whole hero background, where the overlay muddies orange and amber into brown and olive. No gradients, textures, patterns, or grain anywhere else.

**Motion:** 200–250ms, ease-in-out, only for state changes that need it (modal fade, Likert fill, accordion open, button hover). Respects `prefers-reduced-motion`. No bounce, spring, or scale-pop.

**Hover/press:** the primary button's hover is a colour change, Emerald → Orange, which is the one place hover carries brand meaning. Elsewhere hover is a restrained opacity or fill shift; never a hue swap that could be mistaken for a selected state.

**Borders & shadows:** 1px Dim Grey or low-opacity mode border for outlines and dividers. A single soft card shadow and a heavier modal shadow — elevation only, never stylisation. No coloured left-border accent cards.

**Transparency & blur:** the modal backdrop is ~60% black and the hero overlay ~55% black, both plain dims — no frosted glass.

**Imagery:** one hero photograph (subdivision perimeter fence), warm and daylit, always behind a dark overlay. No stock photography or illustration system beyond that.

## Iconography

- **Style:** simple line icons, consistent stroke width. Default in the mode's body-text colour, Bright Amber for active/selected.
- **Icon containers are never given a hardcoded background fill.** Keep the slot transparent (as the info-card icon already does correctly) or use a theme-aware surface token if a background is genuinely needed. A fixed light box reads as a bright rectangle floating on the black page in dark mode — the exact bug v3 flags on the About Us card.
- **Icon artwork must connect to the section's subject.** Generic tech-startup iconography (circuit boards, palettes, cameras) does not read as community safety, accessibility, or HOA services to a resident. v3 treats the About Us icon concept as unresolved, not merely mis-styled.
- **Source:** no icon library, icon font, or SVG set was supplied, and no codebase was attached to pull one from. **Lucide** (MIT, CDN-available, consistent stroke-width line style) is the recommended nearest match if icons are needed — a flagged substitution, not a confirmed brand asset.
- **Emoji:** not used.
- **Logo:** the "ReCARES" wordmark is set in type (multi-colour per letter), not an image asset. No Camella logo file was supplied — do not draw or approximate it. The brief explicitly excludes the Camella logo's illustrated figures from interface use; reserve them for branding moments only.

## Open items

- **Sign Up / Login relocation** affects whether the resident site and the CRUD admin panel are one deployed app with a hidden route or two builds sharing a backend. This system only establishes that they don't share top-level nav billing.
- **Error red `#D64545`** remains unconfirmed and unused in the built homepage.
- **About Us icon** needs a replacement concept, not just the background fix.
- **Accent conflict** between v3's token table and the green-primary instruction — see the callout under Visual foundations.
- **Missing assets:** no hero photograph, no icon set, no logo file, and no licensed Plus Jakarta Sans webfont (Google Fonts–hosted file used as nearest match). Every one of these is a labeled placeholder in the UI kits rather than invented artwork.
