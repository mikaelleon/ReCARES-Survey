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

## 4. Section 4 / Section 5 on the dashboard (investigation)

**Finding: neither stale Firestore production rows nor an undeployed survey rebuild.**

| Check | Result |
|-------|--------|
| Live survey instrument (`survey/schema.ts`, `survey/review.ts`) | No Section 4 (personal safety / VAWC) or Section 5 (children). Current path: About → Digital → Facebook/comms → Security → Permits → Street closures → AI ID-validation / privacy → Homeowner **or** Tenant → Accessibility → Open problems. |
| Dashboard data source | `SAMPLE_RESPONSES` stub in `lib/admin/sampleResponses.ts` — not `needsAssessmentResponses` in Firestore. |
| Why Section 4/5 appeared | Stub records still modeled the pre-title-defense gated sections (`s4` / `s5`). |

**Fix applied:** rewrite the stub model and KPI/gate charts to live branches (homeowner, tenant/lessee, accessibility, permits extended, device-dependent). No “created after X” Firestore filter — production response wiring is still stubbed.

## 5. Duplicate Active Members (same email)

**Likely cause (confirmed in code):** Console bootstrap with a wrong document ID, then Google/email login runs `resolveAdminProfile`, which **copies** the active profile onto `admins/{authUid}` via `linkedFromDocumentId` and previously left the original doc `active`. List view then showed two Kimberly Aliwate rows.

Secondary risk: email/password Auth UID ≠ Google Auth UID, each creating its own `admins` doc (registration did not check email uniqueness).

**Fix applied:** after relink, soft-remove the superseded doc; block new `admins` creates when another doc already has that email; list dedupes by email preferring the linked Auth-UID row.

## 6. Dashboard “Live branch coverage” vs Responses gated chart

| Label | Source field | Meaning |
|-------|--------------|---------|
| Accessibility path (Dashboard) / Accessibility (Responses) | `accessibility` / survey `A4 === yes` gate | **Same gate.** Dashboard KPI is the summary count; Responses chart is the multi-flag breakdown including this gate. |
| PWD screening (Yes) (Dashboard) / PWD pie (Responses) | `pwd === 'Yes'` only | **Screening answer**, not a branch unlock. Does **not** OR-in accessibility (old `pwd \|\| accessibility` double-count removed). |
| Tenant / Homeowner | `tenant` / `homeowner` | Branch unlocks (A1). |

Do not treat “PWD screening” as interchangeable with “Accessibility path.”

## 7. Summary widgets, date range, trends, sample-size gauge

| Item | Decision |
|------|----------|
| Summary widgets | Per-admin `summaryWidgets: string[]` on `admins/{uid}`. Default = 4 pies + 2 full-width charts. Self-update allowed by existing rules (non-privileged keys). |
| Date range | Session-stored; filters Dashboard + Responses charts/stats together. Active preset = Dark Emerald filled tab. |
| Trend captions | Only when `source === 'firestore'` and a prior period of equal length exists. No invented deltas on sample stub. |
| Target gauge (“8 of N”) | **Blocked** until research team supplies a real sample-size target. Do not invent N. Same radial-ring shape as Donezo “Project Progress” when unblocked. |
| UX check (Kimberly) | Timed task: “how many renters so far” / “did communication quality move” — confirm Summary pins make that faster than all-nine-at-once. |

## 8. Donezo-style chrome (what transfers / what does not)

| Item | Decision |
|------|----------|
| Identity | Top bar: avatar initials, name, email, notification bell (empty state until real alerts exist), account menu (role/status, theme, log out). |
| Sidebar footer | “Back to resident site” only — no session block. |
| Dashboard title | Plain H1 “Dashboard” alone — no Welcome line. Name/email only in top-bar avatar menu. |
| Stat row | Soft bento four-up: Total Respondents (Dark Emerald `#13693F` hero) + Total Homeowners + Total PWD Residents + Total Tenants. Trends only when Firestore prior period exists. |
| Response data | Shared `SurveyResponsesProvider` → `needsAssessmentResponses` only. **No silent SAMPLE fallback.** Empty collection = 0. Opt-in demo only via `?demo=sample`. |
| Homeowner / Tenant KPIs | Branch groups from A1: homeowner = options 1–4 (incl. household member of homeowner); tenant = options 5–6 (incl. household member of tenant). Captions + `title` tooltips say so. |
| “Pin Summary widgets” copy | Keep — Add Widget picker is implemented on Responses Summary. |
| Active members | Avatar list + role/status pills + “+ Add Member” scroll/focus to Create invite. |
| Do not invent | Reminders, task lists, weekly bar chart (until volume), Time Tracker, mobile-app promo. |
