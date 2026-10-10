# ReCARES Survey: Midterm Documentation

**Course:** Midterm Exam, Individual Canvas Submission
**Institution:** University of Batangas, Lipa Campus (4th-year Information Technology)
**Project:** ReCARES (Resident Centered Assistance for Reporting and Emergency System), a needs-assessment website for residents of Camella Homes Tibig, Lipa City

| Submission item | Value |
| --- | --- |
| Hosted application | `https://recares-survey.web.app` **(confirm: derived from Firebase project id `recares-survey`; replace if the live URL differs)** |
| Source code | https://github.com/mikaelleon/ReCARES-Survey |
| Demo video | `<PASTE VIDEO LINK>` |

## Group members

| Member | Main area |
| --- | --- |
| Kimberly Claire Aliwate | Admin workspace, hosting and deployment, documentation |
| Brent Justine Castillo | Authentication, access control, Firestore security rules |
| Nib Hoxan Lat | Resident survey, branching, validation, language, drafts |

---

## 1. Project overview

ReCARES is **not** the future reporting-and-emergency system. It is the study tool the team uses to find out whether such a system would help the community. It has three parts:

1. **Public site** for residents: homepage, FAQ, inquiry form, RAGbot chat, and an anonymous, branching 13-step survey in English or Tagalog.
2. **Private team workspace** (`/admin/...`) where approved members read results, keep a Findings Log, handle interview invitations and inquiries, and manage members.
3. **Firebase backend** that stores data and enforces who may read or write it.

Design points:

- The survey asks for no name, block, or lot, and residents need no account.
- Drafts stay in the resident's browser (`localStorage`). Firestore receives data only on **submit**.
- Stored answers are always in English, even when the resident used Tagalog, so analysis stays consistent.
- Survey submission is refused by the database when a superadmin pauses or closes the survey.

## 2. Architecture

```text
Resident / Team member (browser)
        |
        v
Firebase Hosting  <--  static files from `out/` (Next.js 14 static export)
        |
        |-- Firebase Authentication  (email/password, Google sign-in)
        |-- Cloud Firestore          (asia-southeast1, protected by firestore.rules)
```

| Layer | Choice |
| --- | --- |
| Framework | Next.js 14 (App Router), `output: 'export'` |
| UI | React 18, TypeScript, plain CSS design tokens, `lucide-react` icons |
| Auth | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting (project `recares-survey`, public folder `out`) |
| Languages | English, Filipino (`survey/i18n.ts`) |

There is no custom server. Protection comes from **Firestore security rules**, not from hidden buttons.

### Roles

| Role (UI label) | Stored as | Capability |
| --- | --- | --- |
| Resident | no account | Take survey, send inquiry, chat with RAGbot |
| Proponent | `admin` | Use workspace per permission switches; create/edit own findings; reply to reviews |
| Adviser | `adviser` | Read findings; start, resolve, reopen review threads |
| Superadmin | `superadmin` | Everything, including members, invites, access code, survey control |

Account statuses: **Pending**, **Active**, **Removed**, and *no profile* (Google user who has not finished the access-code step).

### Project structure

```text
app/          Pages: resident site and /admin/...
components/   survey/, admin/, dashboard/, home/, layout/, ragbot/, ui/
survey/       Instrument: schema, branching, validation, drafts, o1, i18n
lib/          firebase/, auth/, admin/ (analytics, filters, CSV export)
styles/       Global CSS and tokens
docs/         Guides
firestore.rules, firestore.indexes.json, firebase.json
```

## 3. Database design (Cloud Firestore)

| Collection | Purpose | Key fields | Who can read | Who can write |
| --- | --- | --- | --- | --- |
| `needsAssessmentResponses` | Anonymous survey submissions | answers, phase, branch, instrument version, submitted time | Active team | Anyone, **only while survey is open**; delete by Proponent/Superadmin |
| `interviewInterest` | Residents who opted in to an interview | contact details, `contactStatus` (starts `not_contacted`), `submittedAt` | Team with permission | Residents create; team updates status |
| `inquiries` | Homepage contact messages | name (optional), email, message, `status` (`new`), `createdAt` | Active team | Residents create; team updates |
| `admins` | Team profiles, document id = Auth UID | email, name, role, status, permissions, approval/removal metadata | Self, Proponents, Superadmin | Self-create (pending/invite); role, status, permissions changed by Superadmin only |
| `invites` | One-time signup invites | email, role, permissions, `used`, `createdBy`, `createdAt` | Superadmin, or matching email | Superadmin creates and revokes unused; invitee marks used |
| `findingNotes` | Findings Log (analysis notes) | title, body, tag, `status`, `questionId`, `authorUid`, timestamps | Team with permission | Proponent/Superadmin (own notes); advisers read-only |
| `adviserFeedback` | Review threads on notes | `targetType`, `targetId`, comment, severity, `status` (open / addressed / resolved), `parentId`, `replyCount` | Active team | Advisers start threads; all reply; resolve and reopen restricted |
| `appConfig` | Settings, e.g. signup access code, survey status | status, message, schedule, instrument version | Survey status public; rest team | Superadmin |
| `surveyConfigHistory` | Audit trail of survey control changes | `byUid`, `byName`, `summary`, `at` | Team | Superadmin |

Relationships:

- `admins/{uid}` matches the Firebase Auth user; `invites.email` must match the signing-up email.
- `adviserFeedback.targetId` references `findingNotes/{id}`; replies reference their root through `parentId`.
- `findingNotes.questionId` links a note to a survey field code (A1, A2, ...).
- Resident submissions are intentionally **not** linked to any identity. `interviewInterest` is stored separately from answers.

Rule highlights (`firestore.rules`):

- Soft removal of active members (`status: removed`); only unused invites and already-removed profiles can be hard-deleted.
- A user cannot change their own role, status, or permissions.
- A root review comment with replies cannot be deleted until the replies are removed.

## 4. Implemented functions

### 4.1 Resident site and survey

| Function | Notes |
| --- | --- |
| Homepage, FAQ, inquiry form | `components/home/` |
| RAGbot chat | `components/ragbot/`, `ChatWidget.tsx` |
| Consent and eligibility gate | Two required checkboxes; two exit screens record nothing |
| 13-step branching survey | Homeowner path (resident types 1-4) vs tenant path (5-6); disability screening opens accessibility step; outside workers add permit items (`survey/branching.ts`) |
| Per-step validation | Required items marked `*`, errors shown and focused (`survey/validate.ts`) |
| Open problem discovery | 13 problem categories each with a checklist (`survey/o1.ts`) |
| English / Tagalog toggle | Display only; stored answers stay English |
| Local drafts, "Leave the survey" dialog | Keep or erase draft |
| Review screen, submit, thank-you | Minimum 30 seconds before submit; refused when survey not open |
| Optional interview invitation | Stored separately from answers |
| Dark mode, mobile-first layout | `components/layout/` |

### 4.2 Authentication and access

| Function | Notes |
| --- | --- |
| Signup by invite link | Same email required; active immediately |
| Self-registration with access code | Case-insensitive code; lands in **Pending** |
| Google sign-in and Finish access | Matches invite or asks for access code |
| Email/password login, logout | Errors shown for wrong password and unreachable database |
| Status gate | Active, Pending, Removed pages; route protection in `lib/auth/useAdminRouteGate.ts` |
| Rollback on failed signup | Auth account removed if profile creation fails |

### 4.3 Team workspace

| Function | CRUD / query |
| --- | --- |
| Dashboard with counts, date range, charts | Read |
| Responses: summary, per-question, per-submission views | Read |
| Search, filter by phase and branch, sort, CSV export | Query, filter, sort |
| Delete a response (Proponent/Superadmin) with confirm modal | Delete |
| Findings Log notes | Create, read, update, delete |
| Review threads (comment, reply, mark addressed, resolve, reopen) | Create, read, update, delete |
| Interview Invites kanban and availability calendar | Read, update status |
| Inquiries inbox | Read, update |
| Members and Invites board (Invited / Pending / Active / Removed) | Approve, reject, change role, set permissions, remove, delete |
| Survey control (open / pause / close, instrument version) | Update, with history |
| Notification bell, responsive drawer navigation | Read |

## 5. Screenshots

Insert screenshots below before exporting to PDF. Suggested set (save under `docs/screenshots/`):

| # | Screen | File |
| --- | --- | --- |
| 1 | Homepage | `docs/screenshots/01-home.png` |
| 2 | Survey: consent gate | `docs/screenshots/02-consent.png` |
| 3 | Survey: branching step and validation error | `docs/screenshots/03-survey-step.png` |
| 4 | Survey: Tagalog toggle | `docs/screenshots/04-tagalog.png` |
| 5 | Review screen and thank-you | `docs/screenshots/05-review.png` |
| 6 | Admin login and signup | `docs/screenshots/06-login.png` |
| 7 | Dashboard | `docs/screenshots/07-dashboard.png` |
| 8 | Responses with search, filter, sort | `docs/screenshots/08-responses.png` |
| 9 | Findings Log and delete confirm | `docs/screenshots/09-notes.png` |
| 10 | Reviews thread | `docs/screenshots/10-reviews.png` |
| 11 | Interview board | `docs/screenshots/11-interviews.png` |
| 12 | Members board | `docs/screenshots/12-members.png` |
| 13 | Survey control | `docs/screenshots/13-survey-control.png` |
| 14 | Mobile view with menu | `docs/screenshots/14-mobile.png` |

<!-- Replace each row with: ![caption](screenshots/01-home.png) -->

## 6. Testing evidence

Fill the **Result** and **Evidence** columns after running each case on the hosted site. Attach screenshots in section 5 or here.

| ID | Area | Test case | Expected result | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| T01 | Survey | Open `/survey/` without login | Survey loads | | |
| T02 | Survey | Continue without ticking both consent boxes | Cannot proceed | | |
| T03 | Survey | Click "I do not agree" | Exit screen, nothing saved | | |
| T04 | Survey | Leave a required question blank, press Continue | Error shown, focus on field | | |
| T05 | Survey | Answer A1 as homeowner, then as tenant | Different step 11 questions | | |
| T06 | Survey | Indicate disability in step 1 | Step 12 accessibility appears | | |
| T07 | Survey | Toggle English / Tagalog | Text changes, answers unchanged | | |
| T08 | Survey | Refresh mid-survey | Draft restored on same device | | |
| T09 | Survey | Submit complete survey | Thank-you page, document in Firestore | | |
| T10 | Survey | Submit while survey is paused | Submission refused with message | | |
| T11 | Auth | Signup with invite link, matching email | Active account | | |
| T12 | Auth | Signup with invite link, different email | Rejected | | |
| T13 | Auth | Self-register with correct access code | Pending page | | |
| T14 | Auth | Self-register with wrong access code | Error | | |
| T15 | Auth | Login with wrong password | Error, no entry | | |
| T16 | Auth | Log out, open `/admin/dashboard/` | Redirect to login | | |
| T17 | Auth | Removed account logs in | Removed page only | | |
| T18 | Admin | Responses: search by phase | Filtered table | | |
| T19 | Admin | Responses: filter by branch, sort by date | Correct order | | |
| T20 | Admin | Export CSV | File downloads with rows | | |
| T21 | Admin | Create, edit, delete a Findings note | Each action succeeds; delete asks confirmation | | |
| T22 | Admin | Adviser edits a finding note | Blocked (read-only) | | |
| T23 | Admin | Adviser starts review; proponent marks addressed; adviser resolves | Status flow works | | |
| T24 | Admin | Move an interview card to another status | Status saved | | |
| T25 | Admin | Superadmin approves a pending member | Member becomes Active | | |
| T26 | Admin | Resize to phone width | Drawer navigation works | | |

Static checks run before release:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

## 7. Sample login credentials

Use on `https://recares-survey.web.app/admin/login/` (confirm URL).

| Field | Value |
| --- | --- |
| Role | Proponent (Active) |
| Email | `<ENTER TEST EMAIL>` |
| Password | `<ENTER TEST PASSWORD>` |

Notes:

- This is a dedicated test account. It holds no real resident data beyond the seeded demo responses.
- It can open Dashboard, Responses, Interview Invites, Findings Log, Reviews, Inquiries, and Members (view only). Survey control is superadmin-only.
- Keep the account **Active**. Do not remove or change its role before grading.

## 8. Source code and repository

- Repository: https://github.com/mikaelleon/ReCARES-Survey
- Run locally:

```powershell
npm install
npm run dev
```

- Firebase config goes in `.env.local` (template: `.env.local.example`). Deploy: `npm run build`, then `firebase deploy --only hosting` and `firebase deploy --only firestore`.
- Further guides: `docs/README.md` (index), `docs/survey.md`, `docs/roles-and-access.md`, `docs/deployment.md`.

## 9. Individual contributions

### Kimberly Claire Aliwate

Admin workspace, hosting, and documentation.

- Responses screens: summary, per-question, and per-submission views; search, filter by phase and branch, sort, and CSV export.
- Dashboard analytics: counts, date range, charts, recent activity.
- Findings Log (create, update, delete) and adviser Reviews threads.
- Interview Invites board and availability calendar; Inquiries inbox.
- Responsive drawer navigation, notification bell, confirm-delete modals.
- Survey control panel (open, pause, close, history).
- Deployment to Firebase Hosting; Firestore indexes; project documentation in `docs/` and this midterm document.

### Brent Justine Castillo

Authentication and access control.

- Email/password and Google sign-in; logout.
- Invite-based signup and access-code self-registration; Finish access flow.
- Pending, Active, and Removed access gate and route protection (`useAdminRouteGate`).
- Role and permission model (Superadmin, Proponent, Adviser) and Members and Invites board.
- Firestore security rules for `admins`, `invites`, and role-based access to team data.
- Rollback of failed signups; password and form validation on signup.

### Nib Hoxan Lat

Resident survey.

- 13-step survey form with consent and eligibility gate.
- Branching and gating rules (`survey/branching.ts`), including homeowner/tenant paths and accessibility follow-up.
- Per-step validation (`survey/validate.ts`) and review screen.
- Open problem discovery categories (`survey/o1.ts`).
- English / Tagalog display (`survey/i18n.ts`).
- Local drafts, "Leave the survey" dialog, and saving submissions to Firestore (Create).
- Optional interview invitation form.

> Each student must submit **their own** statement on Canvas. Suggested one-line version for Kimberly:
> "I developed the admin workspace: Responses (read, search, filter, sort, export), the Findings Log and Reviews features (create, update, delete), the interview board, responsive navigation, deployment to Firebase Hosting, and the project documentation."
