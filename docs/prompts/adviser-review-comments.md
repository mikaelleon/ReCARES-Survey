# Prompt: Adviser feature — Review Comments (Feedback Threads)

## Context
ReCARES NAS is a Next.js + Firebase (Auth + Firestore) survey system. Admin workspace lives under `app/admin/*`. Roles are in `lib/admin/access.ts` (`admin` = Proponent, `adviser`, `superadmin`). Currently Proponent and Adviser share the same permissions; this feature is the first Adviser-specific capability. It depends on the Proponent **Findings Log** (`findingNotes`, see `proponent-analysis-notes.md`). Build that first, or stub the note lookup.

Read before coding:
- `lib/admin/access.ts`, `lib/firebase/auth.ts`
- `lib/firebase/inquiryManage.ts` (CRUD style), `lib/firebase/writeErrors.ts`
- `components/admin/ConfirmDeleteModal.tsx`, `components/admin/AdminAppShell.tsx`
- `lib/admin/useAdminNotifications.tsx` (bell badges)
- `firestore.rules`, `firestore.indexes.json`

Match existing style and theming. Do not touch unrelated uncommitted files.

## Goal
Let Advisers review Proponent findings by leaving structured comments, track them to resolution, and let Proponents reply — with full CRUD, query, filter, sort, validation, and error handling.

## Data model — collection `adviserFeedback`
| Field | Type | Rules |
|---|---|---|
| `targetType` | `'note' \| 'question' \| 'instrument'` | required |
| `targetId` | string | required; for `note` must be an existing `findingNotes` doc |
| `comment` | string | required, 5–1000 chars, trimmed |
| `severity` | `'suggestion' \| 'required_fix' \| 'approved'` | required on root comments |
| `status` | `'open' \| 'addressed' \| 'resolved'` | default `open`, root comments only |
| `parentId` | string \| null | null for a root comment, else the root's id (one reply level) |
| `authorUid`, `authorName`, `authorRole` | string | from auth/profile, immutable |
| `createdAt`, `updatedAt`, `resolvedAt` | Timestamp | server timestamps |

Business rules:
- Only root comments carry `severity` and `status`; replies have `parentId` set and no severity.
- Only Advisers (and Superadmin) create root comments. Proponents may create replies only.
- Status flow: `open → addressed` (Proponent or Adviser) `→ resolved` (Adviser only). Adviser may reopen.
- A resolved thread accepts no new replies until reopened.
- `approved` severity on a note is shown as a badge on that note.

## Features to build
1. **Create** — Adviser: comment form on a note / question / instrument with severity picker. Proponent: reply box in a thread.
2. **Read** — `/admin/reviews` inbox listing root comments with reply counts; thread view shows the root plus replies chronologically. Also show the thread inside the Findings Log note detail.
3. **Update** — author edits own comment text (mark "edited"); status transitions per the flow above.
4. **Delete** — author deletes own comment via `ConfirmDeleteModal`. Deleting a root with replies is blocked (or cascades with an explicit warning; pick one and document it).
5. **Query** — threads by target, by author, by status.
6. **Filtering** — status, severity, target type, "Mine".
7. **Sorting** — newest, oldest, severity (required_fix first), most replies.
8. **Notifications** — extend the bell: Adviser sees count of `addressed` threads awaiting resolution; Proponent sees count of `open` required_fix threads on their notes.
9. **States** — loading, empty, and error handling via `writeErrors.ts`; clear message when Firestore is blocked.

## Files to add / change
- `lib/firebase/adviserFeedback.ts` — `subscribeFeedback`, `createComment`, `createReply`, `updateComment`, `setThreadStatus`, `deleteComment`, `validateCommentInput`.
- `app/admin/reviews/page.tsx` + components under `components/admin/reviews/` (thread list, thread panel, comment form).
- `components/admin/AdminAppShell.tsx` — sidebar link "Reviews" for all active staff (Adviser primary).
- `lib/admin/access.ts` — add helpers `canCreateRootFeedback(role)` / `canResolveThread(role)`; do not break existing role helpers.
- `lib/admin/useAdminNotifications.tsx` — new badge counts.
- `firestore.rules`, `firestore.indexes.json` — see below.
- `docs/roles-and-access.md` — split Proponent vs Adviser capabilities; add `docs/for-advisers.md` short guide.

## Firestore rules (server-side)
- `read`: active admin/adviser/superadmin.
- `create` root (`parentId == null`): role `adviser` or `superadmin`; validated fields; `status == 'open'`; `authorUid == request.auth.uid`.
- `create` reply: any active staff; parent must exist, be a root, and not be `resolved`.
- `update`: author may change `comment` only; status changes limited by role per the flow; `resolved` only by adviser/superadmin; immutable fields protected.
- `delete`: author or superadmin; follow the root-with-replies decision.
- Indexes: `(targetId, createdAt asc)`, `(status, updatedAt desc)`, `(severity, updatedAt desc)`, `(authorUid, updatedAt desc)`.

## Acceptance criteria
- [ ] Adviser can create, edit, resolve, reopen, delete own comments.
- [ ] Proponent can reply and mark `addressed`, but cannot create root comments or resolve (UI hidden AND rules reject).
- [ ] Validation errors display inline; nothing invalid reaches Firestore.
- [ ] Filters/sorts combine; empty and error states handled.
- [ ] Bell badges update live for both roles.
- [ ] Thread shows inside Findings Log note detail.
- [ ] `npm run build` and lint pass; works on phone width and dark mode.
- [ ] Rules verified with emulator or documented manual test cases for each role.

## Out of scope
Email notifications, file attachments, @mentions, rich text.

## Deliver
Implement, run build/lint, then summarize changed files and list manual test steps for Adviser and Proponent.
