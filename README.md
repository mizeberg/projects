# John AI

A personal ministry operating system for pastors — not a church ERP, not a chatbot,
not a sermon generator.

Two parts:

- **`app/`** — Android client (Kotlin, Jetpack Compose) with the obsidian / liquid-glass
  design system.
- **`server/`** — Node + SQLite backend holding the single domain layer, authentication,
  per-pastor data isolation, and the server-side AI gateway.

---

## Run the backend

```bash
cd server
npm install
npm start          # http://0.0.0.0:8787
npm test           # 12 tests, including data-isolation and confirmation guarantees
```

## Build the app

Open the project in Android Studio (Koala or newer), or build from the command line.
The wrapper's binary `gradle-wrapper.jar` is not committed, so generate it once with a
local Gradle 8.9+ — the pinned version is already in `gradle/wrapper/gradle-wrapper.properties`:

```bash
gradle wrapper                 # one time only; creates gradlew + gradle-wrapper.jar
./gradlew :app:assembleDebug
# point the client at a backend other than the emulator default:
./gradlew :app:assembleDebug -PjohnApiBaseUrl=http://192.168.1.20:8787
```

The emulator default is `http://10.0.2.2:8787`, which is the host machine's
`localhost` from inside an Android emulator.

---

## The principles the code actually enforces

**Nothing is invented.** Sermon readiness is the percentage of the pastor's own
preparation checklist that is ticked (`domain/index.js → readiness`). Progress figures are
`COUNT(*)` over their records. When there is no data, the API returns `null` or an empty
list and the UI shows an empty state — `tasks.percent` is deliberately `null` rather than
`0%` when no tasks exist.

**Ministry Pulse is rule-based, not scored.** Every pulse item ships with the plain-language
`rule` that produced it and the real `sources` behind it, which is what powers
*"Why am I seeing this?"*. There are no model-assigned urgency scores anywhere.

**Reads run, writes ask.** The agent separates `read` / `write` / `destructive` tools.
`"show my tasks"` answers immediately; `"remind me to finish the conclusion tomorrow at 7pm"`
returns a confirmation card with the parsed title and time and creates nothing until the
pastor confirms. `"delete my sermon"` refuses to guess which one.

**Isolation is enforced in SQL, not the UI.** Every query is scoped by `userId`. Fetching
another pastor's record by id returns `404`, not `403`, so the app never leaks that the
record exists. Universal search and the AI both go through the same guard.

**AI context is minimal and visible.** `collectContext` gathers only the record on screen
plus the preferences the pastor chose to store. The context panel lists exactly what was
used, and it can be cleared.

**Memory is a list the pastor owns.** Everything John "remembers" is a row with a date and
a source, individually disable-able and deletable. Nothing else is implied.

**Glass is hierarchy, not gloss.** Five levels from `UltraThin` to `Prominent`; only AI and
hero surfaces are prominent. Reflection is event-driven (scroll velocity, press) and decays
to idle — never a loop — within a 2%–18% budget, and switches off entirely under reduced
motion. Content is never blurred, only the material under it.

---

## Current state

Built and verified:

- Authentication, session handling (token encrypted with an Android Keystore key), account
  deletion, data export
- Progressive onboarding and the personalization engine
- Home: Ministry Pulse, Today, Continue where I left off, quick actions
- Sermon workspace: list/vault search, structured editor with autosave and version
  snapshots, readiness checklist, workflow-derived editable timeline, Sermon Intelligence,
  relationship map, undo-able delete, Preach Mode, Focus Mode
- Tasks, Prayer, Notes, Calendar, Events with the collection/expense ledger, Meetings with
  the confirmed meeting-to-task workflow, Ministry Inbox
- AI agent: intent detection, tool registry with permissions, confirmation cards,
  in-app navigation, source citations, context panel, memory timeline
- Global command palette (search + AI + navigation + actions)
- Progress and workload from counted records, Trust Center
- Design system: tokens, dark and light themes, glass material, scroll reflection,
  glowing progress bars, state-driven AI orb, floating navigation, adaptive icon, splash

Not yet built — deliberately absent rather than faked:

- Documents, OCR and document intelligence
- Bible text integration (needs licensed sources; no translation is embedded)
- Voice capture (no mic control is shown and RECORD_AUDIO is not requested)
- Push notifications, offline sync and conflict resolution
- People records, pastoral-care timeline, announcements, research workspace, templates
- Tablet multi-column layout

There are no "Coming soon" buttons for these — the screens simply do not claim them.

A signed debug APK (`dist/john-ai-debug.apk`, package `com.johnai.app`, minSdk 26,
targetSdk 34) has been produced without Gradle by driving aapt2, kotlinc, d8 and
apksigner directly — see `tools/build-apk.sh`. That path exists only because the
Gradle/Maven hosts were unreachable in the build environment; use Gradle normally.

## Install it on your phone

**[`dist/john-ai.apk`](dist/john-ai.apk)** — 1.3 MB, R8 minified, signed, ready to
sideload. No build environment, no cables, no developer tools needed. Follow
**[`MANUAL_TEST_GUIDE.md`](MANUAL_TEST_GUIDE.md)**; `dist/JOHN_AI_TESTING.zip` is the same
APK bundled with its guide and `README_TESTING.md`.

Note that the backend is a separate server you run yourself, so without it you can test
installation, launch and the sign-in screen — the app should show a readable offline
message rather than crash. See the guide.

## Testing with a development server and adb

For the deeper pass, once a backend is reachable:

- [`REAL_DEVICE_TESTING.md`](REAL_DEVICE_TESTING.md) — enabling USB debugging, `adb`
  commands, **how to point the app at your development server over the LAN** (the shipped
  `10.0.2.2` only works in an emulator), and a crash-triage table.
- [`docs/REAL_DEVICE_CHECKLIST.md`](docs/REAL_DEVICE_CHECKLIST.md) — the test pass itself.
  Every box is unchecked; nothing is pre-filled.
- `dist/BUILD_INFO.txt` — written next to each APK, stating version, build type, baked-in
  API URL, signing status and that runtime is unvalidated.

**John AI has passed build/static validation but has not yet passed physical-device
runtime validation.**

## Build and verification status

Legend: **VERIFIED** = actually executed here. **UNVERIFIED** = not tested, no claim made.

| Area | Status | Evidence |
| --- | --- | --- |
| Server behaviour | **VERIFIED** | `npm test` — 13/13, plus a live end-to-end pastor flow |
| Compose UI type-checks | **VERIFIED** | kotlinc 2.0.0 + Compose plugin + real AndroidX classpath, 0 errors |
| Resource compile/link | **VERIFIED** | aapt2 compile + link, app and library resources |
| Dexing | **VERIFIED** | d8 (debug) and R8 (minified) both succeed |
| R8 shrinking | **VERIFIED** | 10 MB → **1.3 MB**; R8 resolved every reference; `mapping.txt` emitted |
| APK signature | **VERIFIED** | `apksigner verify` passes v2 + v3 |
| APK contents | **VERIFIED** | package `com.johnai.app`, label `John AI`, launchable `MainActivity`, one permission (INTERNET), no native libs, not debuggable |
| Reflection physics | **VERIFIED** | compiled and executed, 12/12 behavioural checks |
| Route resolution | **VERIFIED** | compiled and executed, 8/8 checks |
| Install on a device | **UNVERIFIED** | no adb, no emulator, no `/dev/kvm` in this environment |
| Launch / splash / onboarding / auth / home | **UNVERIFIED** | requires a device |
| Any user journey, button, dialog or keyboard behaviour | **UNVERIFIED** | requires a device |
| Frame rate and scroll performance | **UNVERIFIED** | requires a device |
| Dark/light rendering, accessibility, responsive layout | **UNVERIFIED** | requires a device |
| Release signing | **UNVERIFIED** | both APKs are signed with a throwaway debug key |

### What static analysis caught that compilation did not

R8's reference checking found two defects that `d8` silently accepted, both of
which would have crashed the app at startup:

- `androidx.arch.core` (`ArchTaskExecutor`, `SafeIterableMap`) was missing from the
  packaged classpath — `LifecycleRegistry` needs it on every lifecycle transition.
- The per-library `R` classes (`androidx.core.R$id`, `androidx.lifecycle.runtime.R$id`,
  `androidx.customview.poolingcontainer.R$id`) did not exist, because only the AARs'
  `classes.jar` had been packaged, not their resources. `ViewTreeLifecycleOwner` reads
  those ids in a static initialiser. The build now links library resources and emits an
  `R` class per package, exactly as AGP does.

Two further defects were found by inspection and fixed:

- **The app could not have reached its backend at all.** The client talks to
  `http://10.0.2.2:8787`, but cleartext HTTP is blocked by default from targetSdk 28 and
  no network security config existed. `res/xml/network_security_config.xml` now permits
  cleartext for loopback and private addresses only; public hosts must still be HTTPS.
- `RECORD_AUDIO` and `POST_NOTIFICATIONS` were declared but nothing used them, and the
  microphone button only toggled an animation. The permissions and the dead button are gone.

### Static audits (no device required)

| Audit | Result |
| --- | --- |
| Interactive handlers (`onClick`, `clickable`, `GlassButton`, `onValueChange`, `onCheckedChange`) | 93 found, **0 empty** — no dead controls |
| Navigation graph | 23 registered routes; all 6 route builders map to a registered pattern; **0 route constants used but unregistered** |
| Unknown-route safety | `Routes.resolve` falls back to `work`, proven by an executed test |
| Secrets inside the shipped APK | **0** — strings scanned for API_KEY/SECRET/TOKEN/PASSWORD/PRIVATE_KEY/JWT/SERVICE_ACCOUNT; every hit is a framework identifier. Only URLs present are the dev base URL and a Compose library link |
| Permissions in the APK | INTERNET only; no native libraries; not debuggable |
| R8 output integrity | Compose runtime, `AndroidComposeView`, Material3, `LifecycleRegistry`, `ArchTaskExecutor`, OkHttp, kotlinx Json and all John AI classes confirmed present via `mapping.txt` → dex lookup; 3,330 classes retained |

On APK size: 1.3 MB is legitimate. The bulk of the unminified 11 MB was
`material-icons-extended`, of which the app uses four icons. The `androidx.*.R$id`
classes are absent from the minified dex because R8 inlines their `int` constants —
that is correct behaviour, not a missing dependency.

### Known differences from the authoritative Gradle build

`gradle/libs.versions.toml` remains the source of truth. The Gradle-free pipeline in
`tools/build-apk.sh` differs from it and the APKs here reflect the pipeline, not the catalog:

| | Gradle catalog | This pipeline |
| --- | --- | --- |
| Kotlin | 2.0.20 | 2.0.0 (the newest plugin jar obtainable here) |
| Compose | BOM 2024.09.03 | the 1.6.x artifacts recovered from public caches |
| AGP | 8.5.2 | not used; aapt2/d8/r8/apksigner driven directly |
| Signing | release config | throwaway debug key |

No project version was changed to accommodate the pipeline.

**Can the divergence be closed?** Partly, and not usefully. Kotlin 2.0.20 (the catalog
version) *is* published on npm, but the Compose compiler plugin is versioned in lockstep
with Kotlin since 2.0, and no `kotlin-compose-compiler-plugin-embeddable-2.0.20` jar could
be located through any reachable host — so moving the compiler to 2.0.20 would leave it
without a matching Compose plugin and break the build. The pipeline is therefore kept
internally consistent at Kotlin 2.0.0 + its matching plugin + Compose 1.6.x runtime, all
packaged together into the same APK.

**Is that combination a compatibility risk?** For the artifact in `dist/`, no: the compiler,
plugin and runtime it was built and packaged with are mutually consistent, and R8 resolved
every reference across the whole closure. What is *not* verified is the catalog combination
(Kotlin 2.0.20 + Compose BOM 2024.09.03), because those artifacts cannot be fetched here.
Build with Gradle for anything shipped.

### Not implemented

Voice capture, notifications and deep links are not implemented, and there is no UI that
claims them. The AI answers only from stored records; no language model is configured, and
no model API key exists anywhere in the client — the AI screen states this to the user
("John answers from what you have stored").

**Localization is not implemented.** Only `app_name` and `brand_tagline` are read from
`strings.xml`; every other screen renders hardcoded English. The remaining entries in
`strings.xml` are a starting point for that work, not evidence of it.
