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
- Voice capture (the mic control is present but transcription is not wired)
- Push notifications, offline sync and conflict resolution
- People records, pastoral-care timeline, announcements, research workspace, templates
- Tablet multi-column layout

There are no "Coming soon" buttons for these — the screens simply do not claim them.

## What has actually been verified

The build environment can reach npm and PyPI but not `dl.google.com`, `maven.google.com`,
`repo1.maven.org` or `services.gradle.org`, so no Android SDK, AndroidX/Compose artifact or
Gradle distribution could be fetched and **no APK has been produced here**. A JVM and
`kotlinc` 2.0.21 were assembled from npm/PyPI, which allowed this much:

| Verified | How |
| --- | --- |
| Server, all behaviour | `npm test` — 12/12 pass, plus a full live pastor flow against a running instance |
| Every Kotlin source file parses | `kotlinc` frontend over all 34 files: zero syntax errors |
| `data/Models.kt`, whole data layer | Compiled for real (61 classes) together with a probe exercising the exact field access the screens use |
| `ui/glass/Reflection.kt` scroll physics | Compiled **and executed**: idle 3%, slow scroll inside the 2–12% band, fast scroll capped at 17% (never past the 18% ceiling), decay back to idle in 43 frames, travel wraps in 0..1, reduced motion disables everything, nested scroll observes without consuming |
| `navigation/Routes.kt` | Compiled **and executed**: entity routes, filter stripping, singular→list fallback, unknown route falls back safely to `work` |

Not verified: type-checking of the Compose UI itself, which needs the AndroidX classpath.
Expect to fix a small number of import-level issues on first build in Android Studio.
