# Data and privacy

This page is for residents who want a straight answer, and for the team who must not over-claim.

It is **not** a substitute for the consent text shown in the survey, the university ethics process, or Philippine data-protection advice.

---

## What residents are told

- The study does **not** ask for a name.
- Results are reported **together**, not as “the household at X.”
- The HOA does **not** receive individual responses attached to a household.
- This survey is **not** a live report to security or the office.
- Residents may stop before submit. Nothing is stored as a finished response until they submit.
- A trusted person may help them complete the form.

---

## What the survey stores when someone submits

A submitted response is a document in Firestore collection **`needsAssessmentResponses`**. It includes:

- Answers to the questions they were shown
- **`not_shown`** for gated questions they were never asked
- A submit date
- The **instrument version** in use at submit time
- Device class (phone or computer) and similar metadata used for analysis. The language the resident viewed the survey in is **not** saved with the response; stored answers are always the English values
- **No** name, block, lot, or street fields in the current schema

If they opt in to an interview, a separate **`interviewInterest`** document can hold the contact details they typed. That is the most directly identifying information the site is designed to collect, and it is optional.

---

## What stays only on the resident’s device

Unfinished surveys are drafts in **browser storage** (`localStorage`) on that phone or computer. The chosen survey language (`recares-survey-lang`) is stored the same way. A resident can wipe the draft at any time with **Leave the survey → Leave and erase my answers from this device**. The team cannot see drafts. Clearing site data, switching browsers, or using another device starts over (unless they already submitted).

---

## What the team sees

Approved proponents see:

- Combined counts and charts
- Individual *anonymous* submissions (phase, resident type, answers) for analysis
- Interview opt-ins, if any, including whatever contact the resident typed, plus team notes
- Homepage inquiries
- Team member emails and roles (Members page)

They should not export CSV onto shared drives carelessly. Treat exports like research records.

---

## Accounts (proponents only)

Admin accounts store name, email, role, status, and permission flags in **`admins`**. Invites live in **`invites`**. The signup access code lives in **`appConfig/signup`** (readable similarly to the public env access code).

Residents do **not** create these accounts to take the survey.

---

## Inquiry form

The homepage can collect a name (optional), email, and message. Those messages are stored in Firestore **`inquiries`** and show up on **Inquiries** in the admin workspace. The team replies from their own email. If a send fails (for example Firestore is blocked), the form shows an error instead of a false “sent” message.

---

## Browser blockers

Brave Shields and many ad blockers stop **Firestore**. Then:

- Residents may be unable to submit
- Proponents may be unable to load profiles (stuck on Finish access / empty dashboards)

The product shows a notice when it can detect this. The fix is to allow the site (especially `firestore.googleapis.com`).

---

## What is not built (do not imply it exists)

- Emailing residents automatically
- Erasing a Firebase Auth login when a member is removed (the app marks them removed; Auth disable needs extra backend work)
- Average time-to-complete (start time is not saved)

---

## Related reading

- [The survey](survey.md)
- [For residents](for-residents.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md)
