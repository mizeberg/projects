# Billing Setup — Internet Arcade Plus

## Demo mode (no Stripe needed)
- Visit `/account` when signed in → toggle “Upgrade to Plus” — instantly flips `isPremium` in file storage.
- No card stored. Useful for testing entitlements, sharing, and premium gates.

## Production with Stripe

1. Create Stripe account at stripe.com
2. Create two Prices:
   - Monthly: $6.99 recurring
   - Annual: $59 recurring
3. Set env vars:
```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_xxx
STRIPE_PRICE_ANNUAL=price_yyy
NEXT_PUBLIC_URL=https://yourdomain.com
```
4. Configure webhook in Stripe Dashboard → Developers → Webhooks → Add endpoint:
   - URL: `https://yourdomain.com/api/billing/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Implement server logic in `app/api/billing/webhook/route.ts`:
   - Use `stripe.webhooks.constructEvent(body, sig, secret)` to verify
   - Lookup user by `stripeCustomerId` or email
   - Update `isPremium`, `subscriptionStatus`, `subscriptionEndsAt`

6. Create checkout in `app/api/billing/create-checkout/route.ts`:
```ts
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const session = await stripe.checkout.sessions.create({
  customer: user.stripeCustomerId, // create if missing
  line_items: [{ price: process.env.STRIPE_PRICE_MONTHLY, quantity: 1 }],
  mode: 'subscription',
  success_url: `${process.env.NEXT_PUBLIC_URL}/account?success=1`,
  cancel_url: `${process.env.NEXT_PUBLIC_URL}/premium`,
})
return NextResponse.json({ url: session.url })
```

7. Never mark paid via frontend redirect — only webhook.

## Entitlements
- Server checks `user.isPremium` in API routes and `app/account` etc.
- Middleware example: `lib/auth.ts` → `requireUser()` + `isPremium` flag.
- Free tier remains fully useful.

## Cancellation & Refunds
- User cancels via Stripe Customer Portal: `stripe.billingPortal.sessions.create({ customer })`
- Or via Account → Cancel (updates `subscriptionStatus=canceled` but keeps access until period end).
- Refunds: handle in Stripe Dashboard, email hello@...
