# For proponents

Proponents are the people who **run the study**: student team, academic adviser, and the superadmin who grants access.

This page is a field guide to the admin workspace. For *who is allowed to do what*, read [Roles and access](roles-and-access.md).

---

## Sign in

1. Open **Proponent access** in the public footer, or go to `/admin/login/`.
2. Use **email and password**, or **Continue with Google**.
3. What happens next depends on your account:

| After sign-in | You land on |
| --- | --- |
| Approved and active | Dashboard |
| New self-registration | Pending (wait for a superadmin) |
| Google account with no profile yet | Finish access (enter the shared access code) |
| Access withdrawn | Removed |

If the login card never finishes loading, turn down Brave Shields or allow `firestore.googleapis.com`. The app cannot read your profile if Firestore is blocked.

If **sign-up** fails, read the exact message. “Sign-up was blocked by the database access rules” is a permissions problem (see [Roles and access](roles-and-access.md#common-problems)), not an ad-blocker problem.

---

## The workspace layout

- **Green sidebar** (left): Dashboard, Responses, Interview Invites, Findings Log, Reviews, Inquiries, Members & Invites, and (superadmin) Survey control. At **900px wide and below** (phones, small tablets) the sidebar becomes a drawer: tap the **menu button** (☰) in the top bar to open it; tap the backdrop, the ✕, or press Esc to close it. Proponent, adviser, and superadmin accounts all use the same layout.
- **Account footer:** your name, role, status, **Log out**, and **Back to resident site**.
- **Bell:** unread inquiries, uncontacted interview opt-ins, pending access requests (superadmin), review threads that need your role (required fixes on your notes, or addressed threads if you are an adviser), and a notice if the survey is paused or closed.
- **Moon:** dark / light theme.

You only see Responses or Interview Invites if a superadmin turned on those **permissions** for your account (superadmins see everything).

---

## Dashboard

Combined counts for the date range at the top.

**Typical headline numbers**

- Total respondents (progress toward a research target of **100**)
- Homeowners (resident types 1–4, including household members of homeowners)
- PWD screening = Yes (the screening question — not the same as the accessibility *path*)
- Tenants (resident types 5–6)

Below that: charts, recent submissions, and (for superadmins) recent member activity.

**Date range** is remembered for the browser session and is shared with Responses. Empty range shows a calm dash (“—”), not a flashing zero.

The dashboard also shows whether the public survey is **open, paused, or closed**, and which **instrument version** (for example `v1`) new submissions will be stamped with.

**Demo data:** the live dashboard reads Firestore. A sample dataset is only for explicit demo (`?demo=sample` on Responses). Do not treat demo rows as community results.

---

## Responses

Three ways to look at the same answers:

| Tab | Use it to |
| --- | --- |
| Summary | Pinned charts (you can add or remove widgets for *your* account) |
| Question | One question at a time |
| Individual | Each submission as a row, then a side panel for detail |

You can filter by phase and branch, sort, export CSV, and copy a text summary. **Delete** (Individual table, detail card, or detail drawer) permanently removes the live Firestore document after confirmation. Demo sample mode (`?demo=sample`) still only deletes locally and can be undone for a few seconds. Delete stays disabled if Firestore is not loaded.

Gated fields the resident was not asked show as **`not_shown`**.

---

## Findings Log

Analysis notes about survey results, linked to a Responses question. Permission: **Findings log**.

| Who | Can |
| --- | --- |
| Proponent / Superadmin | Create, edit, and delete **their own** notes |
| Adviser | Read the list and detail only (no create/edit/delete controls; rules block writes) |

Each note has a title, body, tag (barrier / theme / anomaly / recommendation), status (draft → reviewed → final), and a linked question. **Final** notes are locked until the author reverts status to draft. Duplicate titles for the same question (same author) and a 100-note cap per author are enforced in the app.

From Responses → **Question**, use **Add note for this question** to open the form with that question prefilled. Filter/sort on the Findings Log page; use **My notes** to see only yours. Open a note to read the adviser review thread, reply, and mark it addressed. An **Approved** badge appears on notes an adviser has approved. You cannot start a review or resolve one — that stays with the adviser. See [For advisers](for-advisers.md).

Deploy updated `firestore.rules` and `firestore.indexes.json` so reads/writes and composite filters succeed.

**Manual checks (rules + UI)**

1. Proponent with Findings log on: create a note → appears in the list; edit title/body/status; delete a draft.
2. Mark a note **final** → edit/delete blocked until status is reverted to draft (unlock flow).
3. Duplicate title on the same question (same author) → client error, no new doc.
4. Adviser with Findings log on: list/detail visible; no New/Edit/Delete; a direct `create`/`update`/`delete` from the console as that user is denied.
5. Offline / blocked Firestore → error banner or empty-state message, not a blank page.
6. Responses → Question → **Add note for this question** opens `/admin/notes/?new=1&questionId=…` with the question selected.

---

## Interview Invites

People who agreed to a follow-up interview.

- Board columns follow outreach: not contacted → contacted → confirmed.
- **Delete** on any card permanently removes the invite from Firestore (including notes). Use it for test opt-ins or when the person asked to be forgotten.
- Sort the board by newest, oldest, or email.
- Each card has **Notes** for call/email history (team only — never joined to anonymous survey answers).
- **Export contacts CSV** downloads this roster only (email, preferences, status, notes). It is not the full survey CSV.
- A calendar highlights preferred weekdays (open invites only).
- Only people with the **Interview invites** permission (or superadmin) can change statuses.

---

## Members & Invites

**Everyone** who is an active admin can open this page to see who is on the team.

Only a **superadmin** can:

- Create an invite link for a specific email and role
- Approve or reject pending sign-ups
- Change roles and page permissions
- Soft-remove an active member
- Rotate the **signup access code**
- Permanently delete an unused invite or an already-removed record

The board is a kanban: **Invited → Pending approval → Active → Removed**.

Each card has a coloured rail for the role (green Proponent, blue Adviser, orange Superadmin). Long names and emails are shortened with an ellipsis; hover to see the full value. Confirmations such as “Invite link copied.” appear as a dismissible notice that hides itself after a few seconds.

Invites do **not** send email from this app. Copy the signup link and send it yourself.

---

## Inquiries

Messages from the homepage contact form. All active admins can open this list.

- Statuses: new, in progress, resolved
- Sort by newest, oldest, or sender name
- Use **mailto** on the email to reply from your own inbox — the app does not send email
- **Delete** permanently removes the message from Firestore
- New and in-progress items appear on the **bell**

---

## Survey control (superadmin)

Pause or close the public survey without a code change.

| Window | What residents see |
| --- | --- |
| **Open** | They can start and submit. Each new response is stamped with the **instrument version** (starts at `v1`). |
| **Paused** | A message that the survey is on hold. Submits are blocked in the app and in Firestore rules. |
| **Closed** | A message that the study has ended. Same block as paused. |

Bump the instrument version only when the question set actually changes, so charts can still be split later.

---

## Permissions (pages)

| Permission | Unlocks |
| --- | --- |
| Responses dashboard | `/admin/responses/` |
| Interview invites | `/admin/interviews/` |
| Findings log | `/admin/notes/` (write for Proponent/Superadmin; read-only for Adviser) |

Dashboard and Members remain available to active admins. Superadmin ignores the permission flags and can do all of the above.

---

## If Firestore looks empty

1. Confirm you are on the **active** account (not pending).
2. Disable Shields / ad blockers for the site.
3. Confirm Firebase config in `.env.local` matches the project that has data.
4. Confirm Firestore rules were deployed (`firestore.rules`).
5. Confirm residents have actually **submitted** (drafts on phones never appear here).

---

## Related reading

- [Roles and access](roles-and-access.md)
- [The survey](survey.md)
- [Data and privacy](data-and-privacy.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md)
