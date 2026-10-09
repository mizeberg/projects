# Owner Checklist — What needs human action

## Immediate (before public launch)
- [ ] Set `JWT_SECRET` to a long random 32+ char string (`openssl rand -hex 32`)
- [ ] Set `NEXT_PUBLIC_URL` to your production domain (for OG images, sitemap, sharing)
- [ ] Choose hosting: Vercel, Fly.io, Render, or any Node host — set `npm run build && npm start`
- [ ] Ensure `data/` directory persists (volume) or migrate to Postgres/SQLite persistent file
- [ ] Run `npm run build` to verify — must pass ESLint/types
- [ ] Test full journey: homepage → lab → mystery → share → create account → save → delete

## Revenue (to reach real $1k MRR)
- [ ] Configure Stripe (see `docs/BILLING.md`) — required for real payments
- [ ] Add real product images/copy for Plus in `/premium`
- [ ] Connect transactional email (Resend, Postmark, or AWS SES) for welcome + billing notifications — currently stubbed
- [ ] Enable analytics (PostHog, Plausible, or keep file-based) — verify trending is real
- [ ] Submit sitemap to Google Search Console (`/sitemap.xml`)

## Optional / later
- [ ] Set `OPENAI_API_KEY` to enable AI-enhanced creative variations (clearly labeled, cost-controlled)
- [ ] Set `AI_MONTHLY_BUDGET` (e.g., 20) to auto-disable AI if exceeded
- [ ] Add backup: daily copy of `data/*.json` to S3/R2
- [ ] Review Help, Privacy, Terms for your jurisdiction — update email addresses

## What already works without you
- File-based persistence, auth, all 5 experiences, sharing with OG, trending via real events, daily quest, dashboard, SEO, rate limiting

## What is intentionally not automated
- Spending money on ads (never without explicit approval)
- Publishing AI-generated content without validation
- Messaging contacts or spamming

## Monitoring
- Check `/api/health` regularly
- View `/dashboard` for DAU, MRR, churn, errors
- If `DISABLE_AI=true`, AI features show fallback gracefully
