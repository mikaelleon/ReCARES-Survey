# Admin access decisions (Section 8)

Recorded for the Superadmin Roles / Permissions / Invites pass. These are deliberate choices, not silent defaults.

## 1. Bootstrapping the first superadmin

**Choice: Manual create in Firebase Console**

Before anyone uses self-registration for access, create the first `admins/{uid}` document in the Firebase Console (or Emulator UI) for an already-created Auth user:

| Field | Value |
|-------|--------|
| **Document ID** | **Firebase Auth UID** (Authentication → Users → copy UID). Not Auto-ID. |
| `fullName` | (name) |
| `email` | (must match Auth email exactly, usually lowercase) |
| `requestedRole` | `superadmin` |
| `role` | `superadmin` |
| `status` | `active` |
| `permissions` | `{}` (superadmin bypasses permission flags) |
| `createdAt` | timestamp |
| `approvedAt` | timestamp |

If the document was created with the wrong ID, signing in as that email will attempt to **relink** the active profile onto `admins/{authUid}` (see `linkingFromExistingEmailDoc` in `firestore.rules`).

**Not chosen:** empty-collection self-assign of `role: 'superadmin'` (race risk on concurrent first signups).

**Brave / ad blockers:** Shields must allow `firestore.googleapis.com` or the app cannot read the admin profile and will stay on Finish access.

## 2. Hard delete vs soft removal

**Choice: Soft removal only for this pass**

- Active members: `status: 'removed'` + `removedAt` / `removedBy`. No client hard-delete of active docs.
- Pending reject: delete the pending `admins` document only (never granted access). Auth-account disable still needs a Cloud Function (Section 7); not built in this pass.
- Hard-delete of Auth + Firestore for former members is out of scope until a separate confirmed destructive action exists.

## 3. Invite read / redeem (Section 6 tension)

**Choice: Auth-first + email-matched rules (no Cloud Function yet)**

1. Create Firebase Auth user (email/password) or complete Google sign-in.
2. Read `invites/{id}` only when `request.auth.token.email` equals `resource.data.email` (or reader is active superadmin).
3. Create `admins/{uid}` as `active` with optional `inviteId`; rules verify the unused invite.
4. Mark invite `used` (email match, `used: false` → `true` only).

Do **not** deploy `allow read: if request.auth != null` on invites.
