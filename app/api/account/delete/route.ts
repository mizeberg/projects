import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { getUsers, saveUsers, getResults, saveResults } from '@/lib/db'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('arcade_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const users = getUsers().filter(u=> u.id!==payload.userId)
  saveUsers(users)
  const results = getResults().filter(r=> r.userId!==payload.userId)
  saveResults(results)
  const res = NextResponse.json({ ok:true })
  res.cookies.set('arcade_token','',{ httpOnly:true, path:'/', maxAge:0 })
  return res
}
