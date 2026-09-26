# GATENOVA

**Your GATE journey, gamified.** A responsive, dark-first learning application built with React, TypeScript, Vite, Express, and SQLite.

## Android app

[**Download GATENOVA 1.1.0 APK**](https://raw.githubusercontent.com/mizeberg/projects/refs/heads/coderabbit/build-gatenova-learning-platform/54013167/downloads/gatenova-1.1.0-android.apk).

The signed APK is published as a versioned file in the `downloads/` directory on this task’s repository branch. The Android edition bundles the current app for offline use on Android 8.0 and newer, with a private on-device profile and note import/export. No web server is needed to use it.

See [Android build and installation instructions](docs/ANDROID.md) for signing, update requirements and the current release scope.

## Syllabus and materials

Open **Syllabus & library** for all 30 official GATE 2027 papers, General Aptitude and the 2026 Textile archive. Syllabus text and original PDFs work offline. The Android reader downloads 38 official 2026 question papers and 38 answer keys on demand and saves them for offline reading. All content shows its source and year. Free NPTEL course catalogues are linked separately and require internet. Interactive Nova lessons remain a starter collection.

See [content coverage and provenance](docs/CONTENT.md).

## Run the web edition

Requires **Node.js 24+** (uses built-in `node:sqlite`).

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. The public application works immediately as a local explorer; use Profile to create an email/password account. Personalize your name, branch, exam target, and daily availability from the workspace switcher.

```sh
npm run build
npm start
```

Production accounts require HTTPS, normally through a reverse proxy. Production session cookies are Secure and HttpOnly. SQLite data is stored in ignored `.data/gatenova.sqlite`; use a durable private volume and backups when deploying. `PORT` defaults to `3000`.

## Working experience

- Responsive home, Today, illustrated Nova World, roadmap, practice, Knowledge Garden, achievements, analytics, materials, profile, Formula Vault, flashcards, and Mistake Bank.
- Six authored starter lessons, common aptitude practice for every paper, and all official 2027 syllabuses in a separate sourced library. Interactive teaching content is a starter collection.
- Concept → question → explanation → retry → completion flow. Correct question XP is awarded once; completed quests grow the garden. No rewards for opening the app.
- Centralized Nova reactions and cosmetic appearances, a pauseable focus timer with optional ambient sound, searchable navigation, and learning notifications.
- A contextual **local lesson guide** behind a tutor interface. It uses actual starter lesson content, labels the source, and declines unsupported questions. It is not a connected external LLM.
- Text notes and `.txt` imports (50 KB maximum), exportable notes, saved formulas, generated starter flashcards, and private learning metrics.
- Email/password signup/login/logout using salted scrypt hashes, expiring HttpOnly sessions, input validation, same-origin checks, rate limiting, and account-isolated progress.
- Versioned guest storage, authenticated server persistence, conflict detection and explicit merge retry. Unsynced account changes warn before leaving the tab. Only the public app shell is cached for offline use in production. Guest learning continues offline; account sync and authentication require connectivity.
- Reduced-motion support, keyboard focus containment in dialogs, accessible control labels, and responsive mobile bottom navigation.

## Validation

```sh
npm test
# Also exercise auth, private progress, and conflict handling against a running server:
TEST_BASE_URL=http://localhost:3000 npm test
npm run build
```

`npm run format` formats source and documentation. Browser checks cover the real quest/retry/reward loop and responsive navigation.

## Architecture and next phases

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Curriculum lives in `src/lib/curriculum.ts`, learning and tutor logic in `src/lib/engine.ts`, sync in `src/lib/store.tsx`, and shared UI/illustrations in `src/components/`.

This delivery concentrates on the first-phase learning journey with selected supporting learning/world features. Complete interactive lesson coverage, worked PYQ solutions, full mock exams, password recovery/email verification, Google/Apple sign-in, document parsing/RAG, external AI, lecturer/admin authorization, institutions, subscriptions are future phases. They are not represented as working integrations. XP is a private learning visualization; a future competitive service must calculate rewards authoritatively on the server.
