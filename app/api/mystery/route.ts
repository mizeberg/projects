import { NextRequest, NextResponse } from 'next/server'
import { createResult } from '@/lib/db'
import { mysteries } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { mysteryId, accused, hintsUsed, correct } = await req.json()
  const m = mysteries.find(x=> x.id===mysteryId)
  if (!m) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  let userId: string|undefined
  const token = req.cookies.get('arcade_token')?.value
  if (token) { const p = await verifyToken(token); if (p?.userId) userId=p.userId }
  const id = Math.random().toString(36).slice(2,10)
  const shareId = Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6)
  const title = correct ? `Solved: ${m.title}` : `Attempted: ${m.title}`
  const summary = correct ? `Solved ${m.title} with ${hintsUsed} hints` : `Investigated ${m.title}`
  const result = createResult({
    id, userId, type:'mystery', title, summary,
    data: { mysteryId, accused, hintsUsed, correct, difficulty: m.difficulty }, shareId, createdAt: new Date().toISOString(), isPublic:true, experienceId:'mystery'
  })
  return NextResponse.json({ shareId: result.shareId, correct })
}
