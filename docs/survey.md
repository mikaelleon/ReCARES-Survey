# The survey

This page describes the **live needs-assessment instrument** in the code (`components/survey/`, `survey/`). It replaces older notes that talked about a five-step survey with separate “Section 4 / Section 5” safety blocks. Those sections were removed before the current title-defense instrument.

Residents see a progress bar and step titles, not field codes. Field codes (A1, A2, …) are for the research team and appear as small hints on the admin Responses screens.

---

## Journey at a glance

| Order | Screen | What happens |
| --- | --- | --- |
| Welcome | Introduction | Continue, or resume a draft on this device |
| Consent | Consent and eligibility | Two checkboxes, both required: agree to take part, and confirm 18+ and a Camella Homes Tibig owner/tenant/household member |
| Steps 1–13 | Numbered survey | Branching; required items marked with * |
| Review | Summary | Check answers, then submit |
| Thank you | Confirmation | Optional interview note if they opted in |

Every screen has a one-line **sub-text under its title** saying what the screen is for and what to do, an **English / Tagalog** toggle and a **Leave the survey** control (see [Language](#language-english-and-tagalog) and [Leaving the survey](#leaving-the-survey)).

Drafts are written to **this device’s browser storage** after consent, on later steps. **Firestore** (the online database) receives a document only on successful submit. Each saved response includes an **instrument version** (for example `v1`) so later edits to the question set can be compared fairly.

A superadmin can **pause** or **close** the survey from **Survey control**. While it is not open, residents see a short message instead of the start buttons, and new submissions are refused.

---

## Numbered steps (titles residents see)

| Step | Title | Typical content |
| --- | --- | --- |
| 1 | About your household | Who they are (resident type), how many people live in the unit, **which phase** (1–6 named phases only — there is no “Not sure”), disability/mobility screening, recent outside workers |
| 2 | About you and how you use HOA services | Age band, optional sex and civil status (feature-flagged), who handles HOA transactions, how they currently reach the HOA |
| 3–4 | Digital access | Devices, internet, how often they go online |
| 5–6 | Feature interest | Which future-system features they would want |
| 7 | Current HOA service access | Quality and access of current services |
| 8 | Entrance, visitor, and worker permits | Permit experience; extra items if they had outside workers |
| 9 | Street and event closure permits | Closure-permit experience |
| 10 | Registration, ID verification, and data privacy | Comfort with ID photo upload and related privacy items |
| 11 | Your household and the HOA | **Homeowner path** *or* **tenant path**, depending on step 1 |
| 12 | Accessibility needs | Only if they indicated a disability or mobility limitation |
| 13 | Open problem discovery | Pick problems from the categories below (each opens a checklist), a free-text “anything else”, and the optional **interview invitation** |

Exact question lists live in `components/survey/SurveySteps.tsx`. Branching rules live in `survey/branching.ts`.

### Open problem discovery categories (O1)

Step 13 asks which HOA-related problems the resident has experienced. Each category they tick opens a checklist plus an “Other” box (200 characters).

| Category | Example choices |
| --- | --- |
| **Water supply or interruptions** | Frequent interruptions or no supply; interruptions without advance notice; scheduled interruptions announced too late; out for hours or days; low pressure; dirty or foul-smelling water; leaks not repaired quickly; no tanker/refill during outages; unclear who to contact; no updates on when water returns; unclear or unfair charges |
| Power interruptions or electrical hazards | Frequent interruptions; outages with no announcement; unsafe or exposed wires; slow follow-up |
| Garbage collection | Missed days; unclear schedule; left uncollected; segregation not enforced; odor or pests |
| Street lights | Not working; too dark; slow repairs |
| Roads or drainage | Potholes; flooding; blocked drains |
| Noise or curfew concerns | Parties; construction noise; unclear curfew |
| Parking | Not enough visitor parking; blocked driveways; unclear rules |
| Security patrol | Guards not visible; slow response; unclear procedures; long gate queues |
| Billing or dues | Unclear charges; no receipt; unresolved disputes |
| Renovation permits | Unclear requirements; slow approval; hard to reach the office |
| Pet or animal concerns | Strays; uncontained pets; animal noise |
| Common areas or facilities | Poor upkeep; damaged gate/fence; overgrown areas; reservation difficulty |
| Disputes between neighbors | Boundary disagreements; complaints not mediated; unclear complaint process |

The list lives in `survey/o1.ts`, the single source for the form, the review screen, and the admin “O1 categories” chart. Stored values are the **English** labels, even when the resident used Tagalog, so analysis is unaffected.

To add a category: add it to `survey/o1.ts`, add its id to `O1_CATEGORIES` in `survey/answers.ts` and its keys to `O1Details` in `survey/schema.ts`, then add Tagalog strings in `survey/i18n.ts`. Bump the **instrument version** if you change the live list.

---

## Language (English and Tagalog)

- An **English / Tagalog** switch sits at the top of every survey screen. The choice is saved in the browser (`recares-survey-lang`) and sets the page language for screen readers.
- All resident-facing survey copy is translated: welcome, consent, steps 1–13, rating scales, validation messages, the review screen, and the interview form.
- **Only what is displayed is translated.** Option ids and stored answers stay in English.
- Translations live in `survey/i18n.ts` as an English → Filipino dictionary. A string without an entry **falls back to English**, so a missing translation never breaks the form.
- Not translated: the survey-status message a superadmin types in Survey control, and the standalone `/survey/interview/` page (it sits outside the survey’s language provider).
- The Filipino text is a working translation. Have a native speaker review it, especially the consent wording, before launch.

When you add or edit a question, add the Filipino string in the same change.

---

## Leaving the survey

“Leave the survey” is at the top of every screen.

- On the welcome, consent, and thank-you screens it goes straight back to the homepage.
- On steps 1–13 and the review screen it opens a confirmation dialog:
  - **Stay and keep answering**
  - **Leave and keep my progress** — the draft stays on this device
  - **Leave and erase my answers from this device** — asks once more, then deletes the draft (for shared or public devices)

---

## Using the form (interaction notes)

- Each new step scrolls to the top and moves focus to the step title, so keyboard and screen-reader users start at the new content.
- If **Continue** is pressed with required questions unanswered, the page scrolls to the first problem, focuses it, and shows a summary line above the buttons.
- Rating questions (1–5) show the chosen label underneath, for example “Your choice: 4 — Agree”.
- On phones, Back / Continue stay pinned to the bottom of the screen, and cards and tap targets are sized for touch.
- The progress bar is announced to assistive technology as “Step N of 13”.

---

## Branching (why two neighbors see different questions)

The survey hides questions that do not apply. That is intentional, not a bug.

| Earlier answer | What unlocks |
| --- | --- |
| Resident type is a homeowner (including household member of a homeowner, OFW, or absentee owner) | Homeowner household items |
| Resident type is tenant / lessee (including household member of a tenant) | Tenant items; a note that tenant answers are not shared with a landlord or the HOA as an identified household |
| Owner lives elsewhere | Extra option: “No one lives in the unit right now” |
| Disability / mobility = yes | Accessibility follow-up (AC1) |
| Recent outside workers = yes | Extra permit questions |
| Certain digital answers | Device-dependent follow-ups |
| Interview opt-in = yes | Contact and schedule fields |

Admin charts call these **gated branches**. “PWD screening = Yes” is the screening answer. **Accessibility path** is the follow-up that only appears after Yes. Do not treat those two labels as the same thing.

---

## Editing the questions and branching (Survey builder)

Proponents and Superadmins can change the questions and the branching rules without touching code. Open **Survey builder** (`/admin/survey/builder/`) in the sidebar. Advisers do not see it.

**How it works**

- The question set is stored as a **version** (v1, v2, …) in Firestore (`surveyInstruments`). Residents always see the one version marked **Live**.
- A version is a **Draft**, **Published**, or **Archived**. Only drafts can be edited. A published version is frozen, because every response is stamped with the version it was answered on.
- To change the survey: **Edit as new draft** (copies the version) → edit → **Preview** → **Save draft** → **Publish**. Publishing makes it live immediately and archives the previous version.
- If nothing has been published from the builder, residents see the original question set (v1) that ships with the app.

**The list**

- The survey appears as a list of steps, each with its questions. Every question shows its code, answer type, the text, and, in plain words, **when it appears** ("Always shown", or "Shown only when A1 is “Tenant or lessee”").
- **Add:** use **Add question to this step** (or **Add step**). **Edit:** open a question or step. **Delete:** the bin on the row, with a confirmation that warns when other questions depend on it.
- **Reorder:** the up and down arrows work everywhere, including phones. On a computer you can also drag a row by its handle, onto another row or step, to move it. Steps reorder the same way.
- **Find a question:** the search box filters by code or text. **Collapse all** folds the steps.
- On a phone or narrow window, opening a question shows the editor full-screen with a **Back to the list** link.

**The editor for one question**

- Text (with an optional Tagalog version), answer type, choices, limits, required, helper text, and different wording for a group.
- **Show this question** sets the branching. Leave it as "Always shown", or **Add condition**: pick an earlier question, a comparison ("is", "is one of", "includes", "is answered", …) and the answer. Add more rules and choose **all of these** (AND) or **any of these** (OR); groups can be nested.
- A choice can have its own rule ("if"), so it is offered only to some respondents.
- **When skipped** sets the value saved when the question is hidden.
- A rule can read only questions that come **before** it, because a respondent cannot have answered a later one yet. A step with no visible question is skipped, and the progress bar adjusts.

**Rules the builder enforces**

- Question codes and answer types of questions that exist in the version you copied from are **fixed**, and so are their existing choice ids, so older responses stay readable.
- Eleven questions feed the Dashboard directly (A1, A2, A4, B1, P1, F1–F5, F7). They show a lock, cannot be deleted or renamed, and a version missing one cannot be published.
- **Publish** is blocked while the problem list shows errors (duplicate codes, a rule pointing at a later or missing question, a choice list with fewer than two choices, and so on). Warnings do not block.

The old plain-language branching summary on Responses ("How the survey branches") describes v1 only; the builder list is the live view.

---

## Phase question

**Which phase do you live in?** offers only:

- Phase 1  
- Phase 2  
- Phase 3  
- Phase 4 Heights  
- Phase 5 Highlands  
- Phase 6 Eastgrove  

“Not sure” was removed from this question. Other “Not sure” labels elsewhere (for example a likelihood scale) are different questions and still exist.

---

## Required answers and “Prefer not to say”

- A red asterisk means the resident must choose something to continue.
- Several personal items include **Prefer not to say**. That *is* an answer; it is not a blank.
- Gated questions the resident was never shown are stored as **`not_shown`**, not as empty. That keeps “did not apply” distinct from “skipped.”

---

## Submit, drafts, and one-device warning

- **Leave before submit:** no finished response is written online.
- **Draft:** saved locally so they can resume on the same browser.
- **Submit:** creates a `needsAssessmentResponses` document. The team sees it on Dashboard and Responses after refresh/live listeners.
- **Already submitted on this device:** a warning appears so a second person in the household does not overwrite the “one device, one response” assumption by accident. They may continue if they are a different person.

There is a minimum time on the survey before submit is accepted (`MIN_MS_BEFORE_SUBMIT` in `SurveyFlow`). That reduces empty click-throughs. It is not a published “average completion time.”

---

## Interview form

If the resident opts in, they can give contact details and preferred days/times. The team processes these on **Interview Invites** (`/admin/interviews/`). Statuses include not contacted, contacted, and confirmed; delete removes an invite completely (see [For proponents](for-proponents.md)).

---

## Field codes for the team

On Responses, small codes (A1, B3, IV1, …) match the specification. Hover hints explain the wording. Residents never need these codes.

---

## Related reading

- [For residents](for-residents.md)
- [Data and privacy](data-and-privacy.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) §4 (why old Section 4/5 charts disappeared)
