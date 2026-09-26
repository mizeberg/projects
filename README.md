# GATENOVA

**Your GATE journey, gamified.** A responsive, dark-first learning application built with React, TypeScript, Vite, Express, and SQLite.

## Android app

Install the signed APK from [GitHub Releases](https://github.com/mizeberg/projects/releases). The Android edition bundles the current app for offline use on Android 8.0 and newer, with a private on-device profile and note import/export. No web server is needed to use it.

See [Android build and installation instructions](docs/ANDROID.md) for signing, update requirements and the current release scope.

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
- Authored branch-aware starter lessons for ECE, CSE, Mechanical, Civil, AIML, and Cybersecurity. This is not a complete official GATE syllabus.
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

This delivery concentrates on the first-phase learning journey with selected supporting learning/world features. Full reviewed syllabus coverage, verified PYQs, full mock exams, password recovery/email verification, Google/Apple sign-in, document parsing/RAG, external AI, lecturer/admin authorization, institutions, subscriptions are future phases. They are not represented as working integrations. XP is a private learning visualization; a future competitive service must calculate rewards authoritatively on the server.
