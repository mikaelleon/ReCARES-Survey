# ReCARES Survey

**ReCARES** (Resident Centered Assistance for Reporting and Emergency System) is a **needs-assessment website** for residents of **Camella Homes Tibig, Lipa City**.

It is a capstone project by fourth-year Information Technology students at the **University of Batangas, Lipa Campus**. The team is studying whether a future reporting-and-emergency system would help this community.

This website is **not** that future system. It is the survey, the public explanation of the study, and the private tools the team uses to read answers.

---

## Contents

- [Who this is for](#who-this-is-for)
- [What the site does](#what-the-site-does)
- [Documentation](#documentation)
- [Run the site on your computer](#run-the-site-on-your-computer)
- [Pages (web addresses)](#pages-web-addresses)
- [How the software is built](#how-the-software-is-built-short)
- [Images and brand files](#images-and-brand-files)
- [Keeping docs in sync](#keeping-docs-in-sync)
- [Academic note](#academic-note)

---

## Who this is for

| Audience | What they use | Start reading |
| --- | --- | --- |
| **Residents** | Homepage, FAQ, survey, optional interview invitation, inquiry form, RAGbot chat | [For residents](docs/for-residents.md) |
| **Proponents** (student team) | Login, dashboard, responses, interview invites, members | [For proponents](docs/for-proponents.md) |
| **Advisers and reviewers** | Combined results and this documentation — not named households | [Overview](docs/overview.md) |
| **Someone installing the code** | Local server, Firebase, deploy | [Getting started](docs/getting-started.md) |

Residents never see the admin workspace. The team reaches it from a quiet **Proponent access** link in the site footer.

If a word is unfamiliar, open the [glossary](docs/glossary.md).

---

## What the site does

1. Explains the study in plain language on the homepage.
2. Lets a resident complete a **branching** survey (about **11 to 13 minutes** on the FAQ). Unfinished work can stay on **that device** as a draft. Answers go online only when they **submit**.
3. Optionally records interest in a follow-up interview if the resident agrees.
4. Lets **approved** team members review combined answers. The survey does **not** ask for a name, block, or lot.

The survey has **13 numbered steps** after consent (not an older five-step draft). Details: [The survey](docs/survey.md).

---

## Documentation

The [documentation index](docs/README.md) is the full map. Use this table as a jump list.

| Guide | Read this if you want to… |
| --- | --- |
| [Documentation index](docs/README.md) | See every guide in one place |
| [Project overview](docs/overview.md) | Understand purpose, audiences, and what is in or out of scope |
| [For residents](docs/for-residents.md) | Use the public site and take the survey |
| [The survey](docs/survey.md) | See every step, branching, drafts, and what “submit” means |
| [For proponents](docs/for-proponents.md) | Use Dashboard, Responses, Interview Invites, and Members |
| [Roles and access](docs/roles-and-access.md) | Understand Superadmin, Proponent, Adviser, invites, and pending approval |
| [Data and privacy](docs/data-and-privacy.md) | Know what is stored, what is not, and how the team talks about results |
| [Glossary](docs/glossary.md) | Look up terms used across these pages |
| [Getting started](docs/getting-started.md) | Install and run the site on a computer |
| [Deployment](docs/deployment.md) | Publish a static build to Firebase Hosting |
| [Design (plain language)](docs/design.md) | Understand colors, type, and why the site looks this way |
| [Design system (technical)](docs/DESIGN-SYSTEM.md) | Tokens, components, and implementation detail |
| [Admin access decisions](docs/ADMIN_ACCESS_DECISIONS.md) | Recorded product and security choices for the team |

**Historical (do not treat as current product):** [Before we start screen analysis](docs/before-we-start-screen-analysis.md) describes a five-step survey that is no longer live.

---

## Run the site on your computer

You need **Node.js 20 or newer**. In PowerShell, from this folder, run **one command at a time**:

```powershell
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port printed in the terminal if 3000 is busy).

To connect Firebase (login, saved responses, members):

```powershell
Copy-Item .env.local.example .env.local
```

Fill in the values, then restart the dev server. The site still starts without that file; Firebase features stay disconnected until it is filled in.

Full steps, including the first superadmin: [Getting started](docs/getting-started.md). Publishing: [Deployment](docs/deployment.md).

---

## Pages (web addresses)

Addresses use a **trailing slash** because the live site is a static export (plain files on Firebase Hosting).

| Address | Who it is for | What it is |
| --- | --- | --- |
| `/` | Residents | Homepage: about, goals, FAQ, contact |
| `/survey/` | Residents | Needs-assessment survey |
| `/survey/thank-you/` | Residents | Confirmation after submit |
| `/survey/interview/` | Residents | Standalone interview form (usually shown inside the survey) |
| `/admin/login/` | Team | Sign in |
| `/admin/signup/` | Team | Create an account (pending until a superadmin approves, unless invited) |
| `/admin/pending/` | Team | Waiting for approval |
| `/admin/complete/` | Team | Finish Google sign-in with an access code |
| `/admin/removed/` | Team | Access was withdrawn |
| `/admin/dashboard/` | Approved team | Combined results |
| `/admin/responses/` | Team with permission | Tables and charts of answers |
| `/admin/interviews/` | Team with permission | People who opted in to an interview |
| `/admin/members/` | Superadmin (manage); others (view) | People, invites, access code |

---

## How the software is built (short)

This is useful for developers. Residents and advisers can skip it.

- **Next.js 14** (App Router) with **static export** (`output: 'export'`) so the site can be hosted as files in `out/`
- **React 18** and **TypeScript**
- **Firebase** Auth and Firestore for accounts, responses, invites, and interview interest
- Visual language lives in `styles/` (see [design system](docs/DESIGN-SYSTEM.md)). The original design export is kept under `/layout` as a **reference archive**, not as the running app.

---

## Images and brand files

Put photographs in [`public/images/`](public/images/). Favicons live in [`public/favicon_io/`](public/favicon_io/). Notes: [`public/images/README.md`](public/images/README.md).

---

## Keeping docs in sync

When you change a resident flow, an admin screen, or a Firestore collection, update the matching page in `docs/` **in the same change**. Do not invent features in the docs (for example average completion time is **not** measured). How we write: [Documentation index](docs/README.md#how-these-documents-are-written).

---

## Academic note

Nothing on this site represents an established partnership with the Camella Homes Tibig Homeowners Association. The team is assessing whether a future system would be useful **before** it is designed or built. Individual survey answers are not sent to the HOA as household reports.

There is no open-source license file in this repository. Treat the code and survey instrument as **the student team’s academic work** unless the team publishes other terms.
