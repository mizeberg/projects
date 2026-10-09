'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthClient() {
  const [mode, setMode] = useState<'signin'|'signup'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ email, password, name })
      })
      const j = await res.json()
      if (!res.ok) setMsg(j.error || 'Error')
      else { router.push('/account'); router.refresh() }
    } catch { setMsg('Network error') }
    setLoading(false)
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-12 grid lg:grid-cols-2 gap-8 items-start">
      <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="font-black tracking-tighter text-3xl">{mode==='signup' ? 'Create your arcade pass' : 'Welcome back'}</h1>
        <p className="text-zinc-400 mt-2 text-sm leading-relaxed">Optional account. Save results, keep streaks, sync across devices. Explore without signing in — no paywall on curiosity.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode==='signup' && (
            <div>
              <label className="text-xs font-black tracking-widest text-zinc-400">NAME</label>
              <input value={name} onChange={e=> setName(e.target.value)} placeholder="Ada Lovelace" className="mt-2 w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm outline-none focus:border-zinc-700" />
            </div>
          )}
          <div>
            <label className="text-xs font-black tracking-widest text-zinc-400">EMAIL</label>
            <input value={email} onChange={e=> setEmail(e.target.value)} required type="email" placeholder="you@arcade.internet" className="mt-2 w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm outline-none focus:border-zinc-700" />
          </div>
          <div>
            <label className="text-xs font-black tracking-widest text-zinc-400">PASSWORD</label>
            <input value={password} onChange={e=> setPassword(e.target.value)} required type="password" placeholder="••••••••" className="mt-2 w-full rounded-2xl bg-zinc-950 border border-zinc-800 px-4 py-3 text-sm outline-none focus:border-zinc-700" />
            <p className="text-xs text-zinc-500 mt-1">Min 6 characters. Securely hashed with bcrypt.</p>
          </div>
          {msg && <div className="text-sm text-red-400 bg-red-950/30 border border-red-900 p-3 rounded-2xl">{msg}</div>}
          <button disabled={loading} className="w-full rounded-full bg-white text-black py-3 font-bold text-sm disabled:opacity-50">{loading ? 'Please wait…' : mode==='signup' ? 'Create account' : 'Sign in'}</button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button onClick={()=> setMode(mode==='signup' ? 'signin' : 'signup')} className="text-zinc-400 hover:text-white underline">
            {mode==='signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
          </button>
        </div>

        <p className="text-xs text-zinc-500 mt-6">By continuing you agree to our Terms and Privacy. You can delete your account and data anytime in Account settings.</p>
      </div>

      <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-8">
        <div className="text-xs tracking-[0.2em] font-black text-violet-300">WHY SIGN IN?</div>
        <ul className="mt-4 space-y-3 text-sm text-zinc-300">
          <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 grid place-items-center text-xs shrink-0">✓</span> Save personality, mystery, and creative cards into collections</li>
          <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 grid place-items-center text-xs shrink-0">✓</span> Track daily quest streaks & history across devices</li>
          <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 grid place-items-center text-xs shrink-0">✓</span> Sync preferences, manage subscription, delete data</li>
          <li className="flex gap-3"><span className="h-6 w-6 rounded-full bg-zinc-900 border border-zinc-800 grid place-items-center text-xs shrink-0">✓</span> Keep exploring anonymously if you prefer — no dark patterns</li>
        </ul>
        <div className="mt-6 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
          <div className="font-bold text-sm">Privacy promise</div>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">We collect only what we need. No selling data, no manipulative profiling, no spam. See Privacy for details.</p>
        </div>
      </div>
    </div>
  )
}
