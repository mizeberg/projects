import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { findUserById, updateUser } from '@/lib/db'

export async function POST(req: NextRequest) {
  const token = req.cookies.get('arcade_token')?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload?.userId) return NextResponse.json({ error:'Unauthorized'}, {status:401})
  const user = findUserById(payload.userId)
  if (!user) return NextResponse.json({ error:'Not found'}, {status:404})
  const updated = updateUser(user.id, { isPremium: !user.isPremium, subscriptionStatus: !user.isPremium ? 'active' : 'canceled' })
  return NextResponse.json({ isPremium: updated?.isPremium })
}
