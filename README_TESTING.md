# John AI — test build

| | |
| --- | --- |
| **Application** | John AI |
| **Package** | com.johnai.app |
| **Version** | 0.1.0 (versionCode 1) |
| **Build** | R8 minified |
| **APK size** | 1.3M (1293885 bytes) |
| **SHA-256** | `7fc17c143dd49419c2451be7b18576f4d0823943f3987e1387a96a725f4903b9` |
| **Minimum Android** | 8.0 (API 26) |
| **Target Android** | 14 (API 34) |
| **Permissions** | INTERNET only |
| **Signing** | Throwaway debug key, v1 + v2 + v3 — suitable for manual sideload testing; production release signing is still pending |
| **Runtime validation** | Not performed in the build environment (no Android device or emulator was available) |
| **User testing** | Required |

## Offline verification performed on this exact file

| Check | Result |
| --- | --- |
| `apksigner verify` | Verifies — v1 true (at min-sdk 21), v2 true, v3 true, 1 signer |
| `aapt2 dump badging` | package com.johnai.app, versionCode 1, versionName 0.1.0, label "John AI", launchable activity com.johnai.app.MainActivity |
| Permissions | android.permission.INTERNET only |
| Native libraries | none |
| Debuggable flag | not set |
| Zip integrity | `unzip -t` — no errors, 85 entries |
| resources.arsc | stored uncompressed and 4-byte aligned, as required for targetSdk 30+ |
| Resource table | attr/color/dimen/drawable/id/integer/layout/mipmap/string/style/xml all present |
| R8 output | all references resolved; Compose UI and runtime, Material3, Lifecycle, Navigation, kotlinx.serialization, OkHttp and all John AI classes confirmed present in the dex via mapping.txt |
| Startup path | reviewed in source: no network call before the sign-in screen, HTTP confined to Dispatchers.IO, connection failures surfaced as a readable error with retry |
| Debug-only code | none found — no development logging, debug menus, test buttons or fake data |

## What is NOT claimed

Not tested on Android. Not launch-verified. Not runtime-verified. Not crash-free. No
performance measurement. **John AI has passed build and static verification but has not
yet passed physical-device runtime validation.**

## Backend

The app talks to a John AI server that you run yourself; this APK contains only the phone
client. Its built-in address is `http://10.0.2.2:8787`, which is an Android *emulator*
alias and is deliberately not a real machine on your network — no LAN IP has been
hardcoded. Without a reachable server you can test installation, launch and the sign-in
screen; the app is expected to show a readable "offline" message rather than crash or hang.
Connecting a real server is described in REAL_DEVICE_TESTING.md.

See MANUAL_TEST_GUIDE.md for installation steps and the test checklist.
