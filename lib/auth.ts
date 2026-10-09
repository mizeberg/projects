import * as jose from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'internet-arcade-dev-secret-change-in-production-32chars!')

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}
export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}
export async function createToken(payload: any) {
  return await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
}
export async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, SECRET)
    return payload as any
  } catch { return null }
}

export async function getSession() {
  const cookieStore = cookies()
  const token = cookieStore.get('arcade_token')?.value
  if (!token) return null
  const payload = await verifyToken(token)
  return payload
}

export async function requireUser() {
  const session = await getSession()
  if (!session?.userId) return null
  return session
}

export function setAuthCookie(token: string) {
  cookies().set('arcade_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60*60*24*30,
  })
}
export function clearAuthCookie() {
  cookies().set('arcade_token', '', { httpOnly: true, path: '/', maxAge: 0 })
}
