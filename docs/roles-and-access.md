# Roles and access

This page explains **who may enter the admin workspace** and **who may change other people’s access**. It is written for the research team. Developers should also read [Admin access decisions](ADMIN_ACCESS_DECISIONS.md).

---

## The three roles

The database stores `admin` for the everyday team role. The website **labels that role Proponent** so it matches how the study talks about itself.

| Role in the interface | Stored as | Typical person | What they can do |
| --- | --- | --- | --- |
| **Superadmin** | `superadmin` | One or two trusted students who bootstrap the project | Everything, including invites, approvals, removals, access code, and all pages |
| **Proponent** | `admin` | Other student researchers | Use the workspace; extra pages follow the permission switches. May reply on review threads and mark them addressed. Cannot start a review or resolve it |
| **Adviser** | `adviser` | Academic adviser | Same page permissions as a Proponent, plus review comments: start a thread, set severity, resolve, and reopen. Read-only on the Findings Log |

Permissions (separate from role):

- **Responses dashboard**
- **Interview invites**
- **Findings log** — analysis notes at `/admin/notes/`. Proponents and superadmins may create/edit/delete their own notes; advisers with this permission have **read-only** access (Firestore rules reject adviser writes).

Superadmin does not need those switches turned on.

---

## Four account statuses

| Status | Meaning |
| --- | --- |
| **Pending** | Account exists; cannot open Dashboard until a superadmin approves |
| **Active** | May use the workspace |
| **Removed** | May still sign in, but cannot use Dashboard or data pages |
| *(no profile)* | Google user who has not finished the access-code step |

Active members are **soft-removed** (`status: removed`). They are not silently deleted. Unused invites and already-removed rows may be hard-deleted by a superadmin after confirmation.

---

## Review comments

Reviews are the first capability that is different for Advisers and Proponents. Every active staff member can open **Reviews**.

| Action | Proponent | Adviser | Superadmin |
| --- | --- | --- | --- |
| Read threads | Yes | Yes | Yes |
| Start a comment (note, question, or instrument) | No | Yes | Yes |
| Reply in an open or addressed thread | Yes | Yes | Yes |
| Edit own comment text | Yes | Yes | Yes |
| Mark `open` → `addressed` | Yes | Yes | Yes |
| Mark `addressed` → `resolved`, or reopen | No | Yes | Yes |
| Delete own comment | Yes | Yes | Yes |
| Delete someone else's comment | No | No | Yes |

A resolved thread accepts no new replies until an adviser reopens it.

Deleting a **root** comment that still has replies is blocked. Delete each reply first, then the root. This is enforced in the app and in Firestore rules (`replyCount` must be 0).

An `approved` comment on a finding note shows an **Approved** badge on that note.

The bell stays live: an adviser (and superadmin) sees `addressed` threads waiting to be resolved. A proponent sees `open` required-fix threads on notes they wrote.

Field guide: [For advisers](for-advisers.md).

---

## How a new teammate gets in

### Path A — Invite (preferred)

1. Superadmin opens **Members & Invites** → create invite (email, role, optional permissions).
2. Superadmin copies the signup link (the app does not email it).
3. The person opens the link, creates a password (or completes Google if that flow is used), **using the same email**.
4. They become **active immediately**.

### Path B — Self-registration

1. Person opens `/admin/signup/` (no invite).
2. They enter name, email, requested role, **access code**, and password.
3. They wait on **Pending** until a superadmin approves.
4. The access code only proves they know the shared team secret. **It does not grant Dashboard access by itself.**

### Path C — Google without a profile yet

1. They sign in with Google.
2. They land on **Finish access**, enter the access code, and wait for approval (pending).

---

## First superadmin (bootstrap)

Someone must create the first superadmin **by hand** in the Firebase Console. The app will not elect a superadmin from an empty list (that would race if two people signed up at once).

1. Create a user under **Authentication**.
2. Copy that user’s **UID**.
3. In **Firestore**, create `admins/{that UID}` (document ID **must** be the UID, not an auto-ID) with:

   - `fullName`, `email` (exact Auth email)
   - `requestedRole`: `superadmin`
   - `role`: `superadmin`
   - `status`: `active`
   - `permissions`: `{}`
   - timestamps for `createdAt` and `approvedAt`

Full field table: [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) §1.

---

## Access code

- Environment fallback: `NEXT_PUBLIC_ADMIN_ACCESS_CODE` in `.env.local`.
- After a superadmin generates a code in Members, Firestore `appConfig/signup` **wins**.
- Matching is **case-insensitive** (stored and compared in uppercase).
- Treat the code like a shared password for *requesting* access, not like a Dashboard key.

---

## What teammates can see on Members

Active admins can **read** the directory (who is on the team). Only superadmin can **change** roles, permissions, invites, and the access code.

---

## Common problems

| What you see | Likely cause | What to try |
| --- | --- | --- |
| Stuck on Finish access | Firestore blocked, or `admins` document ID is not the Auth UID | Allow Firestore in the browser; check document ID; use **Check access again** |
| Two cards for the same person | Profile was created under the wrong document ID, then relinked | Superadmin should see one active row after relink; extras are soft-removed |
| Invite signup fails | Email does not match the invite | Use the invited inbox exactly |
| Login works, Dashboard bounces to pending | `status` is not `active`, or `role` is missing | Superadmin approves and assigns a role |

---

## Related reading

- [For proponents](for-proponents.md)
- [For advisers](for-advisers.md)
- [Getting started](getting-started.md)
- [Admin access decisions](ADMIN_ACCESS_DECISIONS.md)
