# Hoxan: how the survey adapts, and why we built it ourselves

Rubric focus: CRUD (Create), Application Quality (validation, error handling), Capstone Alignment.

This is voice-over only. Nothing here describes clicks or screen actions, so it fits over any footage, and each section stands alone so the editor can place clips in any order. Read it in your own voice and keep the structure.

Length: about 1,200 spoken words, roughly 7 to 8 minutes at a natural pace. The whole video has to stay between 15 and 20 minutes, so paragraphs marked (optional) can be cut if the total runs long.

Term used below: "branching" means that the survey changes which questions appear based on earlier answers.

---

## 1. Purpose of the survey design

I'm Hoxan, and I will explain the resident side of the system, which is the survey. Residents do not log in, since they open the link, answer the questions, and submit. The community includes homeowners, tenants, household members of either group, households with a member who has a disability or mobility limitation, and households that hire outside workers, and because these groups have different experiences, a single fixed questionnaire would ask many people about situations that do not apply to them. The survey was therefore built to change its questions according to each person's earlier answers, and I will explain how that works and why we did not use Google Forms.

## 2. Opening screens and consent

The survey is part of the public website, which also explains the study and its goals, and it takes about eleven to thirteen minutes to complete. It begins with a welcome screen where a resident can start a new response or resume a draft saved on the same device, and if the device has already submitted a response, the screen shows a warning so that a second person in the same household does not assume they are replacing the first response, although a different person may continue.

The next screen is consent and eligibility, which has two required checkboxes. The first confirms that the resident agrees to take part, and the second confirms that the resident is at least 18 years old and owns, rents, or lives in a home in Camella Homes Tibig. The numbered questions appear only after both boxes are ticked, and a resident who does not agree or does not qualify can use one of two links below the checkboxes to reach a thank-you page, in which case no answers are recorded.

## 3. The thirteen steps

The survey has thirteen numbered steps with a progress bar and plain titles. Step 1 covers the household, including who is answering, how many people live in the unit, which of six named phases the resident lives in, whether anyone has a disability or mobility limitation, and whether outside workers were hired recently. Step 2 covers the resident's age group and how they currently deal with the homeowners' association, steps 3 and 4 cover devices, internet access, and how often they go online, and steps 5 and 6 ask which features of a future system the resident would want. Step 7 asks about the quality of current HOA services, step 8 covers entrance, visitor, and worker permits, and step 9 covers street and event closure permits. Step 10 covers registration, ID verification, and data privacy, including comfort with uploading a photo of an ID, step 11 asks household and HOA questions that depend on whether the resident is a homeowner or a tenant, step 12 covers accessibility needs, and step 13 is open problem discovery.

(optional) Step 13 lists thirteen categories of everyday problems, including water interruptions, power, garbage collection, street lights, roads and drainage, noise, parking, security patrol, billing, renovation permits, pets, common areas, and disputes between neighbors, and when a resident selects a category, a checklist of specific complaints opens together with an "Other" box limited to 200 characters, which allows the team to identify the specific kind of problem and not only that a problem exists.

## 4. How the questions adapt

Most residents do not answer every question, because each question is shown only when an earlier answer makes it relevant, and all of these rules are kept in a single file so that they stay consistent and can be reviewed in one place.

The main division is between homeowners and tenants, which is selected in step 1. Homeowners, including household members of an owner and owners who live elsewhere, receive questions about owning a home in the community, while tenants receive questions about renting together with a note stating that their answers are not passed to a landlord or to the homeowners' association as an identified household, so the same step displays different content depending on that single answer. An owner who lives elsewhere also receives one additional choice, which is that no one currently lives in the unit.

Several other answers control whether follow-up questions appear. A household that reports a member with a disability or mobility limitation receives an accessibility follow-up that other households never see, a household that recently hired outside workers receives additional permit questions, and a resident who brought no one through the gate skips the follow-up questions about those visitors. A tenant registration answer unlocks one further follow-up, and residents who report having no device skip the questions that depend on having one.

The interview invitation at the end follows the same approach, since a resident who agrees to a follow-up interview is asked for contact details and preferred days and times, and these are stored separately from the survey answers so that the survey itself remains anonymous, with no name, block, or lot being collected.

When a question was never shown to a resident, the system records the value "not shown" and does not leave the field empty, which differs from a resident who saw the question and selected "Prefer not to say," and this distinction allows the analysis to separate questions that did not apply from questions that the resident declined to answer.

## 5. Validation, language, and drafts

Required questions are marked with a red asterisk, and if one is left unanswered, the page scrolls to the first problem, moves focus to it, and shows a summary line above the buttons stating what must be corrected. Rating questions display the selected label below the scale, for example "Your choice: 4, Agree," so that the resident can confirm what the number represents, and on phones the Back and Continue buttons remain fixed at the bottom of the screen.

A toggle on every screen switches the entire survey between English and Tagalog, and only the displayed text changes, since the stored answers remain in English so that results are comparable regardless of the language used, and any text without a translation falls back to English so that a missing translation does not break the form.

An unfinished survey is saved as a draft on the resident's own phone or computer, and nothing is sent online until the resident submits. The Leave the survey option offers three choices, which are to keep answering, to leave and keep the progress on that device, or to leave and erase the answers, and the last option is intended for shared devices.

## 6. Submission and survey status

Before submitting, the resident reviews all answers on a summary screen, and the survey requires a minimum amount of time before a submission is accepted, which prevents empty click-throughs. Submitting creates one record in Firestore, our online database, containing the answers, the submission date, the device type, which is phone or computer, and the version of the question set in use, so that later changes to the questions can still be compared consistently, and the record contains no name, block, lot, or street. The resident then sees a thank-you page, which includes a short note about the interview if the resident opted in.

A superadmin can pause or close the survey without changing any code. While it is paused or closed, residents see a short message in place of the start buttons, and the database itself refuses new submissions, so the restriction cannot be bypassed from the page.

## 7. Reasons for not using Google Forms

We built the survey ourselves for four reasons. Google Forms branches by directing respondents to different sections, and our survey has thirteen steps with rules that depend on several earlier answers, so reproducing it would require many duplicated sections that are difficult to keep consistent, and Google Forms also cannot distinguish a question that was never shown from one that was left blank, which our analysis depends on. The responses from a form are stored in a spreadsheet, whereas ours are stored in our own database and feed directly into the dashboard that the team uses for charts, filters, searches, and exports. We also needed control over the consent wording, anonymity, Tagalog display, the version number recorded with each response, and the ability to pause or close the survey, and every submission is available in the workspace that Kim will explain next.

---

## Optional footage ideas (any order, not tied to the words)

- Homepage, then the survey welcome screen and the one-device warning
- Consent checkboxes and the exit links
- Progress bar and step titles through steps 1 to 13
- Step 1 homeowner vs tenant, then Step 11 under each answer
- Disability follow-up appearing, then outside-worker permit questions
- Problem discovery categories opening their checklists
- Interview opt-in with contact fields
- A required question left empty and the page jumping to it
- English to Tagalog toggle, rating label under a 1 to 5 scale
- Leave the survey dialog
- Review screen, submit, thank-you page
- Firestore `needsAssessmentResponses` record
- Survey control set to paused, and the resident-facing message

## Presenter notes (not spoken)

Facts to keep straight:
- Branch rules: `survey/branching.ts`. Validation: `survey/validate.ts`. Question screens: `components/survey/SurveySteps.tsx`. Docs: `docs/survey.md`.
- Homeowner is resident types 1 to 4. Tenant is 5 and 6. Phase has six named options and no "Not sure."
- The draft is saved after consent, on later steps. Firestore is written only on submit.
- Minimum time before submit is 30 seconds (`MIN_MS_BEFORE_SUBMIT` in `SurveyFlow`).
- Rules allow `create` on `needsAssessmentResponses` only while the survey is open. Residents cannot read.
- Sex and civil status questions are behind a feature flag. Check `survey/flags.ts` before you say the survey asks them.
- The Google Forms reasons come from the code and docs. The repo does not record the team's real reasoning, so replace them if yours differ.

If the instructor asks:
- Can a resident edit after submitting? No. Responses are anonymous, so there is no way to identify one afterward. Only admins can read or delete.
- What stops spam? The minimum time and the rules that block reads and edits. There is no CAPTCHA yet. Say so honestly.

Canvas contribution (draft, edit to match the truth):
"I developed the resident survey: the 13-step form, branching and gating rules, per-step validation, the consent gate, English/Tagalog display, local drafts, and saving submissions to Firestore."
