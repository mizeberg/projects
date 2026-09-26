# GATENOVA architecture

## Delivery boundary

Phase 1 is a responsive web application: guest exploration, secure email accounts, configurable branch selection, a persisted learning journey, lessons, question attempts, honest progress rewards, and Nova reactions. Practice, focus, roadmap, garden, and analytics extend this loop. Signed Android distribution, official syllabus documents and downloaded official PYQ PDFs are now included. Institution management, document RAG, external LLMs, OAuth, and subscription billing are later integrations, not simulated services.

## Design and navigation

Midnight canvas, quiet olive surfaces, emerald action color, lime progress highlights; DM Sans for UI and Space Grotesk for display. Semantic CSS custom properties, reusable Panel, Button, Progress, Nova, WorldArt, and Modal components. Desktop persistent sidebar; mobile bottom navigation. Hash-addressable views: Home, Today, Nova World, Roadmap, Practice, Syllabus & Library, My Materials, Knowledge Garden, Achievements, Analytics, Profile.

## Data

Branch → Subject → Topic → Lesson/Objectives/Questions is configuration in curriculum.ts. Interactive practice uses original authored content, never represented as actual PYQs. The independent `gate-library.json` manifest supplies all official 2027 syllabus PDFs/text and 2026 paper/key metadata, with provenance and hashes; see CONTENT.md. Progress stores completed topic IDs, attempts, sessions, preferences and timestamps. XP is derived from unique correct questions, unique completed lessons, and completed timed sessions; navigation grants no rewards. Mastery is a coarse learning indicator, not a prediction.

SQLite stores users, hashed passwords, expiring sessions, learning state and auth throttling. Guest state stays on the device; authenticated state belongs to a user. JSON progress is versioned and validated. A repository adapter can later normalize attempts and add classrooms, assignments, material chunks and subscriptions. No role selection in the client grants privilege.

## Services and API contracts

POST /api/auth/signup {name,email,password} → user, authenticated HttpOnly session
POST /api/auth/login {email,password} → user
POST /api/auth/logout → 204
GET /api/auth/me → user or 401
GET /api/progress → versioned learning state
PUT /api/progress {state} → saved state; bounded validated payload
GET /api/health → readiness
Cookie sameSite=lax; same-origin mutation validation; scrypt password hashes; parameterized queries; persistent rate limits; Secure cookies in production HTTPS; no provider keys in client. TLS reverse proxy required for deployed accounts. Database and backups must use durable encrypted storage in production.

## Nova services

TutorService is a provider-independent interface. LocalTutor uses explicitly authored lesson content, knows the active topic, and handles concept explanation, a worked example, and retrieval practice. It declines unsupported problems rather than inventing an answer. It does not claim to be a connected LLM or to analyze documents. An external provider must run server-side and preserve grounding, limits and citations.

PetReactionEngine maps typed learning events to expression, motion, and short dialogue, with multiple lines selected across events. Reduced motion is honored. Breaks never reduce learning progress or pet health.

## State, privacy and analytics

A reducer manages progress; versioned localStorage persists guest learning for offline reads. Account progress synchronizes through the API. Failed saves remain visible and retryable. Account sessions never persist in localStorage. Local educational event data supports charts; no third-party analytics or private data export. Uploaded text notes stay local; no fabricated PDF analysis. Authentication requires online connectivity.

## Next phases

2: expand reviewed curriculum, licensed PYQs, full timed mocks, revision scheduler.
3: server-side provider adapters, ingestion queue, document parsing, retrieval with verifiable citations.
4: richer content-driven world regions and cosmetics.
5: explicit server roles, institution isolation, classroom/assignment workflows with approval before publication.
6: optional social and subscriptions.
