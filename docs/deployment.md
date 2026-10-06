# Deployment

This page explains how a **copy of the site** goes from a laptop to the public internet. Residents then use the hosted URL. People who only take the survey can ignore this page.

The site is built as **static files** (HTML, CSS, JavaScript) in a folder named `out/`. Firebase Hosting serves those files. There is no always-on Next.js server in production.

---

## What “static export” means in plain language

A usual website asks a server to assemble each page. This project instead **pre-builds** every page into files. That is why:

- Addresses end with a slash (`/survey/`, `/admin/login/`)
- Photos are not run through Next.js’s image optimizer (`images.unoptimized`)
- `npm start` is not the hosting path; **Firebase Hosting + `out/`** is

Config lives in `next.config.js` (`output: 'export'`, `trailingSlash: true`).

---

## Before you publish

1. [Getting started](getting-started.md) works on your machine.
2. `.env.local` has the **same** Firebase project you intend to host against.
3. Authentication providers you need (email/password, Google) are enabled.
4. The first **superadmin** document exists if the team must log in on day one.
5. You have the [Firebase CLI](https://firebase.google.com/docs/cli) and are logged in to the correct Google account.

```powershell
npm install -g firebase-tools
firebase login
firebase projects:list
```

This repository’s `.firebaserc` names project **`recares-survey`**. If your team uses a different project, change the Firebase project association on purpose; do not assume a random Google project has the data.

---

## Build the files

From the project folder:

```powershell
npm run build
```

Success creates (or refreshes) `out/`. That folder is what Hosting uploads (`firebase.json` → `"public": "out"`).

If the build fails, fix the TypeScript or Next error it prints. Do not upload a half-built `out/` from an older run without checking the timestamp.

---

## Publish the website (Hosting)

```powershell
firebase deploy --only hosting
```

Firebase prints a Hosting URL. Open it in a private window and click through:

- Homepage
- Start the survey (at least to consent)
- Footer → Proponent access → login

---

## Publish database rules

The website and the **rules** are separate deploys. Updating pages does not update who may read Firestore.

```powershell
firebase deploy --only firestore:rules
```

Indexes file: `firestore.indexes.json` (currently empty of extra indexes). If the Console later asks you to create an index, add it here so the next deploy is repeatable.

```powershell
firebase deploy --only firestore
```

deploys rules and indexes together.

---

## What lives in the cloud

| Piece | Collection or service | Who writes |
| --- | --- | --- |
| Submitted surveys | `needsAssessmentResponses` | Anyone (create). Active admins read. |
| Interview opt-in | `interviewInterest` | Anyone (create). Active admins read. |
| Team profiles | `admins` | Signed-in user (own pending/invite create); superadmin manages |
| Invites | `invites` | Superadmin create; invitee may mark used |
| Signup access code | `appConfig/signup` | Public read; superadmin update |
| Survey window + version | `appConfig/survey` | Public read; superadmin create/update/delete. Missing doc means open |
| Homepage inquiries | `inquiries` | Anyone (create). Active admins read and update status |
| Older leftover names | `responses`, `interview_contacts` | Still allowed in rules for compatibility; the **current** app writes the collections above |

Firestore location in `firebase.json`: **`asia-southeast1`**, database `(default)`.

---

## Environment variables on Hosting

`NEXT_PUBLIC_*` values are **baked into the JavaScript at build time**. Changing `.env.local` without running `npm run build` again will not change the live site.

Do not put secrets that must stay server-only into `NEXT_PUBLIC_*`. The access code is already in the same exposure class as a public env var; treat it as a shared team secret, not a cryptographic key.

---

## After go-live checklist

- [ ] Survey submit creates a document you can see in Console
- [ ] Superadmin can sign in on the hosted URL
- [ ] Brave/Shields users see the Firestore notice if they block the database
- [ ] Footer “Proponent access” is the only public admin door
- [ ] Inquiry form: a test message appears on `/admin/inquiries/`

---

## Related reading

- [Getting started](getting-started.md)
- [Data and privacy](data-and-privacy.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md)
