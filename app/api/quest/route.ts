import { NextRequest, NextResponse } from 'next/server'
import { createResult } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { date, puzzle, correct } = await req.json()
  let userId: string|undefined
  const token = req.cookies.get('arcade_token')?.value
  if (token) { const p = await verifyToken(token); if (p?.userId) userId=p.userId }
  const id = Math.random().toString(36).slice(2,10)
  const shareId = Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6)
  const result = createResult({
    id, userId, type:'quest', title: `Daily Quest — ${date}`, summary: correct ? `Completed logic puzzle: ${puzzle?.slice(0,60)}` : `Quest ${date}`,
    data: { date, puzzle, correct }, shareId, createdAt: new Date().toISOString(), isPublic:true, experienceId:'quest'
  })
  return NextResponse.json({ shareId: result.shareId })
}
