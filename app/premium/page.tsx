import Link from 'next/link'

export const metadata = { title: 'Arcade Plus — Internet Arcade' }

export default function Page() {
  return (
    <div className="mx-auto max-w-[1080px] px-6 py-10">
      <div className="rounded-[32px] border border-zinc-800 bg-zinc-900 p-6 md:p-10 grid lg:grid-cols-2 gap-10 items-start">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white text-black px-3 py-1 text-xs font-black">ARCADE PLUS</div>
          <h1 className="mt-4 font-black tracking-tighter text-4xl leading-none">The full playground.<br /><span className="text-zinc-500">Keep the free tier forever.</span></h1>
          <p className="text-zinc-400 mt-4 leading-relaxed">Free is great. Plus is for explorers who want more mysteries, more worlds, and to save everything. No tricks, no fake countdowns.</p>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-white bg-white text-black p-5">
              <div className="text-xs font-black tracking-widest">MONTHLY</div>
              <div className="font-black text-3xl mt-1">$6.99<span className="text-sm font-medium text-zinc-600">/mo</span></div>
              <div className="text-xs text-zinc-600 mt-1">Billed monthly. Cancel anytime.</div>
              <Link href="/auth" className="mt-4 block text-center rounded-full bg-black text-white py-2.5 text-sm font-bold">Start Plus</Link>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="text-xs font-black tracking-widest text-zinc-400">ANNUAL</div>
              <div className="font-black text-3xl mt-1">$59<span className="text-sm font-medium text-zinc-500">/yr</span></div>
              <div className="text-xs text-emerald-400 mt-1">Save ~30% • $4.92/mo</div>
              <Link href="/auth" className="mt-4 block text-center rounded-full bg-white text-black py-2.5 text-sm font-bold">Choose Annual</Link>
            </div>
          </div>

          <div className="mt-6 text-xs text-zinc-500 leading-relaxed">
            Pricing configurable via env: ARCADE_PLUS_MONTHLY=6.99, ARCADE_PLUS_ANNUAL=59. Renewal terms: monthly renews every 30 days, annual every 365. Cancel in Account → Subscription. Refund policy: contact support within 14 days. See Terms.
          </div>
        </div>

        <div className="space-y-4">
          {[
            { title: 'Everything in Free', items: ['Curiosity Compass + 2 other labs (basic)', 'Selected mysteries (Vanishing Violin, Midnight Library)', 'Daily quest + archive (last 7 days)', 'Basic creative tools (5/day)'] , free: true },
            { title: 'Plus unlocks', items: ['All personality labs + advanced personalization', 'Expanded mystery collection (Neon Alley + upcoming)', 'Unlimited creative generations + premium templates', 'Saved collections, history, cross-device sync', 'Early access to new worlds'], free: false },
          ].map(box=> (
            <div key={box.title} className={`rounded-2xl border p-5 ${box.free ? 'bg-zinc-950 border-zinc-800' : 'bg-violet-950/30 border-violet-900'}`}>
              <div className={`text-xs font-black tracking-widest ${box.free ? 'text-zinc-400' : 'text-violet-300'}`}>{box.title.toUpperCase()}</div>
              <ul className="mt-3 space-y-2 text-sm">
                {box.items.map((it:string)=> <li key={it} className="flex gap-2"><span className={box.free ? 'text-zinc-500' : 'text-violet-400'}>✓</span><span className={box.free ? 'text-zinc-300' : 'text-white'}>{it}</span></li>)}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="font-bold text-sm">Real billing — setup required</div>
            <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
              To enable live payments: set <span className="font-mono text-zinc-300">STRIPE_SECRET_KEY</span>, <span className="font-mono text-zinc-300">STRIPE_PRICE_MONTHLY</span>, <span className="font-mono text-zinc-300">STRIPE_PRICE_ANNUAL</span>, and <span className="font-mono text-zinc-300">STRIPE_WEBHOOK_SECRET</span>. Then configure checkout and webhook at <span className="font-mono">/api/billing/webhook</span>. Demo toggle in Account simulates entitlement without charging. Never mark paid via frontend redirect — webhook verifies.
            </p>
            <div className="mt-3 text-xs font-mono bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-zinc-300">
              POST /api/billing/create-checkout<br/>POST /api/billing/webhook (Stripe → entitlements)<br/>GET /api/billing/portal (manage)
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-zinc-500">Questions? Visit Help or email hello@internetarcade.example — we answer every note.</div>
    </div>
  )
}
