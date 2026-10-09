# Midterm demo video — master checklist

**Length:** 15 minutes minimum (rubric: 15–20). Three speakers, about 5 minutes each. If the total lands under 15:00, let Kim's closing run long, not the others.
**Order:** Kim (opening) → Brent (auth) → Hoxan (survey) → Kim (admin tour + closing). See the flow note in section 3.

> Items marked **(confirm)** are my assumptions from the code. Check them with the team before recording.

---

## 1. Rubric → where each item is shown

| Rubric item | Points | Shown by | Where in video |
| --- | --- | --- | --- |
| Capstone alignment | 10 | Kim | Opening: problem, community, what this site is and is not |
| Hosting & deployment | 10 | Kim | Public URL on Firebase Hosting, static export, Firestore region |
| Login, signup, authentication | 15 | Brent | 3 signup paths, login, logout, status gates, security |
| CRUD | 25 | Hoxan (Create) + Kim (Read/Update/Delete) | Survey submit; Responses, Findings Log, Interview board, Reviews |
| Query, filtering, sorting | 15 | Kim | Responses search, phase/branch filter, sort; export |
| Quality & testing | 10 | Hoxan (validation) + Kim (testing) | Validation errors, error states, paused survey, test evidence |
| Documentation | 10 | Kim (mention) | Say that the PDF and `docs/` folder exist |
| Video | 5 | All | Clear audio, readable screen, no dead air |

---

## 2. Everything we must showcase

### Opening and architecture (Kim)
- [ ] Project title, group name, members, University of Batangas Lipa, Camella Homes Tibig
- [ ] The hosted public URL in the address bar (**confirm** `https://recares-survey.web.app`, taken from the Firebase project id `recares-survey`)
- [ ] Architecture diagram: Next.js static export → Firebase Hosting; Firebase Auth; Firestore
- [ ] Roles: Resident, Proponent, Adviser, Superadmin

### Authentication (Brent)
- [ ] Signup path A: invite link (instantly active)
- [ ] Signup path B: self-registration with shared access code → Pending
- [ ] Signup path C: Google sign-in → Finish access → Pending
- [ ] Password rules and validation messages on the signup form
- [ ] Login with email/password; wrong-password error message
- [ ] Pending, Removed and Active states (access gate)
- [ ] Logout, then show that `/admin/dashboard/` bounces to login
- [ ] Security: Firebase Auth hashes passwords, Firestore rules enforce roles on the server, access code is not a key, soft removal, invite email must match

### Survey (Hoxan)
- [ ] Resident opens the survey with no login
- [ ] Consent and eligibility gate (two checkboxes, two exit screens)
- [ ] Branching: homeowner vs tenant (A1), disability screening → accessibility follow-up (A4 → AC1), outside workers → extra permit items (A5)
- [ ] `not_shown` vs skipped
- [ ] Validation: press Continue with a required question blank
- [ ] English/Tagalog toggle; answers stored in English
- [ ] Draft on device (localStorage), "Leave the survey" dialog
- [ ] Review screen → Submit (**Create**) → thank-you
- [ ] Why we did not use Google Forms
- [ ] Survey paused or closed: submission refused (mention; demo if time)

### Admin tour: Read / Update / Delete / Query / Filter / Sort (Kim)
- [ ] Dashboard: counts, date range, survey status
- [ ] The response Hoxan just submitted appears in **Responses → Individual** (**Read**)
- [ ] Search, filter by phase and branch, sort by date/phase (**Query, Filter, Sort**)
- [ ] Export CSV
- [ ] Findings Log: create a note, edit it, change status, delete it with the confirm modal (**C, U, D**)
- [ ] Interview Invites board: move a card (**Update**)
- [ ] Reviews (adviser): comment on the note, reply, resolve
- [ ] Members & Invites (superadmin): approve a pending account
- [ ] Mobile view (resize to phone width, open the menu)
- [ ] Error handling: one failed action with a readable message

### Closing (Kim)
- [ ] Testing evidence mentioned (test cases, screenshots in PDF)
- [ ] Documentation and repo link mentioned
- [ ] Sample login credentials mentioned as "in the Canvas submission", never shown in full

---

## 3. Flow note

The story works best if data moves through the system:

1. **Kim** opens and covers hosting and architecture (about 1:30).
2. **Brent** shows how people get in and why it is secure.
3. **Hoxan** submits a survey as a resident.
4. **Kim** returns, shows that submission in Responses, then query, filter, sort, update, delete, and closes (about 3:30).

Kim speaks twice but still totals about 5 minutes. Record in separate takes and stitch.

---

## 4. Before recording (everyone)

- [ ] Hosted URL works in a private window
- [ ] Firestore rules and indexes deployed (`firebase deploy --only firestore`)
- [ ] Create a demo set of accounts: Superadmin, Proponent, Adviser, plus one *Pending* account and one unused invite
- [ ] Create the **sample account for Canvas** (Proponent) and confirm it stays Active
- [ ] Seed 8–10 test responses across phases and both branches, so filters show something
- [ ] Seed one finding note and one interview invite
- [ ] Survey Control set to **Open**
- [ ] Browser zoom 110–125 %, notifications off, extra tabs closed, one theme throughout
- [ ] Record at 1080p, mic test
- [ ] Do not show the real access code, passwords, or API keys on screen

## 5. Per-member scripts

- [kim.md](kim.md) — opening, hosting, admin CRUD/query, closing
- [brent.md](brent.md) — authentication and security
- [hoxan.md](hoxan.md) — survey logic and why not Google Forms

## 6. Canvas submission reminders

Each member submits individually: hosted link, PDF documentation, video link, sample credentials, repo link, and their **own** contribution statement. Draft contribution lines are at the bottom of each script.
