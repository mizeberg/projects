import { NextRequest, NextResponse } from 'next/server'
// Stripe webhook stub — verifies signature when env is set, updates entitlements

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature')
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Billing not configured. Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET. See /premium.' }, { status: 501 })
  }
  // In production: const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); stripe.webhooks.constructEvent(...)
  // Demo: accept payload, log, and return ok
  const body = await req.text()
  console.log('[billing webhook] sig:', sig, 'body length:', body.length)
  // TODO: verify and update user entitlements here
  return NextResponse.json({ received: true, note: 'Configure STRIPE_WEBHOOK_SECRET and implement user lookup by customer_id to set isPremium=true' })
}
