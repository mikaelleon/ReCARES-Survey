# Project overview

ReCARES Survey is a **website for a needs-assessment study**, not a finished HOA reporting product.

---

## The name

**ReCARES** stands for **Resident Centered Assistance for Reporting and Emergency System**.

That name describes the *possible future system* the students are researching. This website’s job is to ask residents what they need **before** anyone builds that system.

---

## Why the project exists

Camella Homes Tibig residents currently deal with HOA office hours, security, permits, and reporting through existing channels. The research team wants to know, in residents’ own experience:

- whether those channels are enough
- which problems hurt most
- whether a digital system would actually help — including people who have limited internet, mobility limits, or who prefer not to post concerns in public

Answers feed an academic report. If the combined results show a system would help, the team may later take that report to the Homeowners Association. **Nothing on this site is an HOA partnership announcement.**

---

## Two sides of the same site

```
Residents                          Research team (proponents)
─────────                          ─────────────────────────
Homepage, FAQ, inquiry             Login / signup
Needs-assessment survey            Dashboard (combined counts)
Optional interview interest        Responses (tables and charts)
Thank-you page                     Interview Invites board
RAGbot chat helper                 Members & Invites (superadmin manages)
```

The **resident** side is public. The **proponent** side is locked behind a Google or email-and-password account that a **superadmin** has approved (or that was created from a personal invite).

---

## What is in scope

- A bilingual-ready instrument (English in the live UI; Filipino strings exist in the survey layer for later use).
- Branching questions so a tenant is not asked homeowner-only items, and vice versa.
- Saving a **draft on the same device** until the resident submits.
- Combined charts for the team (how many homeowners, which phase, which features people want).
- Optional interview follow-up if the resident says yes.
- Team accounts with roles and page permissions.

---

## What is out of scope (on purpose)

| Not this site | Why it matters |
| --- | --- |
| Live incident reporting to guards or the HOA | The FAQ states this clearly so residents do not treat the survey as a ticket |
| Names, block, lot, or street of a household | The instrument is designed not to collect those |
| Automatic emails from the inquiry form | The form stores a message for the team. They reply from their own inbox — the site does not send mail |
| Disabling a Firebase Auth user when someone is removed | Soft-remove in the app; Auth disable still needs a Cloud Function |
| Average time to finish the survey | Start time is not stored yet — do not invent it from the submit date |

Recorded “do not build yet” items also live in [Admin access decisions](ADMIN_ACCESS_DECISIONS.md) (average completion time).

---

## Who runs it

Fourth-year Information Technology students at the University of Batangas, Lipa Campus, with an academic adviser. Direct adviser contact on the public site is still to be added before a formal go-live, per the homepage FAQ.

---

## Related reading

- [For residents](for-residents.md)
- [The survey](survey.md)
- [For proponents](for-proponents.md)
- [Data and privacy](data-and-privacy.md)
