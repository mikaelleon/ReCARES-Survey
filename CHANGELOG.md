# Changelog

All notable changes to ReCARES Survey are listed here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project has no versioned releases yet, so everything is under **Unreleased**.

## [Unreleased]

### Added

- **Tagalog support in the survey.** English / Tagalog toggle on every survey screen, remembered per browser; translations in `survey/i18n.ts`, with English fallback. Stored answers stay in English.
- **Water supply or interruptions** category in the open problem discovery step (11 choices), plus new categories: power interruptions or electrical hazards, common areas or facilities, and disputes between neighbors. Extra choices under Garbage collection and Security patrol.
- **Leave the survey dialog.** Mid-survey it offers stay, leave and keep progress, or leave and erase the local draft (with a second confirmation).
- Survey interaction improvements: focus moves to the step title on each step, the first invalid question is scrolled to and focused, an error summary appears above the buttons, 1–5 questions echo the chosen label, and the progress bar is announced to assistive technology.
- Dismissible, auto-hiding confirmation notice on the Members screen.
- Troubleshooting sections in the README, Getting started, and Roles and access guides.

### Changed

- **Consent and eligibility** are now two required checkboxes instead of Yes/No chips. Declining is a quiet link under the checkboxes.
- **Admin mobile navigation.** The sidebar drawer’s menu button is visible again at 900px and below; the drawer is hidden from keyboard focus while closed and its notification popover fits the drawer. Applies to proponent, adviser, and superadmin accounts.
- **Survey layout.** Long Tagalog text wraps, review rows stack on phones, and Back / Continue are pinned to the bottom on phones.
- **Interview Invites screen.** Cards no longer clip their buttons, the format badge and Delete (now red, with an icon) are clearer, chart labels such as “Afternoon” no longer overlap their bars, the calendar heat uses an absolute scale (one invite is no longer “peak”), past days are dimmed, today is marked, and a legend was added.
- **Members screen.** Cards use a neutral surface with a coloured role rail instead of solid fills; names and emails truncate with a tooltip; toolbar controls align; empty columns are compact.
- Documentation updated across the README and the survey, resident, proponent, roles, privacy, glossary, design, and getting-started guides.

### Fixed

- **Misleading sign-up error.** `permission-denied` and `unavailable` no longer share the “Disable Brave Shields” message; a rules denial now says so.
- **Invite and self-registration sign-up** checked for duplicate emails before the account existed, which the Firestore rules reject. The Auth account is now created first and removed again if a check fails.
- **Adviser invites** were read as the Proponent role, which could make the signup write fail the rules’ role-match check. The invite’s role is now preserved.
- A denied email lookup no longer aborts sign-up.
