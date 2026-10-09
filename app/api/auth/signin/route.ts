import { NextRequest, NextResponse } from 'next/server'
import { findUserByEmail } from '@/lib/db'
import { verifyPassword, createToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  const user = findUserByEmail(email)
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const ok = await verifyPassword(password, user.passwordHash)
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  const token = await createToken({ userId: user.id, email: user.email })
  const res = NextResponse.json({ ok: true })
  res.cookies.set('arcade_token', token, { httpOnly:true, secure: process.env.NODE_ENV==='production', sameSite:'lax', path:'/', maxAge: 60*60*24*30 })
  return res
}
