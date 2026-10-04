# Launch failure on a real device — root cause

**Symptom.** `dist/john-ai.apk` (SHA-256 `7fc17c14…`, 1,293,885 bytes) installed on a
physical Android phone and did not run.

**Cause.** The APK was missing Okio. OkHttp cannot function without it, and the HTTP
client is constructed eagerly during application startup:

```
JohnAiApplication.onCreate()
  └── JohnRepository(sessionStore)
        └── JohnApi(...)
              └── OkHttpClient.Builder()        ← okio.AsyncTimeout, okio.Buffer, …
```

Every one of those Okio classes was absent from `classes.dex`, so the process died with
`NoClassDefFoundError` inside `Application.onCreate`, before any Activity or Compose code
ran. That is why there was no UI at all rather than a visible error.

**Evidence.** A dex parse of the exact shipped file lists every type the bytecode
references and every type it defines. 26 referenced classes were not present, 17 of them
Okio:

```
Lokio/AsyncTimeout;  Lokio/Buffer;      Lokio/BufferedSink;  Lokio/BufferedSource;
Lokio/ByteString;    Lokio/ByteString$Companion;             Lokio/ForwardingSink;
Lokio/ForwardingSource;  Lokio/ForwardingTimeout;  Lokio/GzipSource;  Lokio/Okio;
Lokio/Options;  Lokio/Options$Companion;  Lokio/Sink;  Lokio/Source;
Lokio/Timeout;  Lokio/Utf8;
```

(The other nine were `org.conscrypt`, `org.bouncycastle`, `org.openjsse` and the
JetBrains annotations — all optional and genuinely harmless.)

## Why every check passed anyway

aapt2, d8, R8, apksigner, badging and the class audit all passed because none of them
answer the question "does this APK contain everything it references at runtime".

R8 *would* have caught it — its reference checker reports missing classes as a build
error. It stayed silent because of a rule in `app/proguard-rules.pro` that I wrote:

```
-dontwarn okhttp3.**
-dontwarn okio.**
```

That rule exists in many real projects to silence OkHttp's optional TLS providers. Applied
to `okio.**` it also silenced the one error that mattered. The earlier audit then
"confirmed" the APK by looking classes up in `mapping.txt` — but `mapping.txt` only
describes what R8 processed, not what survived into the dex, so OkHttp appeared present
while Okio was never there at all.

The underlying mistake was mine: the Okio jar never made it into the dexing classpath, and
I then suppressed the warning that said so.

## The fix

1. **Removed the dependency rather than patching around it.** `JohnApi` now uses the
   platform's `HttpURLConnection` instead of OkHttp. John AI needs four JSON verbs and a
   bearer header; the platform stack covers that, is guaranteed present on every Android
   device, and on Android is itself backed by OkHttp, so pooling, gzip and HTTP/2 still
   apply. Public API, timeouts, error codes and the offline message are unchanged. OkHttp
   was also dropped from `app/build.gradle.kts` and the version catalog, so the Gradle
   build and this one agree.

   (The dependency could not simply be added back: every Okio jar reachable from this
   environment is stored behind Git LFS or on a blocked Maven host.)

2. **Deleted the rules that hid the failure**, with a comment explaining why they must not
   come back.

3. **Added `tools/verify-apk.py`**, which parses the dex of a built APK and fails if any
   referenced class is neither defined in the APK nor provided by the Android platform.
   It reads the shipped artifact, so no keep rule can silence it. Run against the broken
   APK it reports the 26 missing classes; against the new build it passes.

## Status

**Candidate fix — requires physical-device confirmation.** No Android device or emulator
is available in the build environment, so the new APK has been statically verified but
not launched.
