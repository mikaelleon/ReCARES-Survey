# Draft v2 branching logic

Status: DRAFT. Generated from `survey/draftInstrumentV2.ts`. Not published; v1 stays live. Companion to `docs/survey-v2-question-bank.md`.

## 1. The two rules

1. **Rated categories: 5 Likert questions by default, 5 optional.** The default five are shown to everyone in the category's audience. An optional question appears only after earlier answers signal a reason to ask.
2. **A signal** is an answer that is not clearly favorable:
   - favorably worded statement: Neutral, Disagree or Strongly disagree (3, 2, 1);
   - unfavorably worded statement (the reverse-coded ones): Neutral, Agree or Strongly agree (3, 4, 5);
   - interest items in F: Likely or Very likely (4, 5), because the follow-ups ask about extra features.
   - Not applicable never signals.

Some optional questions also depend on a choice made in an earlier non-Likert question (for example the concerns picked in CC1, or the transactions listed in H1). Optional items on opposite branches (for example R8 and R9) are never both shown, so no respondent sees all ten Likert questions in a category.

Hidden questions are stored as `not_shown` (B2 keeps its v1 value `99`). Reverse-coded statements: B8, S1, S2, P2, P3, P5, H2, T3, AC2, R9.

## 2. What each resident type sees

A1 decides the main path. The six types are 1 owner living in the unit, 2 OFW owner, 3 absentee owner, 4 household member of a homeowner, 5 tenant or lessee, 6 household member of a tenant.

| Step | Title | Resident types that can see it |
| --- | --- | --- |
| 1 | About your household | All six types, if the condition holds |
| 2 | About you and how you use HOA services | All six types, if the condition holds |
| 3 | Digital access | All six types, if the condition holds |
| 4 | Digital access | All six types, if the condition holds |
| 5 | Feature interest | All six types, if the condition holds |
| 6 | Feature interest | All six types, if the condition holds |
| 7 | Current HOA service access | All six types, if the condition holds |
| 8 | Entrance, visitor, and worker permits | All six types, if the condition holds |
| 9 | Registration, ID verification, and data privacy | All six types, if the condition holds |
| 10 | Tenant and lessee | All six types, if the condition holds |
| 11 | Community concerns | All six types, if the condition holds |
| 12 | House rules awareness | All six types, if the condition holds |
| 13 | Moving in as a tenant | Tenant types (5, 6) |
| 14 | Renting out your unit | Owners (1 to 3) |
| 15 | HOA announcements and channels | All six types, if the condition holds |
| 16 | Accessibility needs | All six types, if the condition holds |
| 17 | Open problem discovery | All six types, if the condition holds |

Extra gates inside these steps are in section 3. The "Renting out your unit" step needs A1 in 1 to 3 and A13 = Yes, so a tenant never sees it.

## 3. Gates on non-Likert questions and screening answers

| Code | Question | Type | Shown when | Resident types that can see it |
| --- | --- | --- | --- | --- |
| AC1 | What kind of difficulty applies to you or the household member? Select all that apply. | multi | A4 is “Yes” | All six types, if the condition holds |
| AC1_other | Other | text | AC1 includes “Other” | All six types, if the condition holds |
| A12 | How long have you been renting or leasing your current unit? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| A13 | Is your unit currently rented out to a tenant or lessee? | single | resident is an owner (A1 = 1 to 3) | Owners (1 to 3) |
| B2 | What kind of phone do you mainly use? | single | B1 does not include “None of these” | All six types, if the condition holds |
| H1 | Which HOA transactions did your household do in the past 12 months? Select all that apply. | multi | resident is a homeowner type (A1 = 1 to 4) | Homeowner types (1 to 4) |
| H4 | Describe one HOA transaction that took the longest, and why. | text | resident is a homeowner type (A1 = 1 to 4) | Homeowner types (1 to 4) |
| T1 | Which HOA requirements did your household deal with as tenants in the past 12 months? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| T4 | Which HOA requirement was hardest for your household as a tenant? | text | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| CC2 | Which of these are the most serious for you? Select up to 3. | multi | CC1 does not include “None of these” | All six types, if the condition holds |
| CC2b | Which one is the most serious? The next questions are about this one. | single | CC2 has an answer | All six types, if the condition holds |
| CC3 | How often has this concern happened in the past 12 months? | single | CC2b has an answer | All six types, if the condition holds |
| CC4 | Did you report this concern to anyone? | single | CC2b has an answer | All six types, if the condition holds |
| CC5 | Who did you report it to? Select all that apply. | multi | CC2b has an answer and CC4 is “Yes” | All six types, if the condition holds |
| CC6 | Why did you not report it? Select all that apply. | multi | CC2b has an answer and CC4 is “No” | All six types, if the condition holds |
| CC7 | How long did it take to get a response? | single | CC2b has an answer and CC4 is “Yes” | All six types, if the condition holds |
| CC8 | Was the concern resolved? | single | CC2b has an answer and CC4 is “Yes” | All six types, if the condition holds |
| TO1 | Before you moved in, did the owner of your unit orient you on the subdivision's rules? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| TO2 | How was it done? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, fully”, “Yes, partly” | Tenant types (5, 6) |
| TO3 | Which areas were covered? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, fully”, “Yes, partly” | Tenant types (5, 6) |
| TO5 | Did anyone else orient you? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, partly”, “No”, “Not sure” | Tenant types (5, 6) |
| TO6 | How did you learn the rules? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, partly”, “No”, “Not sure” | Tenant types (5, 6) |
| TO7 | Did you learn a rule only after a warning, notice, or complaint? | single | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, partly”, “No”, “Not sure” | Tenant types (5, 6) |
| TO8 | Did you ever break a rule without knowing it? | single | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, partly”, “No”, “Not sure” | Tenant types (5, 6) |
| TO9 | What would have helped? Select all that apply. | multi | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, partly”, “No”, “Not sure” | Tenant types (5, 6) |
| TO10 | Has the HOA ever given you the rules directly or asked you to acknowledge them? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| TO11 | Whose job should it be to inform tenants of the rules? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| OM1 | Do you orient your tenants on the subdivision's rules? | single | resident is an owner (A1 = 1 to 3) and A13 is “Yes” | Owners (1 to 3) |
| OM2 | How do you orient them? Select all that apply. | multi | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and OM1 is one of “Always”, “Sometimes” | Owners (1 to 3) |
| CH8 | What did you miss? Select all that apply. | multi | CH7 is one of “Once”, “Several times” | All six types, if the condition holds |
| CH9 | How did you find out you had missed it? | single | CH7 is one of “Once”, “Several times” | All six types, if the condition holds |
| CH12 | How would you check? | single | CH11 is one of “Once”, “Several times” | All six types, if the condition holds |
| CH13b | How long did you wait? | single | CH13 is “Yes” | All six types, if the condition holds |
| CH14 | Were you told how to get HOA announcements when you moved in? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |
| CH15 | Do you receive HOA announcements directly or through someone else? | single | resident is a tenant type (A1 = 5 or 6) | Tenant types (5, 6) |

Choices inside a question can also be gated: A3 offers "No one lives in the unit right now" only to owners living elsewhere (A1 = 2 or 3); A10 offers "The property owner or landlord" only to tenant types; CC2 lists only the concerns picked in CC1; CC2b lists only the concerns picked in CC2.

## 4. Default and optional Likert questions by category

### Digital access (B)

Default (5): B7, B14, B15, B16, B18. Optional (5): B10, B8, B11, B13, B9.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| B10 | I am comfortable filling out a form on my phone. | B1 does not include “None of these” and (any of B14, B7 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| B8 | I avoid installing new apps because of limited phone storage or mobile data. | B1 does not include “None of these” and (any of B15, B7 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| B11 | I can read text on my phone screen without difficulty. | B1 does not include “None of these” and (any of B14, B16 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| B13 | I know how to upload a file or photo to a website. | B1 does not include “None of these” and (any of B14, B18 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| B9 | I am comfortable opening a website on my phone browser instead of installing an app. | B1 does not include “None of these” and (any of B14, B18 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |

### Feature interest (F)

Default (5): F1, F3, F4, F5, F7. Optional (5): F11, F12, F13, F14, F6.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| F11 | How likely are you to use a website to view your HOA dues and pay them? | any of F1, F3, F4, F5 is Likely or Very likely | All six types, if the condition holds |
| F12 | How likely are you to use a website to read HOA announcements and notices? | any of F1, F5 is Likely or Very likely | All six types, if the condition holds |
| F13 | How likely are you to use phone reminders about HOA rules and notices? | any of F1, F5 is Likely or Very likely | All six types, if the condition holds |
| F14 | How likely are you to use a website to apply for a clearance, renovation permit, or vehicle sticker? | any of F1, F3, F4, F5 is Likely or Very likely | All six types, if the condition holds |
| F6 | How likely are you to use a version of the website with adjustable text size, higher contrast, and screen reader support? | A4 is “Yes” or (any of F1, F3, F4, F5 is Likely or Very likely) | All six types, if the condition holds |

### Current HOA service access (S)

Default (5): S1, S2, S3, S4, S5. Optional (5): S6, S7, S8, S9, S10.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| S6 | HOA staff and officers are courteous when I deal with them. | any of S3, S5 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| S7 | I get clear instructions on the documents and steps I need. | S2 is Neutral, Agree or Strongly agree or S4 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| S8 | I can find out what happened to a request I made. | any of S3, S5 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| S9 | Reaching the HOA does not cost me much time or money. | any of S1, S2 is Neutral, Agree or Strongly agree | All six types, if the condition holds |
| S10 | I am satisfied with how the HOA handles my transactions today. | S1 is Neutral, Agree or Strongly agree or S2 is Neutral, Agree or Strongly agree or S3 is Neutral, Disagree or Strongly disagree or S4 is Neutral, Disagree or Strongly disagree or S5 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |

### Entrance, visitor and worker permits (P)

Default (5): P6, P7, P9, P10, P11. Optional (5): P5, P3, P2, P8, P12.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| P5 | Getting my construction or repair workers approved to enter takes too many steps. | A5 is “Yes” | All six types, if the condition holds |
| P3 | Leaving an ID at the gate is inconvenient for my household or guests. | P1 does not include “None of these” and (any of P6, P7 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| P2 | Waiting at the gate to get a permit or pass takes too long for my visitors, workers, or drivers. | P1 does not include “None of these” and (any of P6, P7 is Neutral, Disagree or Strongly disagree) | All six types, if the condition holds |
| P8 | Deliveries and ride-hailing drivers can enter without trouble. | (P1 includes “Deliveries” or P1 includes “Ride-hailing or special-trip drivers”) and P7 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| P12 | The documents required for worker permits are reasonable. | A5 is “Yes” and P5 is Neutral, Agree or Strongly agree | All six types, if the condition holds |

### Registration, ID verification and data privacy (R)

Default (5): R1, R2, R4, R5, R6. Optional (5): R7, R8, R9, R12, R13.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| R7 | I would feel safer if the HOA explained how my data is protected. | any of R6, R2 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| R8 | I am willing to wait for the HOA Board to verify my registration. | R1 is Agree or Strongly agree | All six types, if the condition holds |
| R9 | I prefer showing my ID in person instead of uploading it. | R1 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| R12 | I understand what happens to my ID photo after it is checked. | any of R2, R6 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| R13 | I am comfortable receiving the result of my verification by text message or email. | any of R1, R5 is Agree or Strongly agree | All six types, if the condition holds |

### Homeowner set (H)

Default (5): H2, H6, H7, H10, H11. Optional (5): H3, H8, H9, H13, H14.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| H3 | Registering or authorizing a tenant with the HOA is easy. | resident is a homeowner type (A1 = 1 to 4) and H1 includes “Tenant registration or authorization” | Homeowner types (1 to 4) |
| H8 | The requirements for a renovation permit are clear. | resident is a homeowner type (A1 = 1 to 4) and (any of H6, H7 is Neutral, Disagree or Strongly disagree) | Homeowner types (1 to 4) |
| H9 | Applying for a vehicle sticker is simple. | resident is a homeowner type (A1 = 1 to 4) and H1 includes “Vehicle sticker” | Homeowner types (1 to 4) |
| H13 | I know how long a clearance or permit will take before I apply. | resident is a homeowner type (A1 = 1 to 4) and (H2 is Neutral, Agree or Strongly agree or H6 is Neutral, Disagree or Strongly disagree) | Homeowner types (1 to 4) |
| H14 | I can easily get a receipt or proof of payment from the HOA. | resident is a homeowner type (A1 = 1 to 4) and (any of H10, H11 is Neutral, Disagree or Strongly disagree) | Homeowner types (1 to 4) |

### Tenant set (T)

Default (5): T2, T3, T6, T11, T13. Optional (5): T12, T10, T14, T15, T16.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| T12 | Move-in clearance is processed in a reasonable time. | resident is a tenant type (A1 = 5 or 6) and T1 includes “Move-in clearance” | Tenant types (5, 6) |
| T10 | Vehicle stickers and visitor passes are easy to get as a tenant. | resident is a tenant type (A1 = 5 or 6) and (any of T6, T13 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |
| T14 | I can finish my tenant registration without many trips to the HOA office. | resident is a tenant type (A1 = 5 or 6) and (T3 is Neutral, Agree or Strongly agree or T6 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |
| T15 | I understand which HOA requirements are mine as a tenant and which are the owner's. | resident is a tenant type (A1 = 5 or 6) and T2 is Neutral, Disagree or Strongly disagree | Tenant types (5, 6) |
| T16 | The documents the HOA asks tenants to provide are reasonable. | resident is a tenant type (A1 = 5 or 6) and (T3 is Neutral, Agree or Strongly agree or T1 includes “Forms needing the owner's signature or documents”) | Tenant types (5, 6) |

### Community concerns (CC)

Default (5): CC12, CC13, CC14, CC15, CC16. Optional (5): CC9, CC10, CC17, CC18, CC19.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| CC9 | I am satisfied with how my report was handled. | CC2b has an answer and CC4 is “Yes” | All six types, if the condition holds |
| CC10 | An advance notice or reminder would have prevented this concern. | CC2b has an answer | All six types, if the condition holds |
| CC17 | Pets in my neighborhood are kept under control. | CC1 includes “Pets” or CC16 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| CC18 | Construction and repair work near my home is done at reasonable hours. | CC1 includes “Construction or renovation” or CC14 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| CC19 | Visitors to my neighborhood behave respectfully. | CC1 includes “Visitors or loitering” or CC15 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |

### House rules awareness (HR)

Default (5): HR1, HR3a, HR3b, HR3c, HR6. Optional (5): HR2a, HR2b, HR2c, HR2d, HR2e.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| HR2a | I know what is expected of residents about noise. | HR1 is Neutral, Disagree or Strongly disagree or CC1 includes “Noise” | All six types, if the condition holds |
| HR2b | I know what is expected of residents about parking. | HR1 is Neutral, Disagree or Strongly disagree or CC1 includes “Parking or blocked driveways” | All six types, if the condition holds |
| HR2c | I know what is expected of residents about construction and renovation. | HR1 is Neutral, Disagree or Strongly disagree or CC1 includes “Construction or renovation” or A5 is “Yes” | All six types, if the condition holds |
| HR2d | I know what is expected of residents about visitors and gate entry. | HR1 is Neutral, Disagree or Strongly disagree or P1 does not include “None of these” or CC1 includes “Visitors or loitering” | All six types, if the condition holds |
| HR2e | I know what is expected of residents about pets. | HR1 is Neutral, Disagree or Strongly disagree or CC1 includes “Pets” | All six types, if the condition holds |

### Tenant orientation (TO)

Default (5): TO13, TO14, TO15, TO16, TO17. Optional (5): TO4, TO12, TO18, TO19, TO20.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| TO4 | The orientation I received was clear. | resident is a tenant type (A1 = 5 or 6) and TO1 is one of “Yes, fully”, “Yes, partly” | Tenant types (5, 6) |
| TO12 | I feel prepared to follow the subdivision rules. | resident is a tenant type (A1 = 5 or 6) and (TO1 is one of “Yes, partly”, “No”, “Not sure” or TO14 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |
| TO18 | Tenants are treated the same as owners by neighbors. | resident is a tenant type (A1 = 5 or 6) and (any of TO13, TO14, TO15, TO16, TO17 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |
| TO19 | Tenants are treated the same as owners by the HOA. | resident is a tenant type (A1 = 5 or 6) and (any of TO13, TO14, TO15, TO16, TO17 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |
| TO20 | A standard HOA orientation sheet would make it easier for owners to orient their tenants. | resident is a tenant type (A1 = 5 or 6) and (any of TO13, TO14, TO15, TO16, TO17 is Neutral, Disagree or Strongly disagree) | Tenant types (5, 6) |

### Owner mirror (OM)

Default (5): OM3, OM4, OM5, OM6, OM7. Optional (5): OM8, OM9, OM10, OM11, OM12.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| OM8 | Tenants are treated the same as owners by neighbors. | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and (any of OM3, OM4, OM5, OM6, OM7 is Neutral, Disagree or Strongly disagree) | Owners (1 to 3) |
| OM9 | Tenants are treated the same as owners by the HOA. | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and (any of OM3, OM4, OM5, OM6, OM7 is Neutral, Disagree or Strongly disagree) | Owners (1 to 3) |
| OM10 | A standard HOA orientation sheet would make it easier for owners to orient their tenants. | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and (any of OM3, OM4, OM5, OM6, OM7 is Neutral, Disagree or Strongly disagree) | Owners (1 to 3) |
| OM11 | I understand my responsibilities as the owner of a rented unit. | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and (OM1 is one of “Sometimes”, “Never” or OM7 is Neutral, Disagree or Strongly disagree) | Owners (1 to 3) |
| OM12 | I am confident my tenant knows the subdivision rules. | (resident is an owner (A1 = 1 to 3) and A13 is “Yes”) and (OM1 is one of “Sometimes”, “Never” or OM4 is Neutral, Disagree or Strongly disagree) | Owners (1 to 3) |

### HOA communication channels (CH)

Default (5): CH6, CH10, CH16, CH17, CH18. Optional (5): CH19, CH20, CH21, CH22, CH23.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| CH19 | The HOA's Facebook account is easy to use for getting information. | CH1 is one of “Yes, and I follow it”, “Yes, but I do not follow it” | All six types, if the condition holds |
| CH20 | The HOA website is easy to use for finding information. | CH2 is “Yes, and I have visited it” | All six types, if the condition holds |
| CH21 | HOA announcements reach tenants as well as owners. | any of CH6, CH16 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| CH22 | I can ask a question about an announcement and get an answer. | any of CH10, CH18 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| CH23 | The information on one HOA channel matches the information on the others. | any of CH10, CH17 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |

### Accessibility needs (AC)

Default (5): AC2, AC3, AC5, AC6, AC10. Optional (5): AC7, AC8, AC9, AC11, AC13.

| Optional code | Statement | Shown when | Resident types that can see it |
| --- | --- | --- | --- |
| AC7 | A text size option would help me or someone in my household use an online form. | AC3 is Agree or Strongly agree or AC1 includes “Difficulty seeing” or AC1 includes “Difficulty reading or understanding forms” | All six types, if the condition holds |
| AC8 | A high-contrast option would help me or someone in my household use an online form. | AC3 is Agree or Strongly agree or AC1 includes “Difficulty seeing” | All six types, if the condition holds |
| AC9 | A screen reader option would help me or someone in my household use an online form. | AC3 is Agree or Strongly agree or AC1 includes “Difficulty seeing” | All six types, if the condition holds |
| AC11 | I would trust a family member or representative to submit forms for me online. | AC6 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |
| AC13 | Instructions in simple words and short steps would help me or someone in my household use an online service. | AC5 is Neutral, Disagree or Strongly disagree | All six types, if the condition holds |

## 5. Mirror items: identical wording, identical rules

TO13 to TO17 (tenants) and OM3 to OM7 (owners who rent out) are the default mirror statements. TO18 to TO20 and OM8 to OM10 are optional and use the same rule for both groups: shown when any of the five default mirror statements in that group is not clearly favorable. Because the rule is the same, owner and tenant results can be compared as groups. Never pair respondents.

## 6. Removed from v1 branching

- Street and event closure permits are not asked in v2 (v1 C1 to C3, plan C4 to C14, F2, and the closure choice in F8). The topic appears only as the O1 category "Street or event closure permits".
- v1 items B8, B9, F6, P2 and P3 move from default to optional; P6, P7 and P9 are shown to everyone with Not applicable.
- Every hidden question stores `not_shown`, including v1 carry-overs that stored nothing (AC1, AC1_other, P5, H1 to H4, T1 to T4) and H3 for tenants.

