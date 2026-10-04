# Testing John AI on a real Android phone

> **Status: John AI has passed build/static validation but has not yet passed
> physical-device runtime validation.** No Android device or emulator existed in the
> environment where it was built, so nothing below has been executed. These are
> instructions, not results.

Both APKs are signed with a **throwaway debug key**. That is not release signing.

---

## 0. Which APK to use

| File | Build | Cleartext HTTP | Use it for |
| --- | --- | --- | --- |
| `dist/john-ai-minified.apk` | R8 minified, 1.3 MB | **off** (loopback/emulator only) | Checking that shrinking did not break anything |
| `dist/john-ai-debug.apk` | not minified, 11 MB | on (debug overlay) | Day-to-day device testing, readable stack traces |

Both are built from the same source by `tools/build-apk.sh`.

**Important:** both ship with the API base URL `http://10.0.2.2:8787`, which is only
meaningful to an *emulator*. A physical phone cannot reach that address — see §3. For
phone testing you must rebuild with your own machine's LAN address.

---

## 1. Prepare the phone

1. **Settings → About phone →** tap **Build number** seven times to unlock Developer
   options.
2. **Settings → System → Developer options →** enable **USB debugging**.
3. Connect the phone to the computer by USB.
4. Accept the *Allow USB debugging?* prompt on the phone (tick "always allow").

Nothing here is model-specific; the menu path varies slightly by manufacturer
(on Samsung it is Settings → About phone → Software information → Build number).

## 2. Confirm the phone is visible

```bash
adb devices
```

Expect one entry ending in `device`. If it says `unauthorized`, re-accept the prompt on
the phone. If the list is empty, try another cable or `adb kill-server && adb start-server`.

---

## 3. Point the app at your development server

This is the step most likely to waste your time, so do it before installing.

`10.0.2.2` is a special alias that only exists **inside an Android emulator**, where it
means "the host machine". A physical phone on Wi-Fi must reach your computer by its real
address on the local network.

**a. Find your computer's LAN address**

```bash
# macOS
ipconfig getifaddr en0          # Wi-Fi; try en1 if that is empty
# Linux
hostname -I | awk '{print $1}'
```

You want something like `192.168.1.42`. Do not use `127.0.0.1` or `localhost`.

**b. Start the server** (it already binds `0.0.0.0`, so it accepts LAN connections)

```bash
cd server
npm install
JOHN_JWT_SECRET=YOUR_DEV_SECRET npm start      # listens on 0.0.0.0:8787
```

**c. Check the phone can actually reach it.** Put the phone on the *same Wi-Fi network*,
open its browser and visit `http://192.168.1.42:8787/api/health`. If that does not
respond, the app will not work either, and the cause is almost always one of:

- phone on mobile data or a guest network instead of the same Wi-Fi
- the computer's firewall blocking inbound port 8787 (on macOS: System Settings →
  Network → Firewall)
- client isolation enabled on the router

**d. Rebuild the APK with that address**

```bash
API_BASE_URL=http://192.168.1.42:8787 \
DEBUG_RES_DIR=app/src/debug/res \
APK_NAME=john-ai-debug.apk \
  bash tools/build-apk.sh        # plus the toolchain variables listed in the script
```

or, with the authoritative Gradle build:

```bash
./gradlew :app:assembleDebug -PjohnApiBaseUrl=http://192.168.1.42:8787
```

Do not edit the IP into source files — the base URL is a build parameter precisely so
no temporary address ends up committed.

**Never expose the development server to the public internet.** It is plain HTTP with a
development secret and no rate limiting. Keep it on your LAN.

---

## 4. Install and launch

```bash
adb install -r dist/john-ai-debug.apk
adb shell monkey -p com.johnai.app 1
```

`monkey -p … 1` sends a single launch event, which is a reliable way to start the
launcher activity without knowing its full component name.

## 5. Capture logs

```bash
adb logcat -c                                              # clear first
adb shell monkey -p com.johnai.app 1                       # then launch
adb logcat -b crash -d                                     # crash buffer only
adb logcat -d | grep -E "AndroidRuntime|FATAL EXCEPTION|com.johnai.app"
```

Leave `adb logcat` streaming in a second terminal while you work through
`docs/REAL_DEVICE_CHECKLIST.md`.

---

## 6. Crash triage

Work from the crash buffer first: `adb logcat -b crash -d`.

| Symptom in the log | Likely cause | Where to look |
| --- | --- | --- |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE` | an older build signed with a different key is installed | `adb uninstall com.johnai.app`, then reinstall |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | device full | free space |
| `Resources$NotFoundException` | a resource id did not survive packaging | the aapt2 link step and the generated `R` classes |
| `ClassNotFoundException`, `NoClassDefFoundError` | something R8 removed, or a library missing from the dex | `dist/mapping.txt`; add a narrow keep rule in `app/proguard-rules.pro`; reproduce on the unminified APK to confirm R8 is the cause |
| stack frames in `androidx.compose`, `AndroidComposeView` | Compose runtime problem | compare behaviour between the minified and unminified APKs |
| `CLEARTEXT communication … not permitted` | HTTP blocked | you installed the **minified** APK against a LAN server; use the debug APK (§0) |
| `ConnectException`, `SocketTimeoutException` | server unreachable | redo §3c; wrong IP, wrong network, or firewall |
| `UnknownHostException` | bad base URL | rebuild with the correct `API_BASE_URL` |
| `SSLHandshakeException` | https:// used against the plain-HTTP dev server | use `http://` for local testing |
| HTTP `401` / `403` | token rejected or expired | sign out and in again; confirm the server's `JOHN_JWT_SECRET` did not change between runs |

If the minified APK crashes and the unminified one does not, it is an R8 keep-rule
problem — deobfuscate the trace before guessing:

```bash
# R8 ships a retrace tool; mapping.txt is written next to the APK
java -cp r8.jar com.android.tools.r8.retrace.Retrace dist/mapping.txt crash.txt
```

Do not suppress exceptions to make the log look clean.

---

## 7. Development server reference

| | |
| --- | --- |
| Start | `cd server && npm start` |
| Port | `8787` (override with `PORT`) |
| Binding | `0.0.0.0` — reachable from the LAN |
| Database | SQLite at `server/data/john.db` (override with `JOHN_DB`) |
| Dev secret | `JOHN_JWT_SECRET=YOUR_DEV_SECRET` — optional in development |
| Production | `JOHN_JWT_SECRET` is **mandatory**; with `NODE_ENV=production` the server refuses to sign tokens with the built-in development key |
| Tests | `cd server && npm test` |

Never commit a real secret. Use placeholders like `YOUR_DEV_SECRET` in notes and
scripts.

---

## 8. What to do with the results

Work through `docs/REAL_DEVICE_CHECKLIST.md` and tick only what you actually observe.
Every box in it is deliberately unchecked: no result in this repository has been
pre-filled, and no device output has been simulated.
