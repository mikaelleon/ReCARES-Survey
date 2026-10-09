# Brent: how the team gets in, and how the data stays safe

Rubric focus: Login, Signup and Authentication (15 points).

This is voice-over only. Nothing here describes clicks or screen actions, so it fits over any footage, and each section stands alone so the editor can place clips in any order. Read it in your own voice and keep the structure.

Length: about 1,000 spoken words, roughly 6 to 7 minutes at a natural pace. The whole video has to stay between 15 and 20 minutes, so paragraphs marked (optional) can be cut if the total runs long.

---

## 1. Purpose of the access system

I'm Brent, and I will explain how a team member obtains an account, how login and logout work, what each account state means, and what protects the data. Residents answer the survey without an account, because requiring one would discourage participation, but the submitted answers are private research data, so the team's workspace is restricted to approved members. The only entry point from the public website is a link in the footer labeled "Proponent access," which is placed there so that residents, who have no use for the workspace, are not directed to it.

## 2. Three ways to create an account

There are three ways to create an account, and in all three a superadmin, who is the team member responsible for managing access, makes the final decision on who is allowed in.

The first method is an invite. The superadmin enters the teammate's email, selects a role, which is Proponent for student researchers, Adviser for the academic adviser, or Superadmin, and selects which pages the person may open, since page access is controlled by separate permissions for the Responses dashboard, the Interview Invites page, and the Findings Log. The system then generates a one-time sign-up link, and because the application does not send email, the superadmin copies the link and gives it to the teammate directly. The teammate opens the link, enters a name and a password, and must use the same email address that the invite was created for, so a different email or a link that has already been used is rejected, while a matching one produces an account that is active immediately, since the approval was given when the invite was created.

The second method is self-registration, which is meant for a person who has no invite. The person enters a full name, an email, the role being requested, a password, and an access code that the superadmin shares privately, and the form validates each field before submitting, which means the password must contain at least six characters, the confirmation must match, and a strength indicator below the field updates while the person types. After submission the account is placed in a Pending state, because the access code only shows that the person was given the team's shared secret and does not grant access to any data, so a superadmin still has to review and approve the request. The superadmin can generate a new access code at any time, and the comparison ignores uppercase and lowercase, so a code entered in lowercase is still accepted.

The third method is signing in with a Google account, which allows a person to use an existing account instead of creating another password. If the Google email matches an unused invite, the account is activated immediately, and if it does not, the person is taken to a screen called Finish access, where the same access code is entered and the account is placed in Pending, exactly as in self-registration. In every case, then, access depends on a decision made by a person on the team.

(optional) Sign-up first creates the login account and then creates the team profile, and if the second step fails, the application deletes the login account that was just created, so that no incomplete account remains.

## 3. Logging in and logging out

Login accepts an email and password or a Google account. The form reports empty fields before sending anything, a wrong password produces an error message and does not allow entry, and if the Google window is closed or the database cannot be reached, the page displays an explanation instead of remaining unresponsive.

After a successful login, the system reads the person's profile and redirects them according to the account state, so that active accounts open the Dashboard, pending accounts open the Pending page, removed accounts open the Removed page, and Google users without a profile open the Finish access page. The bottom of the sidebar displays the person's name, role, and account status together with a Log out button, and logging out ends the session.

The pages also enforce this restriction themselves, so that if a visitor who is not logged in types the address of a private page directly, the visitor is redirected to the login page and the page content is never loaded, which applies equally to the Dashboard, Responses, Interview Invites, Inquiries, Members, and the Findings Log.

## 4. The four account states

Every account is in one of four states. Pending means the person has registered and is waiting for approval, Active means the person may use the workspace, Removed means the person can still sign in but sees only a notice that access was withdrawn, and the fourth state applies to a person who signed in with Google but has not yet entered the access code, so no team profile exists for them. Only Active accounts can open the workspace.

Superadmins see new requests on the notification bell, and the Members page shows everyone in four columns named Invited, Pending approval, Active, and Removed, from which a superadmin can approve or reject a request, change a role, adjust page permissions, or remove a member. Removing an active member does not delete the record, since the profile is marked as removed together with the person who removed it and the time, which preserves a history of who had access, and only unused invites and records that are already marked as removed can be permanently deleted, which only a superadmin can do and only after a confirmation.

(optional) The first superadmin is the one account that the application cannot create by itself, so it is created manually in the Firebase console, with the profile document named after the login account's unique identifier, because automatic selection of a superadmin from an empty list could allow two people who sign up at the same time to both receive that role.

## 5. Security measures

Four measures protect the data. The first is password handling, which is performed by Firebase Authentication, so the application never stores or reads passwords, and they are kept only in a hashed form by the service.

The second is that access rules are enforced by the database and not only by the interface, because hiding a button in the page does not prevent someone from modifying the page in their own browser. The Firestore rules therefore evaluate each request by checking whether the person is signed in, whether their profile is Active, and whether their role permits the requested action, and as a result a resident can submit a survey but no one without an Active account can read a submitted answer, and a survey that has been paused or closed is also refused by the database itself.

The third is the separation of roles, in which superadmins manage members, invites, the access code, and the survey status, proponents create and manage findings, and advisers read findings and leave reviews, while the page permissions allow a superadmin to limit a new member to fewer pages until more access is needed.

The fourth is that the access code does not open any data, since it only allows a person to submit a request that a superadmin must approve.

## 6. Handoff

This covers how the team obtains access and why the data remains private to approved members, and Hoxan will now explain the survey that residents complete.

---

## Optional footage ideas (any order, not tied to the words)

- Footer link and login page
- Superadmin creating an invite and copying the link
- Sign-up form with the password hint, then the Pending screen
- Google sign-in window and the Finish access screen
- Login errors, then a successful login
- Sidebar footer showing name, role, and status
- Logout, then a protected address redirecting to login
- Removed page
- Members board with its four columns and the access code panel
- Firebase Authentication user list (blur emails)
- `firestore.rules` open on the access functions

## Presenter notes (not spoken)

Facts to keep straight:
- Code: `lib/firebase/auth.ts` (invite signup, access-code signup, Google login, email login). Route protection: `lib/auth/useAdminRouteGate.ts`. Rules: `firestore.rules`.
- The form's password minimum is 6 characters. Do not claim more.
- Access code: matching is case-insensitive; a code stored in `appConfig/signup` wins over the environment fallback.
- Hard-deleting a login account (not just the profile) needs a server function that is not built. Do not claim it.
- Check whether the Findings Log permission switch appears in your invite form before you say there are three switches.

If the instructor asks:
- What if someone guesses the access code? They still reach only Pending, with no data access.
- Where are passwords? In Firebase Authentication, hashed. Never in our database.
- Can a proponent make themselves superadmin? Read the role rules in `firestore.rules` before answering on camera.

Canvas contribution (draft, edit to match the truth):
"I developed the authentication and access-control flow: email/password and Google sign-in, invite-based and access-code signup, the Pending/Active/Removed access gate, route protection, and the Firestore security rules for the `admins` and `invites` collections."
