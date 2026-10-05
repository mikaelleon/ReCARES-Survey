# The survey

This page describes the **live needs-assessment instrument** in the code (`components/survey/`, `survey/`). It replaces older notes that talked about a five-step survey with separate “Section 4 / Section 5” safety blocks. Those sections were removed before the current title-defense instrument.

Residents see a progress bar and step titles, not field codes. Field codes (A1, A2, …) are for the research team and appear as small hints on the admin Responses screens.

---

## Journey at a glance

| Order | Screen | What happens |
| --- | --- | --- |
| Welcome | Introduction | Continue, or resume a draft on this device |
| Consent | Consent and eligibility | Must agree before questions |
| Extra gates | Short eligibility / honesty checks (`x1`, `x2`) | Blocks or continues based on answers |
| Steps 1–13 | Numbered survey | Branching; required items marked with * |
| Review | Summary | Check answers, then submit |
| Thank you | Confirmation | Optional interview note if they opted in |

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
| 13 | Open problem discovery | Open issues; optional **interview invitation** if they agree to be contacted |

Exact question lists live in `components/survey/SurveySteps.tsx`. Branching rules live in `survey/branching.ts`.

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

If the resident opts in, they can give contact details and preferred days/times. The team processes these on **Interview Invites** (`/admin/interviews/`). Statuses include not contacted, contacted, confirmed, and withdrawn (see [For proponents](for-proponents.md)).

---

## Field codes for the team

On Responses, small codes (A1, B3, IV1, …) match the specification. Hover hints explain the wording. Residents never need these codes.

---

## Related reading

- [For residents](for-residents.md)
- [Data and privacy](data-and-privacy.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) §4 (why old Section 4/5 charts disappeared)
