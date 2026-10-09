import { NextResponse } from 'next/server'
import { getAnalytics, getStats } from '@/lib/db'
export async function GET() {
  return NextResponse.json({ stats: getStats(), events: getAnalytics().slice(-100).reverse() })
}
export async function POST(req: Request) {
  const { event, experienceId } = await req.json()
  const { recordAnalytics } = await import('@/lib/db')
  recordAnalytics({ event: event || 'view', experienceId })
  return NextResponse.json({ ok:true })
}
