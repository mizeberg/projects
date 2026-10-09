'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AccountClient({ user, results }: { user: any, results: any[] }) {
  const router = useRouter()
  async function signOut() {
    await fetch('/api/auth/signout', { method:'POST' })
    router.push('/')
    router.refresh()
  }
  async function deleteAccount() {
    if (!confirm('Delete your account and all saved results? This cannot be undone.')) return
    await fetch('/api/account/delete', { method:'POST' })
    router.push('/')
    router.refresh()
  }
  async function togglePremium() {
    await fetch('/api/account/premium', { method:'POST' })
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <h1 className="font-black tracking-tighter text-3xl">Your Arcade Pass</h1>
      <p className="text-zinc-400 mt-2">Manage your playground. {user.isPremium ? 'You’re Arcade Plus ∞' : 'Free explorer — upgrade anytime.'}</p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
          <div className="h-16 w-16 rounded-2xl bg-white text-black grid place-items-center font-black text-xl">{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</div>
          <div className="mt-4 font-bold">{user.name}</div>
          <div className="text-sm text-zinc-400">{user.email}</div>
          <div className="mt-3 text-xs px-2.5 py-1 rounded-full border inline-flex" style={{ borderColor: user.isPremium ? '#a3ff12' : '#27272a', color: user.isPremium ? '#a3ff12' : '#a1a1aa' }}>{user.isPremium ? 'ARCADE PLUS • ACTIVE' : 'FREE'}</div>

          <div className="mt-6 space-y-2">
            <button onClick={togglePremium} className="w-full rounded-full bg-white text-black py-2.5 text-sm font-bold">{user.isPremium ? 'Cancel Plus (demo)' : 'Upgrade to Plus'}</button>
            <button onClick={signOut} className="w-full rounded-full border border-zinc-700 py-2.5 text-sm font-medium">Sign out</button>
            <button onClick={deleteAccount} className="w-full rounded-full bg-red-950 border border-red-900 text-red-300 py-2.5 text-sm font-medium">Delete account & data</button>
          </div>

          <div className="mt-6 text-xs text-zinc-500 leading-relaxed">Subscription billing: Demo toggle simulates Stripe. To enable real billing, set STRIPE_SECRET_KEY and configure webhooks — see /premium for owner setup steps. No card stored locally.</div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-lg">Saved results & collections</h2>
              <span className="text-xs text-zinc-500">{results.length} items</span>
            </div>
            {results.length===0 ? (
              <p className="text-sm text-zinc-500 mt-4">No saved results yet. Play the Lab, solve a mystery, or craft something — they’ll appear here when you’re signed in.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                {results.slice(0,20).map((r:any)=> (
                  <Link key={r.id} href={`/share/${r.shareId}`} className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-700 flex gap-4 items-center">
                    <div className="h-10 w-10 rounded-xl bg-zinc-800 grid place-items-center text-sm shrink-0">{r.type==='personality' ? '🧬' : r.type==='mystery' ? '🕵️' : r.type==='whatif' ? '🌀' : r.type==='creative' ? '✦' : '⚡'}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-sm leading-tight truncate">{r.title}</div>
                      <div className="text-xs text-zinc-500 truncate">{r.summary}</div>
                    </div>
                    <span className="text-xs text-zinc-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="font-bold text-sm">Privacy & data</h3>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">You can delete your account and all associated results via the button. Shared cards remain public if you explicitly shared them — contact support to remove a specific share. We collect only what’s needed to provide the playground.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
