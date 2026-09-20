# Analysis: “Before we start” (Screening) Screen

**Scope:** The first numbered survey step after the consent gate — titled **Before we start** in the product UI (`STEPS[0].key === 'screening'`).  
**Primary sources:** screenshot of the live/UI step, `components/survey/SurveyFlow.tsx`, `components/survey/ScreeningForm.tsx`, `survey/content.ts`, `survey/gatingLogic.ts`, `survey/config.ts`, `survey/schema.ts`.  
**Date of analysis:** 18 Sep 2026.

> **Naming note:** Do not confuse this screen with **Before You Begin**, the separate required acknowledgment gate (language + terms + data privacy) that runs *before* any numbered survey step. That gate is `SurveyConsentGate`. This document analyzes the **screening** step whose heading is still **Before we start**.

---

## 1. Role in the survey journey

| Order | Screen | Progress UI |
| --- | --- | --- |
| 0 (gate) | Before You Begin — language, terms, privacy, single acknowledgment | No step counter |
| **1** | **Before we start — screening household / address / PWD / channel** | **Step 1 of 5** |
| 2 | Your survey plan | Step 2 of 5 |
| 3 | Section 2 — HOA access and office hours | Step 3 of 5 |
| 4 | Section 4 — Household and personal safety (gated) | Step 4 of 5 |
| 5 | Review and submit | Step 5 of 5 |

**Job of this screen:** Collect the answers that **decide which later sections appear**. It is the routing layer for the rest of the instrument, not yet the substantive assessment content (Section 2 Likert items, gated safety sections, etc.).

Copy from `STEPS`:

- **Title:** Before we start  
- **Intro:** *These answers decide which sections of the survey you are asked to fill in. Nothing here asks for your name.*

That intro is accurate for identity (no name field) but understates that the form **does** collect address-adjacent and household identifiers (phase, optional block/lot, household composition). Those are intentional for gating and analysis; they are not “name,” but they are personal/household data under the privacy notice.

---

## 2. Visual layout (from the screenshot)

### 2.1 Page chrome (resident shell)

- **Sticky header:** Dark emerald bar with ReCARES mark (left), nav links **HOME / ABOUT / FAQ**, primary CTA **START THE SURVEY** (orange/amber fill in the capture), theme toggle (moon).
- **Footer:** Dark emerald; project blurb, collaboration note with Camella Homes Tibig HOA, contact / inquiry form / proponent access; bottom strip with **EN / FIL** language pills, academic disclaimer, scroll-to-top and RAGbot FAB.

The survey step itself sits in the light page background (`#e5ebe8`-class page surface) with a centered column (~720px max width in code).

### 2.2 Step chrome (SurveyFlow)

Top row:

- **STEP 1 OF 5** (uppercase, tracked caption)  
- **Leave the survey** link (returns home)

Then:

- **Progress bar** — thin track with filled segment for step 1 / 5  
- **H1** “Before we start” (headline color, large weight)  
- **Supporting sentence** (caption color)

### 2.3 Form card

- White / surface-1 card, **16px radius**, soft card shadow  
- **Responsive CSS grid:** `repeat(auto-fit, minmax(220px, 1fr))` — reads as roughly two columns on desktop (matches screenshot)  
- **Wide fields** span full row (`gridColumn: 1 / -1`): Resident type, Primary channel, and conditional disability-type multi when shown  
- Bottom **Back** (secondary, disabled on step 0) and **Continue** (primary)

### 2.4 Control patterns

| Pattern | Used for | Selected state |
| --- | --- | --- |
| Native-styled **Select** | Phase, household size, civil status, age, resident type, primary channel, conditional children count | Default “Select…” until chosen |
| **Text Input** | Block, Lot | Placeholder “Optional” |
| **Chip / pill buttons** | Children Y/N, Sex, PWD self, PWD household | Bright amber fill + bold when selected |
| **Checkbox grid** | Disability type (only if PWD self = Yes) | Amber checked box |

---

## 3. Field inventory (full)

Defined in `SCREENING_FIELDS` (`survey/content.ts`). Rendered by `ScreeningForm` with optional `when` predicates.

### 3.1 Always visible (default path)

| ID | Label | Control | Options / notes |
| --- | --- | --- | --- |
| `addr_phase` | Phase | Select | Phase 1–5. **Hint under field:** perimeter-adjacent phases unlock extended security tier; list marked as placeholder pending HOA confirmation. |
| `addr_block` | Block | Text | Optional |
| `addr_lot` | Lot | Text | Optional |
| `household_size` | Household size | Select | 1, 2, 3, 4, 5, 6 or more |
| `civil_status` | Civil status | Select | Single, Married, Widowed, Separated, Divorced |
| `children_yn` | Children in household | Radio chips | Yes / No |
| `sex` | Sex | Radio chips | Female / Male |
| `age_range` | Age range | Select | 18–25 … 56 and above |
| `resident_type` | Resident type | Select (wide) | Homeowner; Renter or lessee; Household member of a homeowner; Live-in household staff |
| `pwd_self` | Person with disability (PWD) | Radio chips | Yes / No |
| `pwd_household` | Household member has a disability or mobility limitation | Radio chips | Yes / No |
| `primary_channel` | Primary channel currently used for HOA transactions | Select (wide) | In person; Online forms downloaded and printed; Through a household member or representative; Do not currently transact with the HOA |

### 3.2 Conditionally visible

| ID | Label | Shown when | Control |
| --- | --- | --- | --- |
| `children_count` | Number of children | `children_yn === 'Yes'` | Select: 1, 2, 3, 4 or more |
| `disability_type` | Type of disability | `pwd_self === 'Yes'` | Multi-checkbox (wide): Physical or mobility; Visual; Hearing or communication; Intellectual or developmental; Psychosocial or mental health; Chronic illness affecting mobility; Multiple; Prefer not to say |

In the provided screenshot, children = **No** and PWD fields are unset/default, so neither conditional block appears — matching the code.

---

## 4. Downstream gating (why this screen exists)

Screening answers are mapped through `toScreeningData` / `computeGates` in `SurveyFlow` and helpers in `survey/gatingLogic.ts` + `PERIMETER_PHASES` in `survey/config.ts`.

| Screening signal | Gate | Effect on later flow |
| --- | --- | --- |
| Phase ∈ `PERIMETER_PHASES` (currently **Phase 1**, **Phase 4**) | `perimeter` | Unlocks **Section 3 extended** (“Perimeter and security — extended tier”) on the survey plan |
| Civil status ∈ Married / Widowed / Separated / Divorced | `s4` auto-open | **Section 4** (household & personal safety) appears without opt-in |
| Civil status = Single (and similar non-partnered) | `s4` opt-in | Step 4 asks whether to enter Section 4; decline → stored as `not_shown` |
| Children in household = Yes | `s5` | Unlocks **Section 5** (children and youth safety) |
| PWD self = Yes | `s7a` | Unlocks **Section 7a** (accessibility — own needs); also reveals disability-type multi on this screen |
| PWD household = Yes | `s7b` | Unlocks **Section 7b** (accessibility — household member) |

**Always-on sections** (not decided here, but listed on the next “plan” step): Screening itself, Section 2, Section 3 base, Section 6, 7c, 8, etc. per `SECTIONS` in `content.ts`.

**Important implementation detail:** `toScreeningData` currently hard-maps several typed fields incompletely for gating (e.g. age/resident type/channel may be stubbed to fixed defaults in the mapper while display labels are stored in `sc`). Gates that matter today primarily use **phase, civil status, children, PWD flags** via the display-label path and `computeGates`. Any future reliance on full typed `ScreeningData` should reconcile that mapper with real form values.

---

## 5. Interaction and flow behavior

### 5.1 Navigation

- **Continue:** Advances to step index + 1 (“Your survey plan”) with **no required-field validation** in the current implementation — empty selects/radios are allowed.
- **Back:** Disabled on this step (`step === 0` of the numbered flow). Users cannot return to the consent gate via Back; they can only **Leave the survey**.
- **Leave the survey:** Link to `/`. Consent acknowledgment is in-memory only; leaving and re-entering `/survey` restarts the consent gate.

### 5.2 State model

Held in `SurveyFlow` client state:

- `sc: Record<string, string>` — single-value answers  
- `multi: Record<string, Record<string, boolean>>` — multi-select (disability type)  
- Language from consent gate is stored separately and written into the eventual submit payload as `language: 'EN' | 'FIL'`

On submit (later steps), gated-away fields are written as `not_shown` rather than blank — preserving the distinction between “never asked” and “asked but unanswered.”

### 5.3 Conditional field cleanup

When a parent answer flips (e.g. children Yes → No), the child field may remain in `sc` / `multi` state even if hidden. Plan/review/submit logic often filters by `when`, but **stale values can linger in state** until overwritten. Worth hardening if analytics ever read raw `sc` without re-applying `when`.

---

## 6. Content and product analysis

### 6.1 What works well

1. **Clear routing purpose** — Intro tells residents why these questions exist.  
2. **Anonymity framing** — “Nothing here asks for your name” reduces fear of identification for many residents.  
3. **Progressive disclosure** — Children count and disability type only appear when relevant; keeps the default path shorter.  
4. **Chip radios** — Large touch targets (≥44px) suit mobile and older users.  
5. **Wide full-bleed selects** for long labels (resident type, primary channel) avoid cramped columns.  
6. **Perimeter hint** is honest that phase list / perimeter rule are HOA-confirmable config (`PERIMETER_PHASES`).  
7. **Separation from consent** — Legal/privacy acknowledgment is no longer mashed into the first data fields; screening can focus on routing.

### 6.2 Friction and UX risks

1. **Title collision:** Consent is “Before You Begin”; screening is “Before we start.” Residents may feel they already finished a “before we start” moment. Consider renaming screening to something like **About your household** or **Section 1 — Screening**.  
2. **No required validation:** Continue works with an empty form. Downstream gates then treat missing civil status / children / PWD as non-opening paths — easy to skip into a thin survey by accident.  
3. **Phase hint is developer-facing:** “Placeholder list — confirm the real phases with the HOA” is useful for the team but may confuse residents. Prefer resident-safe helper copy; keep the HOA TODO in docs/config comments.  
4. **Block / Lot optional but unlabeled as sensitive:** Optional address fragments may still re-identify households in a small subdivision when combined with phase. Privacy notice already covers address details; UI could soften with “optional — helps researchers understand phase coverage” without sounding like HOA enforcement.  
5. **Binary sex only:** May need an inclusive third option depending on IRB / adviser guidance.  
6. **PWD wording:** “Person with disability (PWD)” is clear for PH context; household question is long and may wrap awkwardly in a narrow column.  
7. **Language of the form body:** Consent gate is bilingual; screening field labels/options remain English-only in `content.ts` even when `language === 'FIL'`. FIL users get Filipino legal copy then English fields — a consistency gap.  
8. **Navbar CTA while in-survey:** “Start the survey” remains visible during the flow (per shell). Harmless but slightly odd mid-instrument.

### 6.3 Accessibility

- Chip buttons are `<button type="button">` — keyboard operable.  
- Select/Input use shared UI components with labels.  
- Multi disability uses `Checkbox` with visible labels.  
- Progress is text + bar; ensure the bar has an accessible name (ProgressBar component).  
- Focus styles depend on global `:focus-visible` tokens.  
- No per-field “required” announcements because nothing is enforced yet.  
- Amber-only selection state is supplemented by bold weight (not color alone) — good for the design-system rule.

### 6.4 Privacy / ethics alignment

| Topic | Status on this screen |
| --- | --- |
| Name | Not collected — matches intro |
| Address-like data | Phase required for gating intent; block/lot optional |
| Sensitive gates | PWD and civil status collected here to open later sensitive sections |
| Voluntary skip | Currently total skip possible via empty Continue — stronger than “skip any question”; may conflict with research completeness goals |
| Retention / rights | Handled on prior consent gate, not repeated here |

---

## 7. Technical structure

```
app/(resident)/survey/page.tsx
  └── SurveyFlow
        ├── [if !consentPassed] SurveyConsentGate
        └── [else] step UI
              ├── Progress + Leave
              ├── STEPS[step] title/intro
              ├── ScreeningForm  ← this screen when key === 'screening'
              └── Back / Continue
```

**Key files:**

| File | Responsibility |
| --- | --- |
| `survey/content.ts` | Field definitions, options, hints, STEPS copy |
| `components/survey/ScreeningForm.tsx` | Grid layout + control rendering + `when` filter |
| `components/survey/SurveyFlow.tsx` | Step state, gating, plan/review/submit |
| `survey/gatingLogic.ts` | Pure predicates for s4/s5/s7a/s7b/perimeter |
| `survey/config.ts` | `PERIMETER_PHASES` |
| `survey/schema.ts` | Typed `ScreeningData` / `SurveyResponse` shapes |

---

## 8. Gaps vs a production-ready Section 1

Prioritized checklist:

1. **Rename** screening title to reduce collision with the consent screen.  
2. **Add required-field rules** (at least phase, civil status, children Y/N, sex, age, resident type, both PWD questions, primary channel) with inline errors before Continue.  
3. **Localize** `SCREENING_FIELDS` labels/options for FIL.  
4. **Confirm with HOA** real phase list and perimeter set; remove resident-facing “placeholder” language.  
5. **Confirm retention** on the consent gate (still placeholder there).  
6. **Clear dependent answers** when parent radios flip.  
7. **Align `toScreeningData`** with actual form values for every typed field.  
8. Consider **inclusive sex / prefer-not-to-say** options if the research protocol allows.  
9. Optionally show a **short “why we ask”** note for PWD and civil status (they unlock sensitive sections later).  
10. Decide whether **block/lot** should stay optional forever or become unused for anonymity and dropped.

---

## 9. Summary verdict

The **Before we start** screen is a well-structured **screening / branching instrument**: card layout, progressive disclosure, and clear coupling to gated sections. Visually it matches the resident design system (emerald shell, amber selection, soft card, step progress).

Its main product risks are **naming overlap** with the new consent gate, **no validation before Continue**, **English-only field copy under FIL language**, and a few **resident-facing developer placeholders** (phase list). Fixing those would make Section 1 feel finished rather than scaffolded, without changing the underlying gating model.

---

## 10. Screenshot reference map

Elements visible in the provided capture correspond 1:1 to the always-visible field set above, with:

- Children = **No** (amber) → `children_count` hidden  
- PWD radios unselected / unset → `disability_type` hidden  
- Phase hint text visible under Phase  
- Back disabled / Continue enabled  
- Step label **1 of 5** confirming this is the numbered screening step, not the consent gate
