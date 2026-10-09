import { NextRequest, NextResponse } from 'next/server'
import { getResults } from '@/lib/db'
export async function GET(req: NextRequest) {
  const shareId = req.nextUrl.searchParams.get('shareId')
  if (!shareId) return NextResponse.json({ error: 'shareId required' }, { status: 400 })
  const results = getResults()
  const r = results.find(x=> x.shareId===shareId)
  if (!r) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(r)
}
