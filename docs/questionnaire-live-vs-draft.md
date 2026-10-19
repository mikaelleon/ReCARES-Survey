# ReCARES Needs Assessment: Live Questionnaire and Draft Additions

Prepared from the code in `survey/defaultInstrument.ts` (instrument **v1**, status published), `survey/model.ts`, `survey/branching.ts`, `survey/o1.ts`, `survey/flags.ts`, `docs/survey.md`, `docs/draft-likert-items.md` and the planning note `ReCARES_Needs_Assessment_Additional_Categories.md`.

This document has two parts.

- **Part A** records the live questionnaire exactly as it is in code: every step, question, answer option, branching rule and skip value.
- **Part B** records the proposed changes: the draft Likert items (10 per category), the additional-category plan, and the problems found when the two are put side by side.

Nothing in Part B is in code yet. All draft wording is English only.

---

## 1. Summary

| Item | Live (v1) | Draft |
| --- | --- | --- |
| Steps | 13, plus welcome, consent, review, thank-you | Unchanged |
| Questions in code | 60 | 64 new Likert items proposed, plus about 40 from the additional-categories plan |
| Likert questions | 26 | 26 + 64 = 90 (draft) |
| Categories with at least 10 Likert items | 0 of 9 | 9 of 9 (on paper) |
| Languages | English, Tagalog | English only until wording is approved |

Likert counts per live category: B 3, F 7, S 3, P 3, C 2, R 2, H 2, T 2, AC 2. The highest is F with 7.

---

## 2. Part A: The live questionnaire (v1)

### 2.1 Respondent journey

1. **Welcome**: introduction, start or resume a draft saved on this device.
2. **Consent and eligibility**: two required checkboxes (agree to take part; confirm 18 or older and a Camella Homes Tibig owner, tenant or household member).
3. **Steps 1 to 13**: the numbered survey. Required items carry an asterisk.
4. **Review**: summary of answers, then submit.
5. **Thank you**: confirmation, with the optional interview note for those who opted in.

Every screen has a one-line sub-text under its title, an English/Tagalog toggle and a Leave-the-survey control. Drafts are kept in the browser after consent. A Firestore document is written only on a successful submit and is stamped with the instrument version. A minimum time on the survey (`MIN_MS_BEFORE_SUBMIT` in `SurveyFlow`) is enforced before submit.

### 2.2 Question types and scales

Types available in the model (`QuestionType`): `single`, `multi`, `likert`, `text`, `number`, `nested_multi`. There is no ranking type and no grid or matrix type.

| Scale | Labels (1 to 5) |
| --- | --- |
| Agreement | Strongly disagree, Disagree, Neutral, Agree, Strongly agree |
| Likelihood | Very unlikely, Unlikely, Not sure, Likely, Very likely |

Likert items can allow **N/A** (`allowNA`). Hidden questions are stored with their `skipCode` (for example `not_shown` or `99`), never left empty.

### 2.3 Reusable branching conditions (from the code)

| Name | Rule |
| --- | --- |
| HOMEOWNER | A1 in 1, 2, 3, 4 |
| TENANT | A1 in 5, 6 |
| OWNER_ELSEWHERE | A1 in 2, 3 (OFW or absentee owner) |
| NO_DEVICE | B1 includes `none` |
| HAS_DEVICE | B1 does not include `none` |

### 2.4 Step-by-step listing

Legend: **Req** = required by default, **Gate** = condition that shows the question, **Skip** = value stored when hidden, **N/A** = Likert with a Not applicable option.

#### Step 1. About your household
Intro note: answers in this pre-screening decide which question sets are shown; "Prefer not to say" is allowed for personal questions. Review group: A "About you".

| Code | Type | Question | Options / notes | Gate |
| --- | --- | --- | --- | --- |
| A1 | single (numeric values) | Which best describes you? | 1 Homeowner living in the unit; 2 OFW homeowner; 3 Absentee homeowner; 4 Family or household member of a homeowner; 5 Tenant or lessee; 6 Family or household member of a tenant or lessee. Options 2 and 3 are grouped as "Homeowner who does not live in the unit". | Always |
| A3 | single | How many people live in the unit? | 1, 2, 3, 4, 5, 6 or more; plus "No one lives in the unit right now" | Last option only when A1 is 2 or 3 |
| A2 | single | Which phase do you live in? | Phase 1, 2, 3, Phase 4 Heights, Phase 5 Highlands, Phase 6 Eastgrove (no "Not sure") | Always |
| A4 | single | Do you or another member of your household have a disability or mobility limitation? | Yes, No, Prefer not to say | Always |
| A5 | single | In the past 12 months, did you have construction, renovation, or repair work done that needed outside workers to enter the subdivision? | Yes, No | Always |
| AC1 | multi | What kind of difficulty applies to you or the household member? Select all that apply. | Difficulty walking or climbing stairs; Uses a wheelchair or mobility aid; Difficulty seeing; Difficulty hearing; Difficulty reading or understanding forms; Other; Prefer not to say (exclusive) | A4 = Yes |
| AC1_other | text (200) | Other | Free text | AC1 includes Other |

#### Step 2. About you and how you use HOA services
| Code | Type | Question | Options / notes | Gate |
| --- | --- | --- | --- | --- |
| A6 | single | What is your age range? | 18 to 24; 25 to 34; 35 to 44; 45 to 54; 55 to 64; 65 and above; Prefer not to say | Always |
| A7 | single | Sex | Female, Male, Prefer not to say | Feature flag `INCLUDE_SEX_AND_CIVIL_STATUS` (currently on) |
| A8 | single | Civil status | Single; Married; Living with a partner; Widowed; Separated; Prefer not to say | Same flag |
| A10 | single | Who usually handles HOA transactions for your household? | I do; Another member of my household; A caregiver, helper, or representative; The property owner or landlord; It varies | "Property owner or landlord" only for tenants (A1 5 or 6). A hint appears when the answer is not "I do": answer using your household's experience or choose Not applicable. |
| A11 | single | Which channel do you mainly use for HOA transactions? | Walk in at the HOA office; Phone call; Facebook page or message; Email or website; Through a neighbor or HOA officer; I have not done any HOA transaction | Always |

#### Step 3. Digital access (devices)
Hint after B1 when "None of these": you can finish with help; someone you trust can read the questions and enter your answers. Review group: B "Digital access".

| Code | Type | Question | Options / notes | Gate / skip |
| --- | --- | --- | --- | --- |
| B1 | multi | Which devices do you use regularly? Select all that apply. | Smartphone; Laptop or desktop computer; Tablet; A shared household device; None of these (exclusive) | Always |
| B2 | single | What kind of phone do you mainly use? | Android; iPhone (iOS); Other; I do not use a smartphone | HAS_DEVICE. Skip `99` |
| B3 | single | How do you mainly get online? | Wi-Fi or broadband subscription; Prepaid mobile data; Postpaid mobile data; Both Wi-Fi and mobile data; I do not have regular internet access | Always |
| B4 | single | How often do you go online? | Several times a day; About once a day; A few times a week; About once a week or less; Rarely or never | Always |
| B5 | single | How often do you do transactions online? | Weekly or more; A few times a month; A few times a year; Never | Always |

#### Step 4. Digital access (cost and connection)
Hint when NO_DEVICE: assisted completion note.

| Code | Type | Question | Options / notes | Gate / skip |
| --- | --- | --- | --- | --- |
| B6 | single | About how much do you spend on mobile data or internet each month, in pesos? | None; Under 100; 100 to 299; 300 to 499; 500 to 999; 1,000 to 1,999; 2,000 or more; Not sure | Always |
| B7 | Likert, agreement, N/A | My internet connection is stable enough to finish an online form without interruption. | | Always |
| B8 | Likert, agreement | I avoid installing new apps because of limited phone storage or mobile data. | | HAS_DEVICE. Skip `not_shown` |
| B9 | Likert, agreement | I am comfortable opening a website on my phone browser instead of installing an app. | | HAS_DEVICE. Skip `not_shown` |

#### Step 5. Feature interest (likelihood scale)
Intro: imagine a website residents could open on a phone or computer to do some HOA transactions from home. No right or wrong answers. Review group: F "Feature interest".

| Code | Question | Notes |
| --- | --- | --- |
| F1 | How likely are you to use online pre-registration for visitors and workers, with a temporary pass? | Core |
| F2 | How likely are you to use an online request for street or event closure permits, with notices sent to residents of the affected phase? | Core |
| F3 | How likely are you to use online tenant and lessee forms that you can submit from home? | Core. Homeowners see: "...use online forms to register or authorize your tenant with the HOA?" |
| F4 | How likely are you to use online registration where you upload a photo of a valid ID and the HOA Board verifies it? | Core |
| F5 | How likely are you to use an online channel to send requests or concerns to the HOA and track their status? | Core |

#### Step 6. Feature interest (priorities and barriers)
| Code | Type | Question | Options / notes |
| --- | --- | --- | --- |
| F6 | Likert, likelihood | How likely are you to use a version of the website with adjustable text size, higher contrast, and screen reader support? | |
| F7 | Likert, agreement | A website with these features would solve some of the problems I face as a resident. | Core |
| F8 | multi, max 3 | Which of these would you want available first? Select up to 3. | Pre-registration of visitors and workers; Online closure permits and notices; Online forms for owners and tenants; Online registration with ID verification; Online requests with status tracking; Accessible version of the website; None of these (exclusive) |
| F9 | multi | What might keep you from using this website? Select all that apply. | No reliable internet; Not sure how to use it; Worried about my personal data; Prefer going to the office; Do not have a suitable device; Nothing would stop me (exclusive); Other |
| F10 | text (300) | Is there another feature or service you would want from this kind of website? | |

#### Step 7. Current HOA service access
Intro: how you reach the HOA today. Hint for owners elsewhere: answer for your unit, including what your representative or caretaker experiences. Review group: S "Current HOA service access".

| Code | Type | Statement |
| --- | --- | --- |
| S1 | Likert, agreement, N/A | The HOA office hours make it hard for me to do my transactions. |
| S2 | Likert, agreement, N/A | I have to visit the HOA office in person even for simple matters. |
| S3 | Likert, agreement, N/A | I receive a response to my concerns within a reasonable time. |

#### Step 8. Entrance, visitor and worker permits
Owner-elsewhere hint as in step 7. Review group: P.

| Code | Type | Question | Gate / skip |
| --- | --- | --- | --- |
| P1 | multi | In the past 3 months, who did you or your household need to bring through the gate? Select all that apply. Options: Visitors; Ride-hailing or special-trip drivers; Deliveries; None of these (exclusive). | Always. Core |
| P2 | Likert, agreement, N/A | Waiting at the gate to get a permit or pass takes too long for my visitors, workers, or drivers. | P1 does not include None of these. Skip `not_shown` |
| P3 | Likert, agreement, N/A | Leaving an ID at the gate is inconvenient for my household or guests. | Same gate and skip |
| P4 | number (0 to 180) | About how many minutes does a typical wait at the gate take? | Always |
| P5 | Likert, agreement | Getting my construction or repair workers approved to enter takes too many steps. | A5 = Yes |

#### Step 9. Street and event closure permits
Review group: C.

| Code | Type | Question | Options / notes |
| --- | --- | --- | --- |
| C1 | single | In the past 12 months, which describes you? | I requested a street or event closure; My household was affected by a closure someone else requested; Both; Neither |
| C2 | Likert, agreement, N/A | The process of getting a street or event closure permit is clear. | |
| C3 | Likert, agreement, N/A | Notices about street closures and rerouting reach me in time. | |

#### Step 10. Registration, ID verification and data privacy
Review group: R.

| Code | Type | Question | Options / notes |
| --- | --- | --- | --- |
| R1 | Likert, agreement | I am comfortable uploading a photo of my valid ID to a secure online form. | |
| R2 | Likert, agreement | I trust that only authorized HOA personnel would be able to see my ID. | |
| R3 | single | After my ID has been verified, how long should it be kept? | Deleted right after verification; Kept for as long as I live in the subdivision; No preference; Not sure |

#### Step 11. Homeowner or tenant set
Title is "Tenant and lessee" by default and switches to "Homeowner" when A1 is 1 to 4.

Homeowner set (HOMEOWNER). Review group: H.

| Code | Type | Question | Notes |
| --- | --- | --- | --- |
| H1 | multi | Which HOA transactions did your household do in the past 12 months? | Clearance; Renovation permit; Vehicle sticker; Billing or dues; Tenant registration or authorization; None (exclusive); Other |
| H2 | Likert, agreement, N/A | Completing HOA clearances, forms, and permits needs more office visits than it should. | |
| H3 | Likert, agreement | Registering or authorizing a tenant with the HOA is easy. | Shown only to homeowners whose H1 includes tenant registration. Skip `not_shown` |
| H4 | text (300) | Describe one HOA transaction that took the longest, and why. | |

Tenant set (TENANT). Review group: T.

| Code | Type | Question | Notes |
| --- | --- | --- | --- |
| T1 | multi | Which HOA requirements did your household deal with as tenants in the past 12 months? | Tenant registration; Move-in clearance; Visitor or worker passes; Vehicle sticker; Forms needing the owner's signature or documents; None (exclusive); Other |
| T2 | Likert, agreement, N/A | The HOA's forms and requirements for tenants are clear. | |
| T3 | Likert, agreement, N/A | Completing HOA requirements as a tenant takes more steps than it should, such as needing the owner's documents or signature. | |
| T4 | text (300) | Which HOA requirement was hardest for your household as a tenant? | |

#### Step 12. Accessibility needs
Intro: voluntary; Prefer not to say allowed. Review group: AC. **No gate** on A4 in code.

| Code | Type | Question | Options |
| --- | --- | --- | --- |
| AC2 | Likert, agreement, N/A | Going to the HOA office in person is difficult for me or for someone in my household. | |
| AC3 | Likert, agreement, N/A | Larger text, higher contrast, or screen reader support would help me or someone in my household use an online form. | |
| AC4 | single | If an online service were available, who would use it for the household member who needs help? | The person themselves; A family member; A caregiver or authorized representative; Not applicable |

#### Step 13. Open problem discovery
| Code | Type | Question | Notes |
| --- | --- | --- | --- |
| O1 | nested multi | Besides what was asked, which of these HOA-related problems have you experienced? Select all that apply. | 13 categories (see 2.5); "None of these" exclusive; "Other" |
| O2 | text (500) | Is there any other problem with HOA services that you would like us to know about? | Hint: do not write names |
| O3 | text (500) | What other problems do you and your household face in the community, even if they have nothing to do with the HOA? | Hint: do not write names |
| IV1 | single | Would you be open to being contacted for a possible follow-up interview? | Yes opens the interview contact form (attachForm) |

### 2.5 O1 problem categories (13)

Each category the resident ticks opens a checklist (7 to 11 choices, "Other" last). Stored values are English labels even when answered in Tagalog.

| Category | Choices (summary) |
| --- | --- |
| Water supply or interruptions (11) | Frequent interruptions; no advance notice; announced too late; out for hours or days; low pressure; dirty or foul-smelling water; leaks not repaired; no tanker or refill; unclear who to contact; no updates on return; unfair or unclear charges |
| Power interruptions or electrical hazards (7) | Frequent interruptions; outages with no announcement; unsafe wires; slow follow-up; voltage drops or flicker; appliances damaged by surges; leaning or damaged poles |
| Garbage collection (7) | Missed days; unclear schedule; left uncollected; segregation not enforced; odor or pests; inconvenient or noisy truck hours; not enough bins |
| Street lights (7) | Not working; too dark; slow repairs; on during the day; flickering or dim; unclear who to report to; blocked by trees or poles |
| Roads or drainage (7) | Potholes; flooding; blocked drains; slow or unfinished repairs; missing signs or markings; floodwater stays for hours; broken drain covers |
| Noise or curfew concerns (7) | Loud parties; construction noise outside hours; unclear curfew; videoke at night; loud vehicles at night; complaints not acted on; noise from home businesses |
| Parking (7) | Not enough visitor parking; blocked driveways; unclear rules; parking in front of other homes; illegal parking near gate or corners; violators not penalized; large vehicles parked long |
| Security patrol (7) | Guards not visible; slow response; unclear procedures; gate queues; guards not alert; strangers enter easily; incidents not followed up |
| Billing or dues (7) | Unclear charges; hard to get receipt; disputes not resolved; increases unexplained; limited payment channels; payments not recorded; unclear late fees |
| Renovation permits (7) | Unclear requirements; slow approval; hard to reach engineer or office; unclear or high fees; neighbors not informed; workers block road; no inspection after approval |
| Pet or animal concerns (7) | Strays; pets not contained; animal noise; pet waste; aggressive animals; strays scatter garbage; unclear pet rules |
| Common areas or facilities (7) | Poor upkeep of clubhouse, court, playground; damaged gate or fence; overgrown areas; reservation unclear; hard to access; dirty or no supplies; unsafe equipment |
| Disputes between neighbors (7) | Boundary or fence disagreements; complaints not mediated; unclear complaint process; obstructed walkways; harassment or rude behavior; shared drainage or tree branches; unclear who handles disputes |

The list is the single source in `survey/o1.ts` for the form, the review screen and the admin O1 chart. Existing choices must not be reworded.

### 2.6 Core question codes

These feed the dashboard directly and cannot be removed or renamed: **A1, A2, A4, B1, P1, F1, F2, F3, F4, F5, F7**.

### 2.7 Branching map of the live instrument

| Trigger answer | Effect |
| --- | --- |
| A1 = 2 or 3 | A3 gains "No one lives in the unit right now"; owner hint on steps 7, 8, 9 |
| A1 in 1 to 4 | Homeowner set (H1 to H4) in step 11; F3 reworded; step 11 title "Homeowner" |
| A1 in 5 or 6 | Tenant set (T1 to T4); A10 gains "owner or landlord" |
| A4 = Yes | AC1 appears |
| AC1 includes Other | AC1_other appears |
| A5 = Yes | P5 appears |
| B1 includes none | B2, B8, B9 hidden (B2 stored 99; B8, B9 stored not_shown); assisted-completion hint on steps 3 and 4 |
| B1 has any device | B2, B8, B9 shown |
| P1 includes none | P2, P3 hidden (not_shown) |
| Homeowner and H1 includes tenant registration | H3 shown |
| A10 is not "I do" | Hint to answer for the household |
| IV1 = Yes | Interview contact form |

A step with no visible question is skipped and the progress bar adjusts.

### 2.8 Likert audit of the live questionnaire

| Category | Code prefix | Likert items now | Codes | Gap to 10 |
| --- | --- | --- | --- | --- |
| Digital access | B | 3 | B7, B8, B9 | 7 |
| Feature interest | F | 7 | F1 to F7 | 3 |
| HOA service access | S | 3 | S1 to S3 | 7 |
| Gate permits | P | 3 | P2, P3, P5 | 7 |
| Street closures | C | 2 | C2, C3 | 8 |
| ID and privacy | R | 2 | R1, R2 | 8 |
| Homeowner set | H | 2 | H2, H3 | 8 |
| Tenant set | T | 2 | T2, T3 | 8 |
| Accessibility | AC | 2 | AC2, AC3 | 8 |
| **Total** | | **26** | | **64** |

Categories A (screening), O (open discovery) and IV have no Likert items by design.

### 2.9 Known issues in the live instrument

1. **Docs and code disagree on step 12.** `docs/survey.md` says step 12 appears only for respondents with a disability or mobility limitation. In code, AC2 to AC4 have no `showWhen`, so every respondent sees step 12.
2. **Docs say step 11 is "Your household and the HOA".** The code titles it "Tenant and lessee" with a "Homeowner" variant.
3. **Docs point to `components/survey/SurveySteps.tsx` for question lists.** The live source is `survey/defaultInstrument.ts`.
4. **H3 skip code.** H3 carries both `skipCode: 'not_shown'` and `skipCodeWhen: HOMEOWNER`, so a tenant who never sees it and a homeowner who skips it by not choosing tenant registration are stored differently. Confirm this is intended.
5. **Household-level wording for non-handlers.** Several Likert items assume the respondent handles HOA transactions; only a hint on A10 covers this.

---

## 3. Part B: Draft changes

### 3.1 Draft 1: 64 new Likert items (`docs/draft-likert-items.md`)

Goal: at least 10 Likert items per category. Scale is agreement unless marked likelihood. Existing items are kept; new codes continue each category's numbering.

#### B. Digital access (3 existing + 7 new)
| Code | Item | Gate |
| --- | --- | --- |
| B10 | I am comfortable filling out a form on my phone. | Has device |
| B11 | I can read text on my phone screen without difficulty. | Has device |
| B12 | I know how to take a clear photo of a document with my phone. | Has device |
| B13 | I know how to upload a file or photo to a website. | Has device |
| B14 | I can use a website without asking someone for help. | Always |
| B15 | I can afford enough mobile data or Wi-Fi to use online services. | Always |
| B16 | I feel safe doing online transactions. | Always |

#### F. Feature interest (7 existing + 3 new, likelihood)
| Code | Item | Gate |
| --- | --- | --- |
| F11 | How likely are you to use online payment or viewing of HOA dues through this website? | Always |
| F12 | How likely are you to use this website to receive HOA announcements and notices? | Always |
| F13 | How likely are you to recommend this website to a neighbor? | Always |

#### S. Current HOA service access (3 existing + 7 new)
| Code | Item | Gate |
| --- | --- | --- |
| S4 | I know which HOA office or officer to contact for each type of concern. | Always |
| S5 | The HOA office is easy for me to reach by phone or message. | Always |
| S6 | HOA staff or officers are courteous when I deal with them. | Always |
| S7 | I get clear instructions on what documents or steps I need. | Always |
| S8 | I can track what happened to a request I made. | Always |
| S9 | Travel to the HOA office costs me time or money I would rather save. | Always |
| S10 | I am satisfied with how the HOA handles my transactions today. | Always |

#### P. Entrance, visitor and worker permits (3 existing + 7 new)
| Code | Item | Gate |
| --- | --- | --- |
| P6 | The steps for letting visitors into the subdivision are clear to me. | P1 not "None of these" |
| P7 | My visitors are sometimes turned away or delayed at the gate. | P1 not "None of these" |
| P8 | Deliveries and ride-hailing drivers have trouble getting in. | P1 includes deliveries or drivers |
| P9 | I would rather register my visitors before they arrive. | P1 not "None of these" |
| P10 | Gate guards check visitors consistently. | Always |
| P11 | I worry about who enters the subdivision. | Always |
| P12 | Getting permits for outside workers requires too many documents. | A5 = Yes |

#### C. Street and event closure permits (2 existing + 8 new)
| Code | Item | Gate |
| --- | --- | --- |
| C4 | I know where to apply for a street or event closure permit. | Always |
| C5 | Getting a closure permit takes too long. | C1 = requested or both |
| C6 | The requirements for a closure permit are reasonable. | C1 = requested or both |
| C7 | Neighbors are informed before a street closure happens. | Always |
| C8 | Closures disrupt my household's daily movement. | C1 = affected or both |
| C9 | Rerouting during closures is clearly communicated. | C1 = affected or both |
| C10 | Closure rules are applied fairly to all residents. | Always |
| C11 | I would want to be notified about closures that affect my phase. | Always |

#### R. Registration, ID verification and data privacy (2 existing + 8 new)
Existing R3 is single choice, so new Likert items run R4 to R11.

| Code | Item | Gate |
| --- | --- | --- |
| R4 | I understand why the HOA needs to verify my ID. | Always |
| R5 | I am comfortable giving my name and contact details to register online. | Always |
| R6 | I worry that my personal data could be misused. | Always |
| R7 | I would feel safer if the HOA explained how my data is protected. | Always |
| R8 | I am willing to wait for the HOA Board to verify my registration. | Always |
| R9 | I prefer showing my ID in person instead of uploading it. | Always |
| R10 | I trust the HOA Board to keep my information confidential. | Always |
| R11 | I should be able to ask the HOA to delete my data. | Always |

#### H. Homeowner set (2 existing + 8 new)
| Code | Item | Gate |
| --- | --- | --- |
| H5 | I understand the HOA rules that apply to my property. | Homeowner |
| H6 | Getting a clearance or certificate from the HOA is easy. | Homeowner |
| H7 | Renovation permits are processed in a reasonable time. | Homeowner |
| H8 | The requirements for renovation permits are clear. | Homeowner |
| H9 | Vehicle sticker applications are simple. | Homeowner |
| H10 | I understand my billing or dues statement. | Homeowner |
| H11 | Paying HOA dues is convenient for me. | Homeowner |
| H12 | Concerns I raised about my property were resolved properly. | Homeowner |

#### T. Tenant and lessee set (2 existing + 8 new)
| Code | Item | Gate |
| --- | --- | --- |
| T5 | I know what the HOA requires of me as a tenant. | Tenant |
| T6 | Registering as a tenant is easy. | Tenant |
| T7 | I can complete HOA requirements without the owner being present. | Tenant |
| T8 | My landlord responds quickly when the HOA needs their documents. | Tenant |
| T9 | I am treated the same as homeowners when I deal with the HOA. | Tenant |
| T10 | I can get a vehicle sticker or visitor pass as easily as an owner. | Tenant |
| T11 | I know who to contact at the HOA about tenant concerns. | Tenant |
| T12 | Move-in clearance takes too long. | Tenant |

#### AC. Accessibility needs (2 existing + 8 new)
| Code | Item | Gate |
| --- | --- | --- |
| AC5 | HOA forms are easy to read and understand. | Always |
| AC6 | Someone in my household needs another person's help to use a website. | Always |
| AC7 | A text size option would help me or someone in my household. | Always |
| AC8 | A high-contrast option would help me or someone in my household. | Always |
| AC9 | A screen reader option would help me or someone in my household. | Always |
| AC10 | The HOA office and common areas are easy to enter and move around in. | Always |
| AC11 | I would trust a family member or representative to submit forms for me online. | Always |
| AC12 | I would use online services more if they were easier for people with limited mobility. | Always |

Open points already recorded in the draft:
1. F uses likelihood; F13 is a likelihood-to-recommend item.
2. A respondent sees H or T, never both. Confirm 10 items each is intended.
3. Negatively worded items (P7, C5, C8, R6, T12) need a reverse-coding decision.
4. Decide whether the AC items should be gated on A4 = Yes.
5. Core codes must not change.

### 3.2 Draft 2: additional categories plan (`ReCARES_Needs_Assessment_Additional_Categories.md`)

Planning document, not yet merged. About 40 items and 8 to 12 extra minutes (estimate, to confirm in a pilot).

| Section | Who answers | Content |
| --- | --- | --- |
| Screening additions S3, S3b | Everyone; tenants for S3b | Length of stay in the subdivision (single choice: under 1 year; 1 to under 3; 3 to under 5; 5 to under 10; 10 to under 15; 15 or more; Prefer not to say). Length of current tenancy for tenants. |
| Community Concerns (C) | Everyone, plus mirrored owner and tenant branches | C1 concerns experienced (select all, rank top three) across 10 named concerns plus Other and None. C2a to C2g follow-ups per top-three concern (frequency, reported, to whom, why not, days to respond, resolved, 5-point satisfaction). C3 prevention by advance notice. C4 open-ended. Mirrored items on reachability, rules awareness, paperwork, responsibility, fair treatment. |
| House Rules Awareness (R) | Everyone | R1 overall familiarity; R2 familiarity by area (noise, parking, construction, visitors and gate, street events); R3 violations knowledge (three parts); R4 where rules were learned; R5 three scenario knowledge checks written from the actual house rules. |
| Tenant Orientation (T) | Tenants | T1 whether the owner oriented them; T2 to T4 method, areas covered, clarity if oriented; T-F1 to T-F5 follow-ups if not; T5 direct HOA acknowledgement; T6 whose job it is. |
| Owner Mirror (O) | Owners who rent out | O1 to O4: whether, how, awareness of responsibility, usefulness of a standard sheet. |
| HOA Communication Channels (H) | Everyone, plus two tenant items | H1 to H4 awareness and use of Facebook and website; H5 to H9b how up to date and missed announcements; H10 to H13 trust and responsiveness; H14 and H15 tenant additions. |

Ground rules of the plan (summary): categories and frequencies only, never names or addresses; identical wording across branches; a skip option on sensitive items; ask what happened after a complaint; keep abuse and legal disputes out; no rent or lease terms; no rule stated until the house rules document is in hand; repeat the anonymity line before the section.

Analysis plan of the document: compare rule awareness by resident type and by length of stay; compare tenant and owner orientation reports as groups, never as pairs; report n for every branch and bucket; set a confirmation threshold with the adviser before collecting data.

### 3.3 Conflicts between the live instrument and the two drafts

#### Code collisions
| Additional-categories code | Planned meaning | Already used for |
| --- | --- | --- |
| S3, S3b | Length of stay | S3 is the Likert on HOA response time |
| C1 to C4 | Community concerns | Street closures (C1 to C3, and draft C4 to C11) |
| R1 to R5 | House rules | ID verification and privacy (R1 to R3, and draft R4 to R11) |
| T1 to T6, T-F1 to T-F5 | Tenant orientation | Tenant set (T1 to T4, and draft T5 to T12) |
| H1 to H15 | HOA channels | Homeowner set (H1 to H4, and draft H5 to H12) |
| O1 to O4 | Owner mirror | Open problem discovery (O1 to O3) |

Suggested fix: give the new sections their own prefixes (for example CC concerns, HR house rules, OR orientation, OM owner mirror, CH channels) and put length of stay in step 1 as A-codes.

#### Overlaps between Draft 1 and Draft 2
| Draft 1 item | Overlapping Draft 2 content |
| --- | --- |
| H5 (understand HOA rules for my property) | House rules R1, R2 |
| T5 (know what the HOA requires of tenants) | Tenant orientation T1 to T4 |
| T7, T8 (complete requirements without owner, landlord responsive) | Tenant mirror: paperwork, reachability |
| T9 (treated the same as owners) | Tenant mirror: fair treatment |
| C7, C9, C11 (closure notices) | Channels H7 to H9 (missed announcements) |
| F12 (announcements via the website) | Channels H5, H6 |
| S4 (know who to contact) | Concerns C2c, C2d |
| S8 (track a request) | Concerns C2e, C2f |

#### Likert coverage of the Draft 2 categories
| New category | Likert-style items in plan | Gap to 10 |
| --- | --- | --- |
| Community concerns | 1 (C2g) plus mirror Likert items | about 9 |
| House rules | R1; R2 grid (5 rows); R3 (3 parts) | 1 if grid cells count, about 7 if items count |
| Tenant orientation | 1 (T4) | 9 |
| Owner mirror | 0 | 10 |
| HOA channels | 2 (H6, H10) | 8 |

#### Instrument limits
1. **Owner who rents out cannot be identified.** A1 codes 2 and 3 mean OFW or absentee, not "has a tenant". A new screening question is needed before owner-mirror items can be gated.
2. **No ranking type.** C1 "rank your top three" is not supported by the model.
3. **No grid type.** R2 and R3 would become one Likert question per row.
4. **No per-concern repeating block.** C2a to C2g for each of three ranked concerns needs about 21 conditional questions or a model extension.
5. **Survey length.** Draft 1 adds 64 Likert items and Draft 2 about 40 more, on top of the existing 60 questions. The plan's own aim of a short survey and the minimum-time check make a pilot completion-time test essential.

#### Rule checks
| Rule (Draft 2) | Status for Draft 1 |
| --- | --- |
| No specific house rule stated before the rules document is in hand | Draft 1 items state none; R5 and H9b stay blocked until the document and a real announcement are supplied |
| Identical wording across branches | Draft 1 T and H items are worded for one branch each |
| Proactive test: each item should lead to a feature | R10, R11, AC12, F13 have no clear feature link |
| Same Likert interpretation throughout | Both live scales are 5-point; confirm Draft 2 uses the same labels |

---

## 4. Open decisions

1. Do grid rows and categorical items count toward the 10-per-category rule, or only distinct Likert questions?
2. Merge Draft 1 and Draft 2 into one numbered list with new prefixes, or keep them separate?
3. Add a screening question for "my unit is rented out" so owner-mirror items can be gated.
4. Extend the model (ranking, repeating blocks) or simplify the concerns section.
5. Decide whether H and T should have 10 items each, since a respondent sees one set only.
6. Decide reverse coding for negatively worded items.
7. Gate the AC items on A4, or keep step 12 for everyone and fix `docs/survey.md`.
8. Supply the house rules document, a real recent announcement, and confirmation that the HOA Facebook account is a page and not a personal profile.
9. Agree the confirmation threshold with the adviser before data collection.
10. Add Tagalog strings after English wording is approved, and bump the instrument version (v2) when the live set changes.

## 5. Suggested sequence

1. Settle code prefixes and the merge of overlapping items.
2. Add the rented-out screening question and decide on question-type changes.
3. Re-count Likert items per category and top up to 10.
4. Write the items into `survey/defaultInstrument.ts` as a new draft in the Survey builder, not over v1.
5. Add Tagalog strings.
6. Lint, preview and pilot with three to five people from each respondent type.
7. Publish as v2.
