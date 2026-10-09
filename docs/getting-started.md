# Getting started (run the site on a computer)

This page is for someone who will **install the project on a laptop** so they can try it, change it, or show it to an adviser. You do not need to be a professional programmer, but you do need patience with a few command-line steps.

If you only want to **take the survey** as a resident, you do not need this page. Open the live website instead. See [For residents](for-residents.md).

---

## What you will have at the end

- The public homepage and survey running in a browser on your machine
- Optional: login and saved responses, if you connect a Firebase project

The live internet site is a **copy** of this project, published separately. Running it locally does not change what residents see until someone **deploys**. See [Deployment](deployment.md).

---

## What to install first

1. **Node.js 20 or newer** — from [nodejs.org](https://nodejs.org). During install, keep the option that adds Node to your PATH.
2. A copy of this repository on your computer (Git clone, or a ZIP extract).
3. A terminal. On Windows, **PowerShell** is fine. Do not chain commands with `&&` if a copied example uses that Unix style; run one command at a time.

Check Node:

```powershell
node -v
```

You should see a version that starts with `v20` or higher.

---

## Install the project libraries

In PowerShell, go to the project folder (the one that contains `package.json`):

```powershell
cd "C:\path\to\ReCARES NAS"
npm install
```

Wait until it finishes without a red error.

---

## Start the development server

```powershell
npm run dev
```

Leave that window open. Open a browser to [http://localhost:3000](http://localhost:3000).

If port 3000 is already in use, Next.js may start on **3001** (or another port) and print the URL in the terminal. Use the URL it prints.

To stop the server: focus the terminal and press `Ctrl+C`.

---

## Connect Firebase (login and saved surveys)

Without a `.env.local` file, the pages still open. Sign-in, submitting the survey to the cloud, and the member list stay disconnected.

1. In [Firebase Console](https://console.firebase.google.com), open the project (this repo’s default project id is `recares-survey` — use the project your team actually owns).
2. Enable **Authentication** → Email/Password, and Google if the team uses it.
3. Create a **Firestore** database (this project’s files name region `asia-southeast1`; match whatever the live project already uses).
4. Register a **Web app** and copy the config values.
5. In the project folder:

```powershell
Copy-Item .env.local.example .env.local
```

6. Open `.env.local` in a text editor and paste the values. Never commit this file to git.

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app config |
| `NEXT_PUBLIC_ADMIN_ACCESS_CODE` | A shared secret you invent for first signups. Later, a superadmin can rotate a live code in Members; that Firestore value then wins. |

Restart `npm run dev` after saving `.env.local` so Next.js picks up the variables.

7. Deploy **Firestore rules** at least once (`firestore.rules`), or the app will be denied in the browser. See [Deployment](deployment.md).

8. Create the **first superadmin** by hand. The app will not invent one. Steps: [Roles and access](roles-and-access.md) and [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) §1.

---

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Local server with live reload |
| `npm run build` | Production static files in `out/` |
| `npm run lint` | Checks TypeScript/React lint rules |
| `npx tsc --noEmit` | Type-checks the whole project without building |
| `npm start` | Serves a previously built Next server — **not** the usual path for this repo, because the project is configured as a **static export** |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Old behavior or an old error message after you changed code | You are viewing a stale build (for example a static server pointed at `out/`) | Use `npm run dev` for development. If you serve `out/`, run `npm run build` first, then hard-refresh (Ctrl+Shift+R) |
| “Sign-up was blocked by the database access rules” | Firestore rules rejected the sign-up | See [Roles and access](roles-and-access.md#common-problems); deploy `firestore.rules` |
| “Could not reach Firestore…” | No connection, or a blocker | Allow `firestore.googleapis.com`; lower Brave Shields; check `.env.local` |
| Pages open but nothing saves | `.env.local` missing or from another project | Fill every `NEXT_PUBLIC_FIREBASE_*` value and restart `npm run dev` |
| Type errors | — | `npx tsc --noEmit` lists them |

---

## Browser notes

- Prefer Chrome or Edge for admin work.
- **Brave Shields** (and similar blockers) often block Firestore. Allow this site or you will sit on Finish access / empty dashboards.
- After a successful local submit, check Firebase Console → Firestore → `needsAssessmentResponses`.

---

## Folder map (only what you need)

| Folder or file | Role |
| --- | --- |
| `app/` | Pages (resident site and `/admin/…`) |
| `components/` | Buttons, survey, admin screens |
| `survey/` | Question logic, drafts, validation |
| `lib/` | Firebase, auth, analytics helpers |
| `styles/` | Colors and global CSS |
| `public/` | Photos, favicons |
| `docs/` | These guides |
| `firestore.rules` | Who may read or write cloud data |
| `firebase.json` | Hosting (`out/`) and Firestore wiring |

---

## Related reading

- [Deployment](deployment.md)
- [Roles and access](roles-and-access.md)
- [Project overview](overview.md)
