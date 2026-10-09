import Link from 'next/link'
export default function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-[1280px] px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <div className="font-black tracking-tighter text-lg">INTERNET ARCADE</div>
          <p className="text-zinc-400 mt-2 leading-relaxed">The internet’s most interesting digital playground. Curious, creative, surprising — made for humans who love to explore.</p>
          <p className="text-xs text-zinc-500 mt-4">© {new Date().getFullYear()} Internet Arcade. All rights reserved.</p>
        </div>
        <div>
          <div className="font-bold text-white mb-3">Explore</div>
          <div className="flex flex-col gap-2 text-zinc-400">
            <Link href="/lab" className="hover:text-white">Personality Lab</Link>
            <Link href="/explorer" className="hover:text-white">What If? Explorer</Link>
            <Link href="/mystery" className="hover:text-white">Mystery Room</Link>
            <Link href="/creative" className="hover:text-white">Creative Machine</Link>
            <Link href="/quest" className="hover:text-white">Daily Quest</Link>
          </div>
        </div>
        <div>
          <div className="font-bold text-white mb-3">Company</div>
          <div className="flex flex-col gap-2 text-zinc-400">
            <Link href="/help" className="hover:text-white">Help Center</Link>
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/premium" className="hover:text-white">Arcade Plus</Link>
            <Link href="/dashboard" className="hover:text-white">Owner Dashboard</Link>
          </div>
        </div>
        <div>
          <div className="font-bold text-white mb-3">Stay curious</div>
          <p className="text-zinc-400">No spam, just one weekly digest of new playground drops. (Coming soon)</p>
          <div className="mt-3 flex gap-2">
            <input placeholder="your@email.com" className="flex-1 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm outline-none focus:border-zinc-700" />
            <button className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold">Join</button>
          </div>
          <p className="text-xs text-zinc-500 mt-3">We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </div>
    </footer>
  )
}
