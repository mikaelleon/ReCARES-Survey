# For advisers

Advisers review the study’s analysis. This page is the short guide to **Reviews**. Who may do what is also in [Roles and access](roles-and-access.md).

---

## What you can do

Open **Reviews** in the sidebar. Every active staff member sees that page. Starting a review is limited to the **Adviser** and **Superadmin** roles.

A review is a thread:

1. You write a comment on a **finding note**, a **survey question**, or the **instrument** (the current version, such as `v1`).
2. You set a severity: **suggestion**, **required fix**, or **approved**.
3. The thread starts **open**.
4. A proponent (or you) can reply and mark it **addressed**.
5. Only an adviser or superadmin can mark it **resolved**, or **reopen** it.

Replies are one level deep. A resolved thread does not accept new replies until it is reopened.

You can edit your own comment text. The thread shows **Edited**. You can delete your own comment. A root comment that still has replies cannot be deleted — delete the replies first, then the root. A superadmin can delete someone else’s comment under the same rule.

On a finding note, severity **approved** shows an **Approved** badge on that note in the Findings Log.

The Findings Log itself stays read-only for advisers: you can open a note and comment, and you cannot create or edit the note.

---

## Bell

The notification bell keeps a live count of **addressed** threads that still need a resolution. Opening the bell does not clear that count; the count drops when the thread is resolved or reopened. Proponents instead see **open required-fix** threads on notes they wrote.

---

## If the page shows an error

- **Permission denied** — sign in as an active adviser, proponent, or superadmin, and deploy `firestore.rules`.
- **Composite index** — deploy `firestore.indexes.json` and wait until the `adviserFeedback` indexes finish building. The inbox itself listens to the whole collection and does not need those indexes; filtered queries do.
- **Firestore blocked** — allow `firestore.googleapis.com` (Brave Shields down for this site) and refresh.

---

## Manual checks

The Firebase emulator was not run for this change. Use two active accounts (one `adviser`, one `admin` / Proponent) after deploying rules and indexes.

### Adviser

1. Open **Reviews**. Confirm the new-review form is visible. Submit an empty comment and a 2-character comment — the error stays on the form and Firestore is not written.
2. Comment on a question with severity **required fix**. It appears in the list. Edit the text and confirm **Edited**.
3. Open a finding note and add a comment with severity **approved**. The note shows an **Approved** badge, and the same thread is inside the note detail.
4. Mark the thread **addressed**, then **resolved**. Reply box is hidden. **Reopen** brings it back to open and replies work again.
5. Add a reply, then try to delete the root. Delete stays disabled. Delete the reply, then delete the root.
6. Bell shows addressed threads until they are resolved.

### Proponent

1. Open **Reviews**. The new-review form is hidden.
2. Open an open thread, reply, and **Mark addressed**. **Resolve** and **Reopen** are not shown.
3. Edit and delete only your own reply.
4. Bell shows open required-fix threads on notes you authored, not on other people’s notes.

### Rules (deny paths)

Try these as the named role in the app or the Firestore rules playground. Each must be rejected:

| Actor | Write | Expected |
| --- | --- | --- |
| Proponent | Create a root comment (`parentId` null) | Denied |
| Proponent | Set status `addressed` → `resolved` | Denied |
| Anyone | Reply on a root whose status is `resolved` | Denied |
| Non-author | Change `comment` | Denied |
| Author | Delete a root while `replyCount` > 0 | Denied |
| Proponent | Delete another person’s comment | Denied |
| Adviser | Create or edit a `findingNotes` document | Denied (existing Findings Log rule) |

Superadmin may delete another person’s reply, and may resolve or reopen a thread.
