# John AI — installing and testing on your phone

No computer, no cables, no developer tools. Download one file, install it, open it.

---

## If you tested the previous APK and it did not run

That was a real bug and it is now fixed: Okio was missing from the app, OkHttp needs it,
and the HTTP client is built during startup — so the app died before drawing anything.
Root cause and evidence: `docs/LAUNCH_FAILURE_2026-10-04.md`.

**Candidate fix — it still needs your confirmation on a real phone**, because there is no
Android device in the environment where it was built.

Please install **`dist/john-ai.apk`** (rebuilt, 1.2 MB) and tell me which happens:

**TEST A — `john-ai.apk`**
- **A.** Installs and launches
- **B.** Installs but immediately closes
- **C.** Android says it cannot be installed
- **D.** Icon appears but tapping does nothing
- **E.** Android shows a crash message
- **F.** Something else

If TEST A is anything other than A, install **`dist/john-ai-runtime-debug.apk`** (9.9 MB,
same code with no shrinking) and report the same A–F for **TEST B**. The difference
between the two tells us immediately whether R8 is involved.

---

## ⚠️ Read this first — how far you can get

John AI keeps a pastor's sermons, prayers and notes on a **backend server** that you run.
This APK is the phone app only; it does not contain a server.

**With no server running, you can test:**

- installing and opening the app
- the splash screen and the John AI branding
- the sign-in / create-account screen
- typing, the keyboard, dark and light appearance
- the error state when it cannot reach the server

**You will not be able to get past the sign-in screen**, because creating an account needs
the server. When you tap *Create account* you should see a calm message along the lines of
*"You appear to be offline. John will retry when you reconnect."* with a retry option.

**That message is the correct result, not a bug.** Please tick it as a pass on the
checklist. A crash, a frozen screen or a spinner that never stops would be a real failure —
those are exactly what this round of testing is looking for.

Getting further than the sign-in screen needs the backend running on a computer on your
Wi-Fi, and the app rebuilt to point at it. That is covered in `REAL_DEVICE_TESTING.md`
and is a separate exercise.

---

## Step 1 — Get the file onto your phone

Download **`john-ai.apk`** (about 1.3 MB) to the phone — email it to yourself, put it in
Google Drive, or copy it across however you normally move files.

## Step 2 — Open it

Open your phone's **Files** app (or **Downloads**), find `john-ai.apk` and tap it.

## Step 3 — Allow the installation

Because this app did not come from the Play Store, Android will ask for permission the
first time. You will see something like:

> *For your security, your phone is not allowed to install unknown apps from this source.*

Tap **Settings**, turn on **Allow from this source**, then press **Back**. Android returns
you to the install screen. Depending on the phone this toggle is called *Install unknown
apps* or *Install from unknown sources*.

## Step 4 — Install

Tap **Install**. If Play Protect warns that the app was not scanned or is from an unknown
developer, choose **Install anyway** — this build is signed with a test key, not a Play
Store key, which is exactly what Android is pointing out.

## Step 5 — Open John AI

Tap **Open**, or find the **John AI** icon in your app drawer.

## Step 6 — Work through the checklist

Use the checklist below. Tick only what you actually see.

---

## If something goes wrong

| What you see | What it means |
| --- | --- |
| *App not installed* | An older John AI is already on the phone. Uninstall it and try again. |
| *There was a problem parsing the package* | The file did not download fully. Download it again. |
| *Blocked by Play Protect* | Expected for a test-signed app — choose **Install anyway**. |
| Needs Android 8.0 or newer | This app requires Android 8.0 (Oreo) or later. |
| The app closes immediately | A real bug. Note what you did and tell me — this is the most valuable thing you can report. |

Reporting a problem is most useful with: which screen you were on, what you tapped, what
you expected, and what happened instead. A photo or screen recording is ideal.

---

# Test checklist

Every box is empty on purpose. Nothing here has been tested on a phone.

### INSTALL

- [ ] APK installs
- [ ] App icon appears
- [ ] App opens

### STARTUP

- [ ] No crash
- [ ] UI loads
- [ ] System bars look correct (nothing hidden behind the clock or the gesture bar)

### ONBOARDING

*Reachable only once an account exists, so this needs the backend. Skip for now unless you
have the server running.*

- [ ] Screens work
- [ ] Inputs work
- [ ] Keyboard works
- [ ] Continue works
- [ ] Back works

### HOME

*Also behind sign-in — needs the backend.*

- [ ] Home loads
- [ ] Cards work
- [ ] Navigation works
- [ ] Empty states work

### SERMONS

*Also behind sign-in — needs the backend.*

- [ ] Create sermon
- [ ] Edit sermon
- [ ] Save sermon
- [ ] Reopen sermon
- [ ] Search sermon

### NAVIGATION

- [ ] Bottom navigation
- [ ] Back navigation
- [ ] Screen transitions

### UI

- [ ] Glass effects
- [ ] Blur
- [ ] Purple lighting
- [ ] Buttons
- [ ] Dialogs
- [ ] Sheets
- [ ] Bottom navigation
- [ ] Animations

### THEMES

- [ ] Dark mode
- [ ] Light mode (switch your phone between light and dark in Settings → Display)

### KEYBOARD

- [ ] Text fields
- [ ] Keyboard doesn't cover controls
- [ ] Scrolling while keyboard is open

### DATA

*Needs the backend.*

- [ ] Create content
- [ ] Close app
- [ ] Reopen app
- [ ] Verify content persists

### NETWORK

- [ ] App launches with no network
- [ ] Error state appears correctly (a readable message, not a frozen screen)
- [ ] Retry works

### CRASHES

- [ ] No crash during normal use

---

## Status

**John AI has passed build and static verification but has not yet passed physical-device
runtime validation.** This APK is signed with a throwaway test key and is suitable for
manual sideload testing; production release signing is still pending. You are the first
person to run it on real hardware.
