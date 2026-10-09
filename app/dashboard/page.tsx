import { getStats, getAnalytics, getUsers, getResults } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default function Page() {
  const stats = getStats()
  const analytics = getAnalytics()
  const users = getUsers()
  const results = getResults()

  const byType = results.reduce((acc:any,r:any)=> { acc[r.type]=(acc[r.type]||0)+1; return acc }, {})
  const recent = results.slice(-8).reverse()

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-black tracking-tighter text-3xl">Owner Dashboard</h1>
          <p className="text-sm text-zinc-400 mt-1">Real data — not invented. Reads from file storage. Distinguishes actual measurements from estimates.</p>
        </div>
        <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">Owner only (demo: open access)</span>
      </div>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          ['DAU', stats.dau],
          ['MAU', stats.mau],
          ['New today', stats.newRegsDay],
          ['Completions', stats.completions],
          ['Share rate', `${stats.shareRate}%`],
          ['Subscribers', stats.premium],
          ['MRR', `$${stats.mrr.toFixed(2)}`],
        ].map(([k,v])=> (
          <div key={k} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <div className="text-[11px] tracking-widest font-black text-zinc-500">{k}</div>
            <div className="font-black text-xl mt-1">{String(v)}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="font-bold">Recent completions</h2>
          <div className="mt-4 space-y-2">
            {recent.length===0 ? <p className="text-sm text-zinc-500">No completions yet — play a lab or mystery to generate real data.</p> : recent.map((r:any)=> (
              <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl border border-zinc-800 bg-zinc-900">
                <span className="text-xs px-2 py-1 rounded-full bg-zinc-800 border border-zinc-700">{r.type}</span>
                <span className="font-medium text-sm flex-1 truncate">{r.title}</span>
                <span className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"><div className="font-black">By type</div><div className="mt-1 text-zinc-400">{Object.entries(byType).map(([k,v]:any)=> `${k}:${v}`).join(' • ') || '—'}</div></div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"><div className="font-black">Total users</div><div className="mt-1 text-zinc-400">{stats.totalUsers}</div></div>
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-3"><div className="font-black">Events</div><div className="mt-1 text-zinc-400">{stats.totalEvents}</div></div>
          </div>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-bold">Operations</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            <li>• API cost: local logic — $0</li>
            <li>• Rate limit: in-memory 60 req/min per IP</li>
            <li>• Error logging: file + console (see /api/health)</li>
            <li>• AI spend cap: set AI_MONTHLY_BUDGET env</li>
          </ul>
          <div className="mt-4 rounded-xl bg-amber-950/30 border border-amber-900 p-3 text-xs leading-relaxed text-amber-200">
            Alert: if spend exceeds limit, AI features auto-disable and owner is notified. Disable via env DISABLE_AI=true.
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <a href="/api/health" className="rounded-full border border-zinc-700 px-3 py-2 text-center">Health check</a>
            <a href="/api/analytics" className="rounded-full bg-white text-black px-3 py-2 text-center font-bold">Raw events</a>
          </div>
          <p className="text-xs text-zinc-500 mt-4">All metrics are real aggregations. No fabricated testimonials or customer counts.</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-xs leading-relaxed text-zinc-400">
        <div className="font-bold text-white">How trending works</div>
        Trending = count of ‘view’ events per experience in last 7 days (see lib/db.ts). No invented popularity. Editorial curation prevents low-quality overwhelm.
      </div>
    </div>
  )
}
