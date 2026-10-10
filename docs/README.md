# Documentation

These pages explain ReCARES Survey for **residents, the research team, advisers, and developers**. They are meant to be read in order if you are new, or jumped to by role if you already know the project.

If a word is unclear, open the [glossary](glossary.md).

---

## Start here

1. [Project overview](overview.md) — what ReCARES is, and what it is not.
2. Pick your role:
   - [For residents](for-residents.md)
   - [For proponents](for-proponents.md) (research team)
   - [For advisers](for-advisers.md) (review comments)
3. If you work on the survey instrument: [The survey](survey.md).
4. If you grant or request admin access: [Roles and access](roles-and-access.md).
5. If you handle personal data or ethics: [Data and privacy](data-and-privacy.md).

The repository [README](../README.md) is the short front door. This folder is the full house.

---

## For people running or reviewing the study

| Page | Contents |
| --- | --- |
| [Overview](overview.md) | Purpose, audiences, scope |
| [For residents](for-residents.md) | Homepage, FAQ, survey, chat, inquiry form |
| [The survey](survey.md) | Steps, branching, drafts, submit |
| [For proponents](for-proponents.md) | Dashboard, Responses, Interviews, Inquiries, Survey control, Members |
| [For advisers](for-advisers.md) | Review comments on findings, questions, and the instrument |
| [Roles and access](roles-and-access.md) | Superadmin, Proponent, Adviser, invites, pending |
| [Data and privacy](data-and-privacy.md) | What is stored, drafts, HOA, Brave/ad blockers |
| [Glossary](glossary.md) | Shared vocabulary |
| [Changelog](../CHANGELOG.md) | What changed, release by release |
| [Design (plain language)](design.md) | Why the site looks the way it does |

---

## For people who install, deploy, or change the code

| Page | Contents |
| --- | --- |
| [Getting started](getting-started.md) | Node, env file, local server |
| [Deployment](deployment.md) | Static build, Firebase Hosting, rules |
| [Design system](DESIGN-SYSTEM.md) | Colors, type, components, motion |
| [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) | Recorded choices (bootstrapping, delete policy, widgets) |

---

## Historical notes

These files stay in the repo so past decisions are not lost. Prefer the current guides above.

| Page | Status |
| --- | --- |
| [Before we start screen analysis](before-we-start-screen-analysis.md) | **Out of date.** Written for an earlier five-step survey. Use [The survey](survey.md) for the live instrument. |
| Design-system export under `/layout` | Visual archive. The running site uses `styles/` and `components/`. |

---

## How these documents are written

- **Lead with the reader’s job**, then supporting detail.
- **Define jargon once**, then use the same word everywhere (see the glossary).
- **Do not invent features.** If something is not built (for example average completion time), the page says so.
- **Every screen explains itself.** Each admin page and survey screen has a one-line sub-text under its title saying what it shows and what to do. Use the `PageHeading` component for new admin pages.
- **Technical files stay technical.** Access-control decisions and CSS tokens remain in their own pages so operators are not mixed with residents.

When you change a resident-facing flow or an admin screen, update the matching page in this folder in the same change.
