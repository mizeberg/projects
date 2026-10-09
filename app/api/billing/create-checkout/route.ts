import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { plan } = await req.json().catch(()=> ({ plan: 'monthly' }))
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      error: 'Stripe not configured',
      setup: 'Set STRIPE_SECRET_KEY, STRIPE_PRICE_MONTHLY, STRIPE_PRICE_ANNUAL, STRIPE_WEBHOOK_SECRET in env. See /premium and docs/BILLING.md',
      demo: 'Use demo toggle in /account to simulate Plus'
    }, { status: 501 })
  }
  const token = req.cookies.get('arcade_token')?.value
  if (!token) return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // In production: stripe.checkout.sessions.create({ customer, price, success_url, cancel_url })
  return NextResponse.json({ url: '/premium?checkout=demo', note: 'Stripe configured — implement Stripe SDK here with price ' + (plan==='annual' ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY) })
}
