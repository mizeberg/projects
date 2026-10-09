import { NextRequest, NextResponse } from 'next/server'
import { createUser, findUserByEmail } from '@/lib/db'
import { hashPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()
  if (!email || !password || password.length < 6) return NextResponse.json({ error: 'Email and password (min 6 chars) required' }, { status: 400 })
  if (findUserByEmail(email)) return NextResponse.json({ error: 'Email already registered' }, { status: 400 })
  const passwordHash = await hashPassword(password)
  const user = createUser({
    id: Math.random().toString(36).slice(2,10) + Date.now().toString(36),
    email, passwordHash, name: name || email.split('@')[0],
    createdAt: new Date().toISOString(), isPremium: false, streak: 0,
  })
  const token = await createToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('arcade_token', token, { httpOnly:true, secure: process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge: 60*60*24*30 })
  return res
}
