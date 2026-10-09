'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ExplorerClient({ scenarios }: { scenarios: any[] }) {
  const [active, setActive] = useState(scenarios[0])
  const [choice, setChoice] = useState<any>(null)
  const [shareId, setShareId] = useState<string | null>(null)

  async function pick(c: any) {
    setChoice(c)
    try {
      const r = await fetch('/api/explorer', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ scenarioId: active.id, choiceId: c.id }) })
      const j = await r.json()
      if (j.shareId) setShareId(j.shareId)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/" className="text-zinc-500 hover:text-white">Home</Link>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">What If? Explorer</span>
      </div>

      <h1 className="mt-4 font-black tracking-tighter text-3xl">What If? Explorer</h1>
      <p className="text-zinc-400 mt-2">Play with hypotheticals. Clear assumptions, real science, honest speculation — then choose your path.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {scenarios.map((s:any)=> (
          <button key={s.id} onClick={()=>{ setActive(s); setChoice(null); setShareId(null)}} className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium border ${active.id===s.id ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>{s.title}</button>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-zinc-800 overflow-hidden bg-zinc-900">
        <div className="grid md:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 md:p-8">
            <div className="inline-flex items-center gap-2 text-xs font-black tracking-[0.2em] text-cyan-300">SCENARIO</div>
            <h2 className="mt-2 font-black text-2xl leading-tight">{active.title}</h2>
            <p className="mt-2 text-zinc-300 leading-relaxed">{active.hook}</p>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
                <div className="text-xs font-black tracking-widest text-zinc-400">ASSUMPTIONS</div>
                <ul className="mt-2 space-y-1 text-sm text-zinc-300">{active.assumptions.map((a:string)=> <li key={a}>• {a}</li>)}</ul>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-emerald-950/30 border border-emerald-900 p-4">
                  <div className="text-xs font-black tracking-widest text-emerald-400">ESTABLISHED SCIENCE</div>
                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{active.science}</p>
                </div>
                <div className="rounded-2xl bg-violet-950/30 border border-violet-900 p-4">
                  <div className="text-xs font-black tracking-widest text-violet-300">SPECULATION</div>
                  <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{active.speculation}</p>
                </div>
              </div>
            </div>

            {!choice ? (
              <div className="mt-6">
                <div className="text-xs font-black tracking-widest text-zinc-400">CHOOSE YOUR THREAD</div>
                <div className="mt-3 grid gap-3">
                  {active.choices.map((c:any)=> (
                    <button key={c.id} onClick={()=>pick(c)} className="text-left p-4 rounded-2xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 flex items-center gap-4">
                      <span className="h-10 w-10 rounded-xl grid place-items-center text-lg bg-zinc-900 border border-zinc-800">{c.image}</span>
                      <span className="font-medium">{c.label}</span>
                      <span className="ml-auto text-zinc-500">→</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-500 mt-3">Each path is a deterministic branch, not a prediction. Educational context above distinguishes science from speculation.</p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-cyan-800 bg-cyan-950/20 p-5">
                <div className="text-xs font-black tracking-widest text-cyan-300">YOUR OUTCOME — {choice.label.toUpperCase()}</div>
                <p className="mt-2 text-zinc-100 leading-relaxed">{choice.outcome}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button onClick={()=>{ setChoice(null); setShareId(null)}} className="rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium">Try another thread</button>
                  {shareId && <Link href={`/share/${shareId}`} className="rounded-full bg-white text-black px-4 py-2 text-sm font-bold">View share page</Link>}
                  {shareId && <button onClick={()=> navigator.clipboard.writeText(`${location.origin}/share/${shareId}`)} className="rounded-full bg-zinc-800 border border-zinc-700 px-4 py-2 text-sm">Copy link</button>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-6 md:p-8 flex flex-col">
            <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900">
              <div className="h-48 bg-gradient-to-br from-violet-600 via-cyan-500 to-amber-500 grid place-items-center text-5xl">{choice ? choice.image : '🌌'}</div>
              <div className="p-4">
                <div className="text-xs tracking-[0.2em] font-black text-zinc-400">VISUAL</div>
                <p className="text-sm text-zinc-300 mt-1 leading-relaxed">{active.visualHint}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
              <div className="text-xs font-black tracking-widest text-zinc-400">SHARE TEMPLATE</div>
              <p className="text-sm text-zinc-300 mt-2 italic">“{active.shareTemplate}”</p>
            </div>
            <div className="mt-auto pt-6 text-xs text-zinc-500">Want personalized explanation? (AI optional) We keep simulation logic deterministic — AI only for tailored reflection if you choose.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
