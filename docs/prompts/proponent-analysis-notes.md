# Prompt: Proponent feature — Analysis Notes (Findings Log)

## Context
ReCARES NAS is a Next.js + Firebase (Auth + Firestore) survey system. Admin workspace lives under `app/admin/*`. Roles are defined in `lib/admin/access.ts` (`admin` = Proponent, `adviser`, `superadmin`). Read these before coding:
- `lib/admin/access.ts`, `lib/firebase/auth.ts` (roles, permissions, access state)
- `lib/firebase/inquiryManage.ts`, `lib/firebase/interviewManage.ts` (CRUD style to copy)
- `lib/firebase/writeErrors.ts` (error mapping), `components/admin/ConfirmDeleteModal.tsx`
- `components/admin/AdminAppShell.tsx` (sidebar), `app/admin/inquiries/page.tsx` (list-page pattern)
- `lib/admin/responseQuestions.ts` (question IDs to link notes to)
- `firestore.rules`, `firestore.indexes.json`

Match existing code style, naming, comment density, dark/light theme classes in `styles/globals.css`. Do not touch unrelated uncommitted files.

## Goal
Give Proponents a **Findings Log** to record analysis notes about survey results, with full CRUD, query, filter, sort, validation, and error handling.

## Data model — collection `findingNotes`
| Field | Type | Rules |
|---|---|---|
| `title` | string | required, 3–100 chars, trimmed |
| `body` | string | required, 10–2000 chars |
| `tag` | `'barrier' \| 'theme' \| 'anomaly' \| 'recommendation'` | required |
| `status` | `'draft' \| 'reviewed' \| 'final'` | default `draft` |
| `questionId` | string | required, must exist in `responseQuestions` |
| `authorUid` | string | set from `auth.uid`, immutable |
| `authorName` | string | snapshot of profile `fullName` |
| `createdAt`, `updatedAt` | Timestamp | server timestamps |

Business rules:
- No duplicate title per `questionId` per author (case-insensitive).
- `final` notes cannot be edited or deleted until the author reverts to `draft`.
- Max 100 notes per author.

## Features to build
1. **Create** — form (modal or drawer) with all fields, inline validation messages.
2. **Read** — table/card list at `/admin/notes`; detail view shows full body and the Adviser feedback thread (empty placeholder until the Adviser feature exists).
3. **Update** — edit own notes; change status.
4. **Delete** — own notes only, via `ConfirmDeleteModal`, hard delete.
5. **Query** — load notes ordered by `updatedAt desc`; search box matches title/body (client-side is fine).
6. **Filtering** — by tag, status, question, author ("My notes" toggle).
7. **Sorting** — by updated date, created date, title, status.
8. **Link from Responses** — in `ResponseDetailDrawer` / question view add "Add note for this question" that opens the form prefilled with `questionId`. Keep this change minimal.
9. **Loading / empty / error states** — reuse `FirestoreBlockedNotice`, `ResponseEmptyState` patterns; map Firestore errors via `writeErrors.ts`; never swallow errors.

## Files to add / change
- `lib/firebase/findingNotes.ts` — `subscribeNotes`, `createNote`, `updateNote`, `deleteNote`, `validateNoteInput` (pure, reusable by UI).
- `app/admin/notes/page.tsx` + components under `components/admin/notes/`.
- `components/admin/AdminAppShell.tsx` — sidebar link "Findings Log", visible to Proponent and Superadmin (Adviser read-only access).
- `lib/admin/access.ts` — add permission key `findingNotes` (label "Findings log") to `DASHBOARD_PERMISSION_KEYS` if per-user toggling is wanted; otherwise gate by role.
- `firestore.rules` — rules below.
- `firestore.indexes.json` — composite indexes for `(tag, updatedAt desc)`, `(status, updatedAt desc)`, `(questionId, updatedAt desc)`, `(authorUid, updatedAt desc)`.
- `docs/roles-and-access.md`, `docs/for-proponents.md` — document the feature.

## Firestore rules (enforce server-side, not just in UI)
- `read`: active admin/adviser/superadmin.
- `create`: active `admin` or `superadmin`; `authorUid == request.auth.uid`; field types, lengths and enums validated; `status == 'draft'` on create.
- `update`: author only (or superadmin); `authorUid`, `createdAt` unchanged; validated fields; blocked when existing `status == 'final'` unless the update only changes status back to `draft`.
- `delete`: author or superadmin; blocked when `status == 'final'`.
- Advisers: read only.

## Acceptance criteria
- [ ] Proponent can create, view, edit, delete own notes; cannot edit others'.
- [ ] Adviser sees notes but has no create/edit/delete controls, and rules reject the writes.
- [ ] Invalid input shows field-level messages and does not hit Firestore.
- [ ] Duplicate title, 100-note cap, and final-lock rules enforced.
- [ ] Filters and sorts combine correctly; empty state shown when none match.
- [ ] Offline/blocked Firestore shows a clear error, not a blank page.
- [ ] `npm run build` and lint pass; works at phone width and in dark mode.
- [ ] Rules tested with the Firebase emulator or documented manual test cases.

## Out of scope
Rich-text editing, attachments, notifications, editing the survey instrument.

## Deliver
Implement, run build/lint, then summarize changed files and list manual test steps.
