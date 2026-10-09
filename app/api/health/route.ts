import { NextResponse } from 'next/server'
import { getStats } from '@/lib/db'
export async function GET() {
  const stats = getStats()
  return NextResponse.json({ ok: true, stats, uptime: process.uptime(), env: { hasStripe: !!process.env.STRIPE_SECRET_KEY, hasOpenAI: !!process.env.OPENAI_API_KEY } })
}
