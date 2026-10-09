import { NextRequest, NextResponse } from 'next/server'
import { createResult } from '@/lib/db'
import { personalityQuizzes } from '@/lib/content'
import { verifyToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { quizId, resultId } = body
  const quiz = personalityQuizzes.find(q=> q.id===quizId)
  const res = quiz?.results.find((r:any)=> r.id===resultId)
  if (!quiz || !res) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  let userId: string | undefined
  const token = req.cookies.get('arcade_token')?.value
  if (token) {
    const payload = await verifyToken(token)
    if (payload?.userId) userId = payload.userId
  }
  const id = Math.random().toString(36).slice(2,10)
  const shareId = Math.random().toString(36).slice(2,10) + Math.random().toString(36).slice(2,6)
  const result = createResult({
    id, userId, type: 'personality', title: res.title, summary: res.tagline, data: { quizId, resultId, quizTitle: quiz.title, result: res, color: res.color },
    shareId, createdAt: new Date().toISOString(), isPublic: true, experienceId: 'lab'
  })
  return NextResponse.json({ shareId: result.shareId })
}
