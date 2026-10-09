import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import AnalyticsBeacon from '@/components/AnalyticsBeacon'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { findUserById } from '@/lib/db'

export const metadata = {
  title: 'Internet Arcade — The Internet Is Your Playground',
  description: 'Discover interactive experiences, play clever mini-games, express creativity, and share surprises. Personality lab, what-if explorer, mystery room, creative machine, daily quests.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Internet Arcade — The Internet Is Your Playground',
    description: 'A living digital playground. Curious, creative, surprising.',
    type: 'website',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get('arcade_token')?.value
  let user = null
  if (token) {
    const payload = await verifyToken(token)
    if (payload?.userId) {
      const u = findUserById(payload.userId)
      if (u) user = { id: u.id, email: u.email, name: u.name, isPremium: u.isPremium }
    }
  }
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AnalyticsBeacon />
        <Header user={user} />
        <main className="min-h-[70vh]">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
