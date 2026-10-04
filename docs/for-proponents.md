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

---

## The workspace layout

- **Green sidebar** (left): Dashboard, Responses, Interview Invites, Members & Invites. On a phone this is a menu.
- **Account footer:** your name, role, status, **Log out**, and **Back to resident site**.
- **Bell:** notifications placeholder (empty until real alerts exist).
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

**Demo data:** the live dashboard reads Firestore. A sample dataset is only for explicit demo (`?demo=sample` on Responses). Do not treat demo rows as community results.

---

## Responses

Three ways to look at the same answers:

| Tab | Use it to |
| --- | --- |
| Summary | Pinned charts (you can add or remove widgets for *your* account) |
| Question | One question at a time |
| Individual | Each submission as a row, then a side panel for detail |

You can filter by phase and branch, sort, export CSV, and copy a text summary. Deleting a row in the UI is a **local demo convenience** for sample data; it does not invent a Firestore “undo production delete” workflow.

Gated fields the resident was not asked show as **`not_shown`**.

---

## Interview Invites

People who agreed to a follow-up interview.

- Board columns follow outreach: not contacted → contacted → confirmed, plus withdrawn.
- A calendar highlights preferred weekdays.
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

Invites do **not** send email from this app. Copy the signup link and send it yourself.

---

## Permissions (pages)

| Permission | Unlocks |
| --- | --- |
| Responses dashboard | `/admin/responses/` |
| Interview invites | `/admin/interviews/` |

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
