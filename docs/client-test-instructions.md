# KodeCupid — Milestone 1 client test instructions

This build contains the full registration, onboarding, profile and admin foundation. Everything
below can be tested in a browser; no technical knowledge needed.

> **Where to test:** `[STAGING URL — add after deployment]`
> **Admin area:** `[STAGING URL]/admin/login`
> **Support:** reply in the project thread with a screenshot and the phone number you used.

---

## 0. Before you start

- Use a phone-sized browser window or your phone — the app is built mobile-first.
- Test phone numbers are listed in section 1. You do **not** need a real SMS during this stage.
- If a screen says **“Test mode”**, that is expected: the verification code is `246810`.

---

## 1. Register with a phone number

1. Open the staging URL and tap **Create your profile**.
2. Pick your country, then type one of the test numbers (or any real number you own):
   — `+880 1711 000001` — Ayesha (complete profile, 2 photos)
   — `+1 415 555 0101` — Marcus (complete profile)
   — `+1 415 555 0102` — Sofia (complete profile)
   — `+1 415 555 0103` — Dev (**paused** profile)
   — `+1 415 555 0104` — Nora (mixed privacy settings)

   To create a brand-new member, use any unused number.
3. Tap **Send my code**. If you see the “Test mode” note, type `246810`; otherwise use the code
   from the SMS.
4. Tap **Verify and continue**.

**Expected:** you land on a “Before we start” screen. You cannot reach the profile yet — that is
the compliance gate working.

## 2. Age gate and terms (blocking checks)

1. Enter a date of birth that makes you **17 years old** and accept all three statements.
2. Tap **Continue to setup**.

**Expected:** a red “KodeCupid is for adults only” screen, and you stay signed out of your profile.
*(This is requirement #2 in the brief and is enforced by the server, not just the screen.)*

3. Sign out, register again (or return), enter a date of birth that makes you **18 or older**.

**Expected:** the setup wizard opens.

4. Try tapping **Continue to setup** without ticking the Terms or the Guidelines boxes.

**Expected:** an error message; you cannot continue. Both boxes are mandatory, and the date,
version and IP of your acceptance are stored.

## 3. Guided onboarding

Work through the steps: Welcome → About you → Work & shifts → Location → What you want → Privacy.

While testing, check these specifically:

1. **Progress bar** at the top shows the step number and percentage.
2. On “About you”, leave the display name empty and press Continue.
   **Expected:** an inline error, and nothing is saved.
3. Fill in valid details, press Continue, then **press Back**.
   **Expected:** your answers are still there.
4. Reload the page in the middle of onboarding.
   **Expected:** you return to the step you were on — data is saved after every step.
5. On the Privacy step, switch one field off, then press **Finish setup**.
6. On the final screen press **Enter KodeCupid**.

**Expected:** you land on the member home page. Nothing errors, and all your data is present.

## 4. Profile and privacy toggles

1. Open **Profile** (bottom bar on mobile, top navigation on desktop).
2. Check that the fields you hid during onboarding show a **Private** label.
3. Tap **Edit profile**, add a bio and (optionally) upload 1–3 photos, then **Save profile**.
   **Expected:** “Profile saved.” and the new details appear on the profile screen.
4. Tap **Privacy**. Switch **Religion** on and off.

**Expected:** the caption changes between “Visible to members” and “Hidden from members”
immediately — there is no save button.
5. Go back to the profile screen and confirm the Religion row shows or hides the value.
6. Back on the profile screen, tap **Pause profile**.

**Expected:** a “Paused” badge and a warning that members cannot see you. Tapping **Resume
profile** reverses it. Paused members are also hidden from the member-facing profile view.

7. Open **Settings** and confirm your profile switch, account status and the three legal
   documents with their versions.

## 5. Admin — Super Admin

1. Open `/admin/login` (link also on the member sign-in page).
2. Sign in with the Super Admin account provided separately:
   - email: `admin@kodecupid.test`
   - password: **provided in the handover message** (change it after testing)
3. Check the left-hand menu. You should see: **Members, Roles & access, Verification, Complaints,
   Data deletion, Profile corrections, Settings, Monetization**.
4. Open **Members**: search for a name or phone number, filter by status, page through the list.
5. Open any member. Check that you can see the full phone number, the legal acceptance history and
   each profile field marked “Private” where the member hid it.
6. Try **Suspend**, then **Reactivate** the member. Try **Mark for deletion**.
   *(Do not press **Delete account** on the seeded profiles unless you are happy to lose one.)*
7. Open **Roles & access**: invite an email as **Moderator**, change a role with the dropdown, and
   try disabling an admin. Note that the system refuses to remove the **last active Super Admin**.

## 6. Admin — Moderator (the permission difference)

1. Sign out of the admin area.
2. Sign in with the Moderator account:
   - email: `moderator@kodecupid.test`
   - password: **provided in the handover message**

Compare with the Super Admin session:

| Area | Super Admin | Moderator |
| --- | --- | --- |
| Members list | ✅ full phone numbers | ✅ **masked** phone numbers |
| Suspend / reactivate members | ✅ | ❌ not available |
| Delete a member account | ✅ | ❌ not available |
| Roles & access | ✅ | ❌ **not in the menu** |
| Settings / Monetization | ✅ | ❌ **not in the menu** |
| Verification, Complaints, Deletion, Corrections | ✅ | ✅ (queues arrive in Milestone 2) |

3. With the Moderator signed in, type the address `/admin/roles` directly into the browser.
   **Expected:** a clear “Role management is Super Admin only” screen — the server refuses it, not
   just the missing menu item.

## 7. What is intentionally not in Milestone 1

Discovery/browsing and matching, messaging, payments, provider verification document review,
admin two-factor authentication and the full complaint workflow are scheduled for later
milestones. The queues you can see in the admin menu are permission-gated placeholders marked
**M2**.

## 8. If something looks wrong

Please send:

- the screen (screenshot) and the exact step number from this document
- the phone number or admin email you used
- the time it happened (so we can match server logs)
