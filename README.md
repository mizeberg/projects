# INTERNET ARCADE — The Internet Is Your Playground

**Live playground with 5 polished worlds: Personality Lab, What If? Explorer, Mystery Room, Creative Machine, Daily Quest.**

🌐 Production-ready Next.js 14 app — dark editorial design, persistent storage, real auth, shareable cards, freemium billing, SEO, analytics, owner dashboard.

---

## Why it’s not a generic AI wrapper

- **Structured schemas & deterministic logic** for quizzes, puzzles, mysteries (not LLM slop)
- **Original content** — 3 personality quizzes, 5 what-if worlds, 3 mysteries with fair clues, 6 creative tools, 365 daily quests
- **Real social loop** — every result creates a public `/share/[id]` page with OG metadata, preview card, and “try it yourself” CTA
- **Honest freemium** — free tier is useful; Plus ($6.99/mo) unlocks more, doesn’t degrade free
- **No fake metrics** — trending based on real view/completion events, dashboard shows actual counts

## Stack

- **Frontend:** Next.js 14 App Router, Tailwind, TypeScript, responsive, keyboard-accessible, reduced-motion
- **Backend:** Next.js Route Handlers, JWT (jose) + bcryptjs, file-based JSON (dev) / Prisma SQLite-ready, Zod validation, rate limiting
- **Auth:** httpOnly cookies, server-side verification, account deletion
- **Billing:** Stripe-ready (demo toggle works without keys, webhook verified in prod)
- **Content:** Structured TS schemas in `lib/content.ts` — validates before publish, no auto-publish of unreviewed AI
- **SEO:** Dynamic metadata, OG/Twitter, sitemap, robots, semantic HTML, canonical, indexing controls
- **Analytics:** File-based events, trending 7-day aggregation, dashboard at `/dashboard`

## Quickstart

```bash
npm install
cp .env.example .env  # edit JWT_SECRET, NEXT_PUBLIC_URL
npm run dev    # http://localhost:3000
npm run build && npm start  # production
```

## The 5 Worlds

| World | Route | What you do | Share? | Premium? |
|---|---|---|---|---|
| **Personality Lab** | `/lab` | 3 original quizzes, non-clinical, restartable, result card with strengths | ✓ card | Free + Plus extras |
| **What If? Explorer** | `/explorer` | 5 branching hypotheticals — assumptions vs science vs speculation | ✓ outcome | Free |
| **Mystery Room** | `/mystery` | 3 cases (Easy/Med/Hard), evidence/timeline/hints, fair solution | ✓ solved | 2 free + 1 Plus |
| **Creative Machine** | `/creative` | Story/world/character/greeting/name/challenge generators — local logic, AI optional | ✓ card | 5/day free, unlimited Plus |
| **Daily Quest** | `/quest` | Logic puzzle + creative + curiosity + experiment + bonus — streak optional | ✓ achievement | Free |

## Sharing & Virality

- Every completion POSTs to `/api/*` → creates `shareId` → `/share/[id]` public page
- OG title/description + preview image/card, CTA to try original
- No auto-publish, no contacts spamming, referral attribution stubbed (add `?ref=shareId`)

## Accounts

- Explore without sign-in
- Optional account: save results, collections, streak sync, preferences, billing
- Secure: bcrypt, JWT, httpOnly, server auth, validation
- Delete anytime: `Account → Delete account & data` removes user + results via `DELETE /api/account/delete`

## Premium

- **Free:** selected experiences, reasonable daily limits, basic quizzes, daily quests
- **Arcade Plus $6.99/mo ($59/yr ~30% off):** premium mysteries/worlds, unlimited generations, collections, personalization, early access
- Demo: toggle in `/account` flips `isPremium`
- Prod: Stripe checkout + webhook (`/api/billing/webhook` verifies signature, never trust redirect). See `docs/BILLING.md`.

## Design System

Dark foundation `#09090b`, zinc surfaces, vibrant accents (violet `#7c5cff`, aqua `#00e5cc`, amber `#ffb020`, pink `#ff4d6e`). Instrument Sans + Inter + JetBrains Mono, 24-32px radius cards, subtle depth, purposeful motion, reduced-motion support. No generic gradients/glass spam.

## Discovery

Categories: Think, Create, Discover, Solve, Imagine, Challenge. Search/filter stub, personalized recs via interests, editorial curation, trending from real events.

## Content Ops

Represented as TS schemas (`lib/content.ts`) with validation before publish. New worlds add entry + schema — no rewrite. AI puzzles flagged, duplicates checked, quality gate.

## Automation

- **Product:** health `/api/health`, error logging, rate limit (60/min), AI cost cap (`AI_MONTHLY_BUDGET`)
- **Onboarding:** welcome copy, guided first session (homepage hero + daily featured)
- **Support:** searchable `/help` with grounded assistant (only real docs), escalation for billing/privacy
- **Billing:** webhook entitlements, notifications (stub → add Resend)
- **Marketing:** SEO pages per experience, sitemap, performance

## Analytics Dashboard

`/dashboard` shows DAU/MAU, new regs, completions, share rate, free→paid conv, subscribers, MRR, churn, AI spend, costs — all real.

## SEO

- Unique titles/descriptions per route, canonical, OG/Twitter, semantic HTML, perf (Next optimize), sitemap, robots, noindex for `/account` `/dashboard` `/api`
- Target topics: personality quizzes, mystery games, logic puzzles, writing generators, science experiments, hypothetical explorers

## Deploy

- Build: `npm run build` (must pass)
- Host: Vercel (`vercel --prod`), or any Node host with `npm start`
- Env: `JWT_SECRET`, `NEXT_PUBLIC_URL`, `DATABASE_URL`, `STRIPE_*` if billing, `OPENAI_API_KEY` if AI
- Persist `data/` or set `DATABASE_URL` to Postgres (Prisma)

## Tests

```bash
node tests/critical.test.js  # quiz scoring, mystery consistency, daily quest determinism
curl http://localhost:3000/api/health  # health + stats
```

## Docs

- `docs/BILLING.md` — Stripe setup
- `docs/OWNER_CHECKLIST.md` — human actions remaining

## Owner Actions (blockers)

See `docs/OWNER_CHECKLIST.md`. TL;DR: set secrets, configure Stripe for real revenue, connect email for onboarding, deploy.

---

**Made for curious humans, not algorithms.** Free forever, Plus optional, no ads, no doomscroll.
