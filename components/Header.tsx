'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header({ user }: { user?: any }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const nav = [
    { href: '/lab', label: 'Lab' },
    { href: '/explorer', label: 'Explorer' },
    { href: '/mystery', label: 'Mystery' },
    { href: '/creative', label: 'Create' },
    { href: '/quest', label: 'Daily' },
  ]
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6 flex h-[64px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 flex items-center justify-center font-black text-sm tracking-tighter">IA</div>
          <div className="leading-none">
            <div className="font-black tracking-tighter text-[18px]">INTERNET ARCADE</div>
            <div className="text-[10px] tracking-[0.2em] text-zinc-400 font-medium -mt-1">THE INTERNET IS YOUR PLAYGROUND</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {nav.map(n => (
            <Link key={n.href} href={n.href} className={`px-3 py-2 rounded-full text-sm font-medium transition ${pathname===n.href ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}>{n.label}</Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/premium" className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-2 text-sm font-bold hover:bg-zinc-100 transition">Arcade Plus <span className="hidden lg:inline text-xs font-medium bg-black text-white px-2 py-0.5 rounded-full">$6.99/mo</span></Link>
          {user ? (
            <Link href="/account" className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 grid place-items-center text-sm font-bold">{user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}</Link>
          ) : (
            <Link href="/auth" className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-900 transition">Sign in</Link>
          )}
          <button onClick={()=>setOpen(!open)} className="md:hidden h-9 w-9 grid place-items-center rounded-full border border-zinc-800">
            <span className="text-lg">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-zinc-800 bg-zinc-950 px-4 py-4 flex flex-col gap-2">
          {nav.map(n=> <Link key={n.href} href={n.href} onClick={()=>setOpen(false)} className="px-4 py-3 rounded-xl bg-zinc-900 text-sm font-medium">{n.label}</Link>)}
          <Link href="/premium" className="px-4 py-3 rounded-xl bg-white text-black text-sm font-bold text-center">Get Arcade Plus — $6.99/mo</Link>
        </div>
      )}
    </header>
  )
}
