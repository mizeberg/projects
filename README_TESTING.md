# John AI — test build

> **Fixes the launch crash reported on 2026-10-04.** The previously shipped APK
> (SHA-256 `7fc17c14…`) could not start on any device: Okio was missing from the dex and
> OkHttp needs it, and the HTTP client is constructed in `Application.onCreate`, so the
> process died with `NoClassDefFoundError` before the first frame. Details in
> `docs/LAUNCH_FAILURE_2026-10-04.md`.
>
> **Candidate fix — requires physical-device confirmation.** I still have no Android
> device or emulator, so this has not been launched anywhere.

| | |
| --- | --- |
| **Application** | John AI |
| **Package** | com.johnai.app |
| **Version** | 0.1.0 (versionCode 1) |
| **Build** | R8 minified |
| **APK size** | 1,220,158 bytes |
| **SHA-256** | `f514381a04258b73294727a195d3c71435f41252b0f89495852df7490e94c356` |
| **Minimum Android** | 8.0 (API 26) |
| **Permissions** | INTERNET only |
| **Signing** | Throwaway debug key, v1 + v2 + v3 — manual sideload testing only; production release signing is still pending |
| **Runtime validation** | Not performed in the build environment |

## Fallback build

`john-ai-runtime-debug.apk` — 10,301,046 bytes, SHA-256 `5c7233e8f1d2954c56f0b2f25f24c94800f5ac4c54db4d23ace3179012a2cd14`. Same source, **no R8**,
so stack traces are readable and nothing is shrunk. Install this one if the main APK still
fails; it tells us whether R8 is involved.

## Offline verification of these files

| Check | john-ai.apk | john-ai-runtime-debug.apk |
| --- | --- | --- |
| `tools/verify-apk.py` (every referenced class present) | **PASS** — 3,175 classes, all references resolve | 4 unreachable library references (see below) |
| `apksigner verify` | v1 + v2 + v3 | v2 |
| Package / version / launcher | com.johnai.app, 0.1.0, MainActivity | same |
| Permissions | INTERNET only | INTERNET only |
| Okio / OkHttp references | none — dependency removed | none |

The non-minified build still references `ProcessLifecycleInitializer`,
`ResolvableFuture`, `ListenableFuture` and `androidx.startup.R$string`. These are reached
only through `androidx.startup.InitializationProvider`, which this APK does not declare,
so they are never loaded. R8 removes them entirely, which is why the shipped build is clean.

## What is NOT claimed

Not tested on Android. Not launch-verified. Not crash-free. **John AI has passed build and
static verification but has not yet passed physical-device runtime validation.**

See MANUAL_TEST_GUIDE.md for installation steps.
