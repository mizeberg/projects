import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyToken } from '@/lib/auth'
import { findUserById, getResultsByUser } from '@/lib/db'
import AccountClient from './AccountClient'

export default async function Page() {
  const token = cookies().get('arcade_token')?.value
  if (!token) redirect('/auth')
  const payload = await verifyToken(token)
  if (!payload?.userId) redirect('/auth')
  const user = findUserById(payload.userId)
  if (!user) redirect('/auth')
  const results = getResultsByUser(user.id)
  return <AccountClient user={user} results={results} />
}
