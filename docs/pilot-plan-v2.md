# Pilot plan: draft v2 completion time

Status: PLAN. Nothing has been run. Every number below is a placeholder to agree with the adviser before the pilot.

Decision already made: keep at least 10 Likert questions per category and accept the longer survey. This pilot tests whether residents can finish it, and where the survey needs trimming if they cannot.

## 1. What the pilot must answer

1. How long does each respondent type take to finish v2?
2. Where do people slow down, stop, or give up?
3. Do people stop reading and tick the same answer down a column (straight-lining) late in the survey?
4. Are the new items understood the way we intend, especially the owner and tenant statements that share identical wording?
5. Do the branches route correctly for every respondent type?
6. Does the survey work for people who need help (no device, assisted completion, disability)?

## 2. Numbers to test against

Estimates from the draft file, using rough seconds per question type (Likert 8, single choice 10, multiple choice 20, text 45, number 10, O1 checklist 90). They are not measurements.

Each rated category shows 5 Likert questions by default. The other 5 Likert questions in the category are optional and appear only after earlier answers signal a reason to ask. So length depends on the answers. Two bounds per path:

- **Favorable answers**: the respondent gives positive answers throughout, so few optional items appear.
- **Signal answers**: the respondent gives answers that trigger the most optional items.

| Path | Favorable answers | Signal answers |
| --- | --- | --- |
| Owner living in the unit | 116 questions, about 23 min | 145 questions, about 27 min |
| OFW or absentee owner | 115 questions, about 23 min | 144 questions, about 27 min |
| Owner who rents out | 122 questions, about 24 min | 156 questions, about 29 min |
| Tenant, not fully oriented | 131 questions, about 26 min | 164 questions, about 31 min |
| Household member with a disability | 116 questions, about 23 min | 147 questions, about 28 min |
| No device (assisted) | 96 questions, about 20 min | 120 questions, about 23 min |

Total in the draft: 203 questions in 17 steps. Likert items: 13 categories with 10 each (5 default and 5 optional). Street and event closure permits are no longer a step; the topic is only an O1 category. Some optional items sit on mutually exclusive branches, so no respondent sees all ten in a category.

Pilot hypothesis: a typical respondent finishes in 35 minutes or less. Placeholder targets, to confirm with the adviser:

| Measure | Acceptable | Cut needed |
| --- | --- | --- |
| Median completion time (any path) | 35 min or less | over 40 min |
| Share who finish | 80% or more of those who start | under 70% |
| Share who say "too long" | under 30% | 50% or more |
| Straight-lining in the last three Likert steps | under 20% | over 35% |

## 3. Who to recruit

3 to 5 people per type, so about 25 to 30 people. Residents of Camella Homes Tibig only. Not the proponents. Spread across phases.

| Group | Minimum |
| --- | --- |
| Owner living in the unit | 4 |
| OFW or absentee owner (family or caretaker may answer for the unit) | 3 |
| Owner whose unit is rented out | 4 |
| Tenant or lessee | 5 |
| Household member of an owner or tenant | 3 |
| Respondent with a disability or mobility limitation, or helping someone who has one | 3 |
| Respondent with no device, finishing with help | 3 |

Also aim for a mix of ages, including at least 3 people aged 55 or older, and a mix of people who use only a phone and people who use a computer.

Language: **decided, English only.** Draft v2 has no Tagalog strings, and most residents may answer more easily in Tagalog. Treat every English-only result as a ceiling for reading effort, not a final time. Recruit people who are comfortable reading English, record in the notes whether each person said they would prefer Tagalog, and rerun a short timing check once Tagalog is added.

## 4. How to run it

1. Use the **Preview** in the Survey builder with the v2 draft open. Do not publish v2 and do not change the live version.
2. Run each session on the device the person normally uses (phone for most). Add 2 sessions on a laptop.
3. A proponent sits nearby but does not help unless asked or the person is stuck for more than a minute.
4. Time each step with a stopwatch or a screen recording. The survey does not record step timings, and no tracking should be added just for the pilot. Record: start time, end of each step, finish time, pauses.
5. For 8 to 10 of the sessions, ask the person to think aloud on steps 11 to 15 (the new sections) and on the shared owner and tenant statements.
6. Afterwards, ask five questions:
   - How did the length feel (too short, about right, too long)?
   - Which part felt longest or most repetitive?
   - Which questions were unclear or hard to answer?
   - Did any question feel too personal?
   - Would you finish this survey on your own at home?
7. Debrief note: what the observer saw (hesitation, going back, asking for help).

Ethics and privacy: tell each person it is a test, no names are recorded, and nothing they enter is stored as a research response. Observer notes use a participant number only (for example P01), never a name or address. Do not record faces. Keep any screen recording on one device, delete after notes are written.

## 5. What to record per session

| Field | Notes |
| --- | --- |
| Participant ID | P01, P02, ... |
| Group | One of the seven above |
| Path | As shown by the survey: owner, rents out, tenant, and so on |
| Device | Phone or laptop |
| Total time | Minutes and seconds |
| Time per step | 17 steps, but only those shown |
| Questions shown | Count; should match the table above for that path |
| Stopped early | Yes or no, and at which step |
| Straight-lined | Same Likert answer on 8 or more questions in a row, yes or no, and where |
| N/A used | Count of Not applicable answers |
| Confusing items | Question codes |
| Routing problems | Code and what was shown or missing |
| Help requested | Yes or no, where |
| Language preference | Would the person have preferred Tagalog? Yes or no, and which items were hard to read in English |

## 6. Routing checks (do these in the first two sessions)

Walk each path once in Preview and confirm what is shown:

| Path | Setup answers | Should appear | Should not appear |
| --- | --- | --- | --- |
| Owner living in the unit | A1 = 1, A13 = No | Homeowner set, CC, HR, CH | A12, tenant set, TO, OM |
| OFW or absentee owner | A1 = 2 or 3, A13 = No | Same as above, plus the "no one lives in the unit" option in A3 | OM |
| Owner who rents out | A1 = 3, A13 = Yes | OM step | A12, TO, tenant set |
| Tenant | A1 = 5 | A12, tenant set, TO, tenant items in CH | A13, OM, homeowner set |
| Household member with a disability | A1 = 4, A4 = Yes | AC1, then step 16 (accessibility needs) | A12, TO |
| No device | B1 = None of these | Assisted note; B7, B14 to B17 shown | B2 and every optional item that needs a device (B8, B9, B10, B12, B13) |

Also check the optional items. Answer a category with all favorable answers and confirm only the 5 default Likert questions appear (plus items opened by earlier choices, such as the concerns picked in CC1). Then answer the same category with Disagree or Neutral and confirm the optional items appear. Use the trigger text in `docs/survey-v2-question-bank.md` (Shown to column).

Also check: there is no street or event closure step, and the "Street or event closure permits" category appears in the O1 checklist. Choosing "None of these" in CC1 skips CC2 to CC10; choosing one concern still shows CC2b; and TO2 to TO4 appear only after a Yes to TO1.

## 7. Analysis

1. Median, shortest and longest time per path. Report n for every group.
2. Time per step, to find the slowest steps. Expect the large Likert steps and the new text-heavy sections to be longest.
3. Count of people who finished, stopped early, or asked to stop.
4. For each Likert category, share of straight-lining and of Not applicable answers. High N/A on an item suggests it does not apply to many people.
5. List of unclear or sensitive items with the code and a suggested fix.
6. Compare observed times with the estimates in section 2 and correct the seconds-per-question values.

## 8. If the survey is too long

The default and optional structure already limits length: a respondent with favorable answers sees about 95 to 130 questions, and only a respondent with many signals sees 145 to 165. Core codes are never cut. Try these in order and re-measure after each:

1. Tighten the trigger. Optional items now appear after a Neutral, Disagree or Strongly disagree answer on favorably worded statements (Neutral, Agree or Strongly agree on negatively worded ones). Change it to Disagree or worse only. This keeps the structure and cuts the optional items shown to neutral respondents.
2. Remove the least valuable optional items first: CC17 to CC19, HR2a to HR2e, AC7 to AC9, B12, B13, CH21 to CH23, S6, S9, R12, R13, P8.
3. Move the non-Likert follow-ups to optional: CH3, CH4, CH8, CH9, CH12, CH13b, TO5 to TO9.
4. Move CC (community concerns) to the end of the survey as an optional block.
5. Show a progress message such as "About 20 minutes left" and allow save and continue later (the draft is already kept on the device).

Taking a category below 10 Likert items overall is a last resort and must be recorded in the methodology.

## 9. Before the pilot starts

- [ ] Agree the targets in section 2 with the adviser.
- [x] Language decided: English only; results are a reading-effort ceiling.
- [ ] Open v2 in the Survey builder and clear all errors and warnings (currently none).
- [ ] Confirm recruitment with the HOA, and that residents know it is a test.
- [ ] Prepare the recording sheet (section 5).
- [ ] Confirm HR5 and CH9b remain out of the pilot, since they wait for the house rules document and a real announcement.
- [ ] Rehearse once with a proponent on each path.

## 10. Timeline (suggested)

| Day | Task |
| --- | --- |
| 1 | Agree targets, finish Tagalog decision, recruit |
| 2 | Rehearse the six routing checks, fix any routing problem |
| 3 to 4 | Run sessions (about 45 minutes each including the debrief) |
| 5 | Analyze; list the changes |
| 6 | Revise v2, re-check lint, and decide whether a second small round is needed |

Time for 28 sessions at 45 minutes each is about 21 hours. Spread across two or three people.

## 11. Outputs

1. A one-page result: median time per path, finish rate, step with the highest drop-off, share who say too long.
2. A list of changes to v2 (cuts, rewording, routing fixes), each tied to an observation.
3. Corrected seconds-per-question values, to estimate future versions.
4. A go or no-go recommendation for publishing v2, stated as conditional on a Tagalog timing check.
