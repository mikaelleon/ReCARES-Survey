# Changelog

All notable changes to ReCARES Survey are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no versioned releases yet, so everything is under **Unreleased**.

## [Unreleased]

### Added

- **Draft survey v2 (not published).** A bundled working draft (`survey/draftInstrumentV2.ts`) appears in the Survey builder as v2, Draft. It adds length of stay, tenancy length and a "unit rented out" screening question; 10 Likert questions in every rated category (5 shown by default, 5 optional and shown only after related earlier answers); and five new steps (street and event closure permits are not asked as a step in v2; they appear only as a new open problem discovery category): community concerns (CC), house rules awareness (HR), tenant orientation (TO), owner mirror (OM) and HOA communication channels (CH). Core codes, v1 wording and the O1 list are unchanged. Every hidden question stores `not_shown`. Branching rules for v2 are written up in `docs/survey-v2-branching.md`. English only; Tagalog and two items that need the house rules document and a real announcement (HR5, CH9b) are still to do. v1 stays the live version.
- **Survey builder** (`/admin/survey/builder/`) for Proponents and Superadmins: add, edit, delete, and reorder questions and steps from a simple list. Each question shows in plain words when it appears, and branching is edited with a rule builder (comparisons, all-of / any-of groups, per-choice rules). Reordering uses up/down buttons everywhere, plus row dragging on computers; on phones the editor opens full-screen. Also versioned drafts, a live preview, validation, and publish. The survey itself is now data-driven (`survey/model.ts`, `survey/defaultInstrument.ts`); the original question set ships as v1 and is used until a version is published. **Redeploy `firestore.rules`** (new `surveyInstruments` collection; Proponents may move the live-version pointer on `appConfig/survey`).
- **Tagalog support in the survey.** English / Tagalog toggle on every survey screen, remembered per browser; translations in `survey/i18n.ts`, with English fallback. Stored answers stay in English.
- **Water supply or interruptions** category in the open problem discovery step (11 choices), plus new categories: power interruptions or electrical hazards, common areas or facilities, and disputes between neighbors. Extra choices under Garbage collection and Security patrol.
- **Leave the survey dialog.** Mid-survey it offers stay, leave and keep progress, or leave and erase the local draft (with a second confirmation).
- Survey interaction improvements: focus moves to the step title on each step, the first invalid question is scrolled to and focused, an error summary appears above the buttons, 1–5 questions echo the chosen label, and the progress bar is announced to assistive technology.
- Dismissible, auto-hiding confirmation notice on the Members screen.
- Troubleshooting sections in the README, Getting started, and Roles and access guides.

### Changed

- **Survey control** now follows the Dashboard’s design language: the same stat tiles (a hero tile that reflects the window state, with progress bars), bento grid with a right rail, insight-card styling and type scale, status pill in the header, tokens, hover and entrance motion.

- **Survey control** polish: sub-text under the title, plain-language echo of schedule times, opening and closing shortcuts, warnings for past or ignored schedules, message templates for every state, save results shown at the top and auto-dismissed, focus on the first invalid field, and loading skeletons.

- **Sub-text under every page title.** Each admin page (Dashboard, Responses, Interview Invites, Findings Log, Reviews, Inquiries, Members, Survey control) and each survey screen now has a one-line description of what it shows and what to do, in English and Tagalog for the survey. New shared `PageHeading` component.

- **Survey control** redesigned: status banner with countdown, response stats, three status cards instead of a dropdown, optional automatic open/close schedule (enforced by Firestore rules), next-version suggestion with response counts, message templates with a counter, a live resident preview, a sticky save bar with Ctrl/Cmd+S and an unsaved-changes guard, in-app confirmations, and a recent-changes log. **Redeploy `firestore.rules`.**
- **Notifications** show a timestamp (relative, with the exact time on hover) and have per-item **mark as read / unread** buttons and **Mark all as read**. Opening the bell no longer marks everything read.

- **Consent and eligibility** are now two required checkboxes instead of Yes/No chips. Declining is a quiet link under the checkboxes.
- **Admin mobile navigation.** The sidebar drawer’s menu button is visible again at 900px and below; the drawer is hidden from keyboard focus while closed and its notification popover fits the drawer. Applies to proponent, adviser, and superadmin accounts.
- **Survey layout.** Long Tagalog text wraps, review rows stack on phones, and Back / Continue are pinned to the bottom on phones.
- **Interview Invites screen.** Cards no longer clip their buttons, the format badge and Delete (now red, with an icon) are clearer, chart labels such as “Afternoon” no longer overlap their bars, the calendar heat uses an absolute scale (one invite is no longer “peak”), past days are dimmed, today is marked, and a legend was added.
- **Members screen.** Cards use a neutral surface with a coloured role rail instead of solid fills; names and emails truncate with a tooltip; toolbar controls align; empty columns are compact.
- Documentation updated across the README and the survey, resident, proponent, roles, privacy, glossary, design, and getting-started guides.

### Fixed

- **Dashboard handles responses without F2 or the closure questions** (draft v2 drops them). A missing F2 is no longer stored as a neutral 3 in the dashboard; averages, the Communication quality charts, the CSV export and the individual response view leave it out; the feature ranking skips features nobody answered; the Street closure widget counts only responses that were asked the closure questions and reports residents who listed closure permits in open problem discovery; the O1 chart shows the new closure category only once someone picks it. v1 data displays as before.

- **Survey guide (`docs/survey.md`)** now matches the code: step 11 is titled "Tenant and lessee" (and "Homeowner" for homeowners), step 12 is shown to everyone, and question lists live in `survey/defaultInstrument.ts`.
- **Delete permissions.** Advisers could hard-delete submitted responses and interview invites; Firestore rules now limit those deletes to Proponents and Superadmins, and the Delete controls are hidden for Advisers. **Redeploy `firestore.rules`.**
- **Delete confirmations.** Revoking an invite, rejecting a request, and removing a member used the browser’s `confirm()` box; they now use the same in-app dialog as other deletes, with a red confirm button, a busy state, Esc to cancel, a focus trap, and `role="dialog"`.
- **Findings Log.** Deleting a note that has adviser review threads is now blocked with a clear message instead of orphaning the threads.

- **Misleading sign-up error.** `permission-denied` and `unavailable` no longer share the “Disable Brave Shields” message; a rules denial now says so.
- **Invite and self-registration sign-up** checked for duplicate emails before the account existed, which the Firestore rules reject. The Auth account is now created first and removed again if a check fails.
- **Adviser invites** were read as the Proponent role, which could make the signup write fail the rules’ role-match check. The invite’s role is now preserved.
- A denied email lookup no longer aborts sign-up.
