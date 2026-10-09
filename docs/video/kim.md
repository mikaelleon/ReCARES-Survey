# Kim: the project, the hosting, and the team workspace

Rubric focus: Capstone Alignment, Hosting, CRUD (Read, Update, Delete), Query/Filter/Sort, Testing, Documentation.

This is voice-over only. Nothing here describes clicks or screen actions, so it fits over any footage, and each section stands alone so the editor can place clips in any order. Part A opens the video and Part B follows Hoxan. Record them as two takes.

Length: about 1,500 spoken words in total (Part A about 1.5 minutes, Part B about 8 minutes) at a natural pace. The whole video has to stay between 15 and 20 minutes, so paragraphs marked (optional) can be cut if the total runs long.

Terms used below: "hosting" is the service that stores the website files and serves them over the internet, and a "database" is the online storage where answers and team records are kept.

---

# Part A: opening

## 1. The project

Good day, we are [group name], fourth-year Information Technology students at the University of Batangas, Lipa Campus. Our capstone is ReCARES, which stands for Resident Centered Assistance for Reporting and Emergency System, and it concerns Camella Homes Tibig, a community in Lipa City, where we are studying whether a system for reporting problems and emergencies would benefit the residents. Because that system would be large, we first needed evidence from the residents themselves, so the application shown in this video is the research tool and not the future system, and it consists of a public side, where residents read about the study and answer a survey, and a private side, where our team reads, organizes, and reviews the results.

## 2. Architecture and hosting

The website is hosted on Firebase Hosting, which provides a public link that anyone can open from a phone or a computer, and it is built with Next.js and published as pre-built static files, which keeps it fast and inexpensive to run. Login is handled by Firebase Authentication, and the survey answers and team records are stored in Cloud Firestore, a cloud database located in Singapore.

The system has four kinds of users, since residents need no account, while the team has three roles, which are Proponents, who are the student researchers, an Adviser who reviews the work, and Superadmins who manage access. Brent will explain how people obtain access, and Hoxan will explain the survey.

---

# Part B: the team workspace and closing

## 3. The dashboard

After residents submit, the team works in a private workspace that opens on the Dashboard, which shows combined results, including the total number of respondents measured against the research target of 100, the number of homeowners, the number of tenants, and the number of residents who answered yes to the disability and mobility screening question, followed by charts, a list of recent submissions, and, for superadmins, recent member activity. A date range at the top limits the data to a chosen period and is shared with the Responses page during the same browser session, and the Dashboard also shows whether the survey is open, paused, or closed together with the version of the question set that new submissions are recorded under.

## 4. Reading the data

The Responses page presents the same answers in three ways. The Summary tab contains pinned charts that each team member can add or remove for their own account, the Question tab shows one question at a time across all residents, and the Individual tab lists each submission as a row, where opening a row displays every answer in a side panel, and this is the Read operation, since the data is loaded from the online database. Questions that a resident was never asked appear as "not shown," as Hoxan explained, and a response can be deleted from the table, the detail card, or the side panel after a confirmation, because the live record is permanently removed.

## 5. Search, filter, and sort

Because the team expects around a hundred responses, the Individual list supports query, filtering, and sorting. The search box matches against a response's identifier, its phase, the resident type, and the disability screening answer, and it waits briefly after typing before updating the list, while the filters narrow the list by phase and by branch, meaning homeowners only or tenants only, and they combine with the search text. Sorting orders the list by submission date or by phase in ascending or descending order, and the count updates after every change. When no response matches, the page states that nothing was found and offers to reset the filters, the filtered results can be exported as a spreadsheet file, and a text summary can be copied, while a sample-data mode exists for practice and is labeled so that sample rows are not mistaken for community results.

## 6. Create, update, and delete: the Findings Log

As the team analyzes the data, it records its observations in the Findings Log, where creating a note requires a title of at least three characters, a body, a tag, and the survey question the note refers to, and the tags are barrier, theme, anomaly, and recommendation. If a field is missing or too short, the form identifies what must be corrected and nothing is saved, and from the Question tab of Responses a shortcut opens the form with that question already selected.

A note has a status of draft, reviewed, or final, and a final note is locked until its author returns it to draft, while the application also blocks a duplicate title on the same question by the same author and limits each author to 100 notes. The list can be filtered by tag, status, question, and a My Notes switch, and it can be sorted by updated date, created date, title, or status. Deleting a note requires confirmation because the deletion is permanent, only the author can edit or delete a note, and this restriction is enforced by the database as well as by the interface, while advisers can read every note but cannot change it.

## 7. Interview board and inquiries

Residents who agree to a follow-up interview appear on a board with columns for each stage of outreach, which are not contacted, contacted, and confirmed, and moving a card updates the person's status, while each card has a notes area for the history of calls and emails that is kept by the team and is never joined to the anonymous survey answers. A calendar highlights the weekdays that residents prefer, the contact list can be exported separately from the survey data, the board can be sorted by newest, oldest, or email, and a card can be permanently deleted, for example when a person asks to be removed, while only members with the Interview Invites permission can change statuses.

The contact form on the homepage feeds a separate inbox called Inquiries, in which each message has a status of new, in progress, or resolved, and the list can be sorted by newest, oldest, or sender name. The application does not send email, so the team replies from its own email account using the sender's address.

## 8. Reviews

Reviews are handled in a separate area, where the Adviser starts a review thread on a finding note, a survey question, or the current version of the question set, and each thread has a severity of suggestion, required fix, or approved and begins as open. A Proponent can reply and mark the thread as addressed, and only the Adviser or a Superadmin can mark it resolved or reopen it, while a resolved thread accepts no new replies until it is reopened, and when a note is approved, an Approved badge appears on that note in the Findings Log.

Comments can be edited and are then labeled as edited, and a comment that has replies cannot be deleted until its replies are deleted first. The notification bell shows a live count for each role, with advisers seeing threads that await resolution and proponents seeing open required fixes on the notes they wrote, so that each role handles only its own part of the review.

## 9. Administration and mobile use

A Superadmin manages the team on the Members page, which has four columns for invited, pending, active, and removed members, and also controls the survey window by choosing open, paused, or closed, and can increase the version number of the question set when the questions change so that earlier results can be separated later. The workspace also adapts to phones, because the sidebar collapses behind a menu button, tables scroll inside their own frames, and form controls are enlarged for touch, and a dark mode is available.

## 10. Quality, testing, and closing

Every form validates the input and explains errors in plain language, and when the database cannot be reached, for example because an ad blocker is stopping the request, the application displays a message and does not show a blank page, while security is enforced by the database rules and not only by the interface. We tested each role and each operation, including create, read, update, and delete, the filters and sorting, the survey branching, and the phone layout, and the test cases and screenshots, together with the architecture and the database design, are included in our PDF documentation. The source code is available on GitHub and the sample login is provided in our Canvas submission, and thank you for watching.

---

## Optional footage ideas (any order, not tied to the words)

Part A:
- Title slide with members, homepage scroll
- Architecture diagram: resident, hosting, login service, database
- Live URL in a private window

Part B:
- Dashboard totals, date range, survey status
- Responses tabs: Summary, Question, Individual, and a response detail panel
- Search, phase and branch filters, sort, export, reset, delete confirmation
- Findings Log: empty-form errors, saved note, status change, delete confirmation, My Notes filter
- Interview board with columns, notes drawer, calendar
- Inquiries list with statuses
- Reviews: adviser comment, proponent reply, addressed, resolved, Approved badge
- Members board and survey control panel
- Bell notifications
- Phone-width layout with the menu button
- GitHub repository and `docs` folder

## Presenter notes (not spoken)

Facts to keep straight:
- Hosting: `firebase.json` serves the `out` folder; `next.config.js` uses a static export. Database region `asia-southeast1`; Firebase project `recares-survey`. Confirm the live URL (guess: `https://recares-survey.web.app`).
- Search covers response id, phase, resident type, and the disability screening answer (`app/admin/responses/page.tsx`). Do not say it searches free-text answers.
- Collections: `needsAssessmentResponses`, `interviewInterest`, `inquiries`, `admins`, `invites`, `findingNotes`, `adviserFeedback`, `appConfig`.
- The Findings Log and Reviews are new, and the Firebase emulator was not run for them. Rehearse them end to end before recording.
- Deleting login accounts completely is not built. Do not claim it.
- If the video runs over 20 minutes, cut sections 7 and 9 first.

If the instructor asks:
- Why no server? The site is pre-built static files, which is cheap and simple. The database rules provide the protection.
- Where is the database design? In the PDF: collections, fields, and relationships.

Canvas contribution (draft, edit to match the truth):
"I developed the admin workspace: Responses (read, search, filter, sort, export), the Findings Log and Reviews features (create, update, delete), the interview board, responsive navigation, deployment to Firebase Hosting, and the project documentation."
