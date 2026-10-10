# Glossary

Words used the same way across ReCARES documentation.

| Term | Meaning |
| --- | --- |
| **ReCARES** | Resident Centered Assistance for Reporting and Emergency System — the research concept. This website is the needs-assessment survey for that concept. |
| **Resident** | Someone using the public site, typically living in (or connected to a unit in) Camella Homes Tibig. |
| **Proponent** | Research-team member. In the database this role is stored as `admin`. |
| **Superadmin** | Team member who can invite, approve, remove, and rotate the access code. |
| **Adviser** | Academic adviser role in the admin workspace. |
| **Access code** | Shared secret used when requesting a proponent account. It does not open the Dashboard by itself. |
| **Invite** | A one-email link a superadmin creates. Redeeming it can grant access immediately. |
| **Pending** | Account waiting for superadmin approval. |
| **Active** | Approved admin account. |
| **Removed** | Admin access withdrawn (soft). Sign-in may still work; data pages do not. |
| **Branching / gated questions** | Questions that appear only if an earlier answer says they apply. |
| **`not_shown`** | Stored marker meaning “this person was not asked,” not “they left it blank.” |
| **PWD screening** | The yes/no/prefer-not-to-say disability or mobility question. Not the same as the accessibility follow-up section. |
| **Accessibility path** | Extra questions after PWD screening = Yes. |
| **Draft** | Unfinished survey saved only on that device. |
| **Submit** | The moment answers are written to the online database. |
| **Firestore** | Google’s database used for responses, accounts, invites, and interview interest. |
| **Firebase Auth** | Google’s sign-in service for proponents (email/password or Google). |
| **Static export** | The site is built into plain files in `out/` for Firebase Hosting. |
| **RAGbot** | Chat helper on the resident site for survey/FAQ questions. |
| **Phase** | Subdivision phase (1–6, including Heights, Highlands, Eastgrove). |
| **Instrument version** | Short label (for example `v1`) stored on each submitted survey so later question-set changes can be compared. |
| **Survey window** | Open, paused, or closed. Only open accepts new submissions. An optional schedule (opens at / closes at) can open or close it automatically. |
| **Kanban** | Column board (for example Invited / Pending / Active / Removed). |
| **Language toggle** | English / Tagalog switch on every survey screen. Changes displayed text only; stored answers stay English. |
| **O1 (open problem discovery)** | Step 13 question listing HOA-related problem categories, including water supply or interruptions. Defined in `survey/o1.ts`. |
| **Leave dialog** | Confirmation shown when leaving the survey midway: keep progress, or erase the local draft. |
| **Shields** | Brave browser tracker blocking. Often breaks Firestore until lowered for this site. |

If you add a new resident-facing term in the product, add it here in the same pull request.
