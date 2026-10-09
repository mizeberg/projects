import { NextRequest, NextResponse } from 'next/server'
import { createResult } from '@/lib/db'
import { whatIfScenarios } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { scenarioId, choiceId } = await req.json()
  const sc = whatIfScenarios.find(s=> s.id===scenarioId)
  const choice = sc?.choices.find((c:any)=> c.id===choiceId)
  if (!sc || !choice) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  let userId: string|undefined
  const token = req.cookies.get('arcade_token')?.value
  if (token) { const p = await verifyToken(token); if (p?.userId) userId=p.userId }
  const id = Math.random().toString(36).slice(2,10)
  const shareId = Math.random().toString(36).slice(2,10)+Math.random().toString(36).slice(2,6)
  const result = createResult({
    id, userId, type:'whatif', title: sc.title, summary: choice.outcome.slice(0,120),
    data: { scenarioId, choice, hook: sc.hook }, shareId, createdAt: new Date().toISOString(), isPublic:true, experienceId:'explorer'
  })
  return NextResponse.json({ shareId: result.shareId })
}
