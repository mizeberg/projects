# John AI — physical device test checklist

> Every box below is **unchecked on purpose**. Nothing here has been executed: no Android
> device or emulator was available where this build was produced. Tick a box only when you
> have personally observed the behaviour on a real phone.

Setup instructions: [`REAL_DEVICE_TESTING.md`](../REAL_DEVICE_TESTING.md)

```
Device model: ..........................................
Android version: .......................................
APK tested: dist/john-ai-[ debug | minified ].apk
API base URL built in: .................................
Date: ..................................................
Tester: ................................................
```

Record for each failure: what you did, what you expected, what happened, and the relevant
lines from `adb logcat -b crash -d`.

---

## Installation

- [ ] APK installs (`adb install -r`)
- [ ] App icon appears in the launcher
- [ ] App launches
- [ ] No immediate crash

## Startup

- [ ] Splash/startup screen renders
- [ ] MainActivity launches
- [ ] Status and navigation bars render correctly (content not hidden behind them)
- [ ] No visible layout corruption

## Onboarding

- [ ] First-launch state is shown
- [ ] Every input accepts text
- [ ] Keyboard opens and does not cover the active field or the continue control
- [ ] Validation rejects bad input with a readable message
- [ ] Continue advances
- [ ] Back returns without losing entered values
- [ ] Completion is accepted
- [ ] Relaunching the app does not restart onboarding

## Authentication

*Implemented: email/password sign up, sign in, sign out, session persistence. Google
sign-in, password reset and biometrics are not implemented — do not test them.*

- [ ] Sign up
- [ ] Sign in
- [ ] Sign out
- [ ] Invalid credentials produce a clear error, not a crash
- [ ] Session persists across an app restart

## Home / Ministry Pulse

- [ ] Home renders
- [ ] Empty state on a brand-new account (no invented sermons, tasks or metrics)
- [ ] Loading state
- [ ] Error state when the server is stopped
- [ ] Retry works after the server is restarted
- [ ] Navigation from pulse items opens the right record

## Sermons

- [ ] Create
- [ ] Edit
- [ ] Save
- [ ] Reopen and the content is intact
- [ ] Search
- [ ] Detail screen
- [ ] Focus Mode
- [ ] Preach Mode
- [ ] Readiness percentage matches the checklist actually ticked

## Bible

*No Bible translation is embedded (licensing). Only test what the UI actually offers.*

- [ ] Passage references can be attached to a sermon
- [ ] No scripture text is displayed that the project has no licence for
- [ ] Unavailable translations are shown as unavailable rather than silently empty

## Prayer

- [ ] Create
- [ ] Edit
- [ ] Save
- [ ] Follow-up
- [ ] A private request stays private

## People

*Not implemented. Skip unless the UI offers it — do not record a result for a screen
that does not exist.*

- [ ] N/A confirmed: no people screen is reachable

## Events

- [ ] Create
- [ ] Edit
- [ ] Detail
- [ ] Save

## Expenses

- [ ] Create
- [ ] Edit
- [ ] Amounts are stored and redisplayed correctly
- [ ] Totals equal collected − spent, computed from records rather than shown as a constant

## Documents

*Upload/OCR is not implemented. Skip unless the UI offers it.*

- [ ] N/A confirmed: no document upload is reachable

## Search

- [ ] Search returns results
- [ ] Empty query behaves sensibly
- [ ] No-results state
- [ ] Tapping a result opens the real record
- [ ] Results never include another account's records

## Navigation

- [ ] Every bottom-navigation destination opens
- [ ] Every major route opens
- [ ] Back works from each screen
- [ ] Deep navigation (home → list → detail → editor) and back out again
- [ ] An unknown/stale route falls back safely instead of crashing

## UI

- [ ] Glass surfaces render as intended
- [ ] Blur renders
- [ ] Scroll reflections respond to velocity and settle when scrolling stops
- [ ] Reflections do not loop, flash, flicker or sit on top of text
- [ ] Purple accent lighting is controlled, not neon
- [ ] Buttons
- [ ] Bottom sheets
- [ ] Dialogs
- [ ] Bottom navigation sits above the gesture area
- [ ] AI orb

## Themes

- [ ] Dark mode: readable, no black-on-black controls
- [ ] Light mode: readable, glass still visible, nothing washed out

## Keyboard

- [ ] Text fields focus correctly
- [ ] IME opens and closes cleanly
- [ ] **The AI send button is never covered by the keyboard**
- [ ] Insets behave on a gesture-navigation device
- [ ] Insets behave on a device with a display cutout

## Performance

- [ ] Cold start feels responsive
- [ ] Scrolling long lists is smooth
- [ ] Animations do not stutter
- [ ] Sermon editor stays responsive with a long sermon
- [ ] No obvious frame drops during fast scrolling over glass surfaces
- [ ] Enabling system "reduce motion" visibly calms the animations

## Data

- [ ] Create data
- [ ] Close the app completely
- [ ] Reopen
- [ ] Data persists
- [ ] Rotating or backgrounding mid-edit does not lose text

## Error handling

- [ ] Airplane mode produces a clear offline message, not an infinite spinner
- [ ] Server stopped produces a clear error with a retry
- [ ] Retry succeeds once the server is back
- [ ] Expired/invalid session is handled without a crash
- [ ] Invalid input is rejected with a readable message

## Security

- [ ] Settings → App info shows **no permission beyond INTERNET**
- [ ] No password, token or JWT appears in `adb logcat`
- [ ] A second account cannot see the first account's records
