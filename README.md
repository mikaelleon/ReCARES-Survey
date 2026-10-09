# ReCARES Survey

**ReCARES** (Resident Centered Assistance for Reporting and Emergency System) is a **needs-assessment website** for residents of **Camella Homes Tibig, Lipa City**.

It is a capstone project by fourth-year Information Technology students at the **University of Batangas, Lipa Campus**. The team is studying whether a future reporting-and-emergency system would help this community.

This website is **not** that future system. It is the survey, the public explanation of the study, and the private tools the team uses to read answers.

---

## Contents

- [Who this is for](#who-this-is-for)
- [Features](#features)
- [Quick start](#quick-start)
- [Scripts](#scripts)
- [Documentation](#documentation)
- [Pages (web addresses)](#pages-web-addresses)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Contributing and keeping docs in sync](#contributing-and-keeping-docs-in-sync)
- [Changelog](#changelog)
- [Academic note and license](#academic-note-and-license)

---

## Who this is for

| Audience | What they use | Start reading |
| --- | --- | --- |
| **Residents** | Homepage, FAQ, survey (English or Tagalog), optional interview invitation, inquiry form, RAGbot chat | [For residents](docs/for-residents.md) |
| **Proponents** (student team) | Login, dashboard, responses, interview invites, members | [For proponents](docs/for-proponents.md) |
| **Advisers and reviewers** | Combined results, review comments, and this documentation — not named households | [For advisers](docs/for-advisers.md) |
| **Someone installing the code** | Local server, Firebase, deploy | [Getting started](docs/getting-started.md) |

Residents never see the admin workspace. The team reaches it from a quiet **Proponent access** link in the site footer.

If a word is unfamiliar, open the [glossary](docs/glossary.md).

---

## Features

**Resident site**

- Plain-language homepage: purpose, goals, FAQ, contact form, RAGbot chat.
- A **branching 13-step survey** (about 11 to 13 minutes) with a two-checkbox consent and eligibility gate, a review screen, and a thank-you page. Details: [The survey](docs/survey.md).
- **English / Tagalog toggle** on every survey screen. Only the displayed text changes; stored answers stay in English so analysis is consistent.
- **Open problem discovery** that covers water supply or interruptions, power, garbage, lights, roads and drainage, noise, parking, security, billing, permits, pets, common areas, and neighbor disputes.
- **Drafts stay on the resident’s device.** Answers go online only on **submit**. A “Leave the survey” dialog lets residents keep or erase their local draft.
- Mobile-first layout, dark mode, keyboard and screen-reader friendly focus and error handling.
- Optional follow-up interview invitation, stored separately from the anonymous answers.

**Team workspace (`/admin/…`)**

- Dashboard, Responses (summary, per-question, per-submission), Findings Log, adviser Reviews, Interview Invites, Inquiries.
- Members & Invites kanban, role-based permissions (Superadmin, Proponent, Adviser), signup access code, and Survey control (open / pause / close, instrument version).
- Responsive drawer navigation on phones and tablets.

The survey does **not** ask for a name, block, or lot.

---

## Quick start

**Requirements:** [Node.js](https://nodejs.org) 20 or newer, and a copy of this repository.

PowerShell, from the project folder, **one command at a time**:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port printed in the terminal).

To connect Firebase (login, saved responses, members):

```powershell
Copy-Item .env.local.example .env.local
```

Fill in the values and restart the dev server. The site still starts without that file; Firebase features stay disconnected until it is filled in.

Full steps, including deploying Firestore rules and creating the first superadmin: [Getting started](docs/getting-started.md). Publishing: [Deployment](docs/deployment.md).

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with live reload |
| `npm run build` | Static production build into `out/` |
| `npm run lint` | Lint the project |
| `npx tsc --noEmit` | Type-check without building |
| `firebase deploy --only hosting` | Publish `out/` to Firebase Hosting |
| `firebase deploy --only firestore:rules` | Publish `firestore.rules` (separate from Hosting) |

`npm start` is not used: the project is a **static export**, so Hosting serves files from `out/`.

---

## Documentation

The [documentation index](docs/README.md) is the full map. Use this table as a jump list.

| Guide | Read this if you want to… |
| --- | --- |
| [Documentation index](docs/README.md) | See every guide in one place |
| [Project overview](docs/overview.md) | Understand purpose, audiences, and what is in or out of scope |
| [For residents](docs/for-residents.md) | Use the public site and take the survey |
| [The survey](docs/survey.md) | See every step, branching, languages, problem categories, drafts, and what “submit” means |
| [For proponents](docs/for-proponents.md) | Use Dashboard, Responses, Interview Invites, and Members |
| [For advisers](docs/for-advisers.md) | Review findings and the instrument |
| [Roles and access](docs/roles-and-access.md) | Understand Superadmin, Proponent, Adviser, invites, pending approval, and sign-up errors |
| [Data and privacy](docs/data-and-privacy.md) | Know what is stored, what is not, and how the team talks about results |
| [Glossary](docs/glossary.md) | Look up terms used across these pages |
| [Getting started](docs/getting-started.md) | Install, run, and troubleshoot the site on a computer |
| [Deployment](docs/deployment.md) | Publish a static build to Firebase Hosting |
| [Design (plain language)](docs/design.md) | Understand colors, type, and why the site looks this way |
| [Design system (technical)](docs/DESIGN-SYSTEM.md) | Tokens, components, and implementation detail |
| [Admin access decisions](docs/ADMIN_ACCESS_DECISIONS.md) | Recorded product and security choices for the team |
| [Changelog](CHANGELOG.md) | What changed, release by release |

**Historical (do not treat as current product):** [Before we start screen analysis](docs/before-we-start-screen-analysis.md) describes a five-step survey that is no longer live.

---

## Pages (web addresses)

Addresses use a **trailing slash** because the live site is a static export (plain files on Firebase Hosting).

| Address | Who it is for | What it is |
| --- | --- | --- |
| `/` | Residents | Homepage: about, goals, FAQ, contact |
| `/survey/` | Residents | Needs-assessment survey |
| `/survey/thank-you/` | Residents | Confirmation after submit |
| `/survey/interview/` | Residents | Standalone interview form (usually shown inside the survey; English only) |
| `/admin/login/` | Team | Sign in |
| `/admin/signup/` | Team | Create an account (pending until a superadmin approves, unless invited) |
| `/admin/pending/` | Team | Waiting for approval |
| `/admin/complete/` | Team | Finish Google sign-in with an access code |
| `/admin/removed/` | Team | Access was withdrawn |
| `/admin/dashboard/` | Approved team | Combined results |
| `/admin/responses/` | Team with permission | Tables and charts of answers |
| `/admin/interviews/` | Team with permission | People who opted in to an interview |
| `/admin/notes/` | Team with permission | Findings Log |
| `/admin/reviews/` | Approved team | Adviser review threads |
| `/admin/inquiries/` | Approved team | Homepage contact messages |
| `/admin/members/` | Superadmin (manage); others (view) | People, invites, access code |
| `/admin/survey/` | Superadmin | Pause/close the survey and set instrument version |

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | **Next.js 14** (App Router) with **static export** (`output: 'export'`), hosted as files in `out/` |
| UI | **React 18**, **TypeScript**, plain CSS in `styles/` (see the [design system](docs/DESIGN-SYSTEM.md)), `lucide-react` icons |
| Backend | **Firebase** Authentication and Firestore (accounts, responses, invites, interview interest) |
| Hosting | **Firebase Hosting** |
| Languages | English and Filipino (Tagalog) for the survey, via `survey/i18n.ts` |

---

## Project structure

```text
app/          Pages: resident site and /admin/…
components/   UI building blocks
  survey/       Survey flow, steps, fields, language, leave dialog
  admin/        Admin screens (members, responses, interviews, …)
  dashboard/    Admin shell: sidebar and mobile top bar
survey/       Instrument logic: schema, branching, validation, drafts,
              o1.ts (problem categories), i18n.ts (Tagalog)
lib/          Firebase, auth, access rules, analytics helpers
styles/       Global CSS and design tokens
public/       Photos and favicons
docs/         Guides (start at docs/README.md)
firestore.rules, firestore.indexes.json, firebase.json   Firebase config
layout/       Original design export — reference archive, not the running app
```

Images and brand files: [`public/images/`](public/images/) and [`public/favicon_io/`](public/favicon_io/). Notes: [`public/images/README.md`](public/images/README.md).

---

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| “Could not reach Firestore…” | Check the connection; allow `firestore.googleapis.com` or lower Brave Shields for the site |
| “Sign-up was blocked by the database access rules” | Not a blocker problem. The invite may be used or for a different email, or the deployed rules are old: `firebase deploy --only firestore:rules` |
| An old error or old behavior after changing code | You are viewing a stale build. Use `npm run dev`, or re-run `npm run build` if serving `out/`, then hard-refresh (Ctrl+Shift+R) |
| Nothing saves | `.env.local` is missing or points to another Firebase project |

More: [Getting started → Troubleshooting](docs/getting-started.md#troubleshooting) and [Roles and access → Common problems](docs/roles-and-access.md#common-problems).

---

## Contributing and keeping docs in sync

1. Run `npx tsc --noEmit` and `npm run lint` before you commit.
2. When you change a resident flow, an admin screen, or a Firestore collection, update the matching page in `docs/` **in the same change**.
3. When you add or edit survey wording, add the Filipino string in `survey/i18n.ts` in the same change.
4. Add a line to [CHANGELOG.md](CHANGELOG.md) under **Unreleased**.
5. Do not invent features in the docs (for example, average completion time is **not** measured).

How we write: [Documentation index](docs/README.md#how-these-documents-are-written).

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

---

## Academic note and license

Nothing on this site represents an established partnership with the Camella Homes Tibig Homeowners Association. The team is assessing whether a future system would be useful **before** it is designed or built. Individual survey answers are not sent to the HOA as household reports.

There is no open-source license file in this repository. Treat the code and survey instrument as **the student team’s academic work** unless the team publishes other terms.
