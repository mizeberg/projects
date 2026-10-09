'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function MysteryClient({ mysteries }: { mysteries: any[] }) {
  const [active, setActive] = useState(mysteries[0])
  const [selected, setSelected] = useState<string | null>(null)
  const [hintsUsed, setHintsUsed] = useState(0)
  const [solved, setSolved] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [shareId, setShareId] = useState<string|null>(null)

  function reset(m:any) { setActive(m); setSelected(null); setHintsUsed(0); setSolved(false); setResult(null); setShareId(null) }

  async function submit() {
    if (!selected) return
    const correct = selected===active.solution.culpritId
    setSolved(true)
    setResult(correct ? 'correct' : 'wrong')
    try {
      const r = await fetch('/api/mystery', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mysteryId: active.id, accused: selected, hintsUsed, correct }) })
      const j = await r.json()
      if (j.shareId) setShareId(j.shareId)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/" className="text-zinc-500 hover:text-white">Home</Link>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">Mystery Room</span>
      </div>
      <h1 className="mt-4 font-black tracking-tighter text-3xl">The Mystery Room</h1>
      <p className="text-zinc-400 mt-2">Original fictional cases. No copy-pasted plots. Every clue is fair, every solution logically consistent.</p>

      <div className="mt-6 flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {mysteries.map((m:any)=> (
          <button key={m.id} onClick={()=> reset(m)} className={`shrink-0 text-left rounded-2xl border p-3 min-w-[220px] ${active.id===m.id ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-white'}`}>
            <div className="text-xs font-black tracking-widest opacity-60">{m.difficulty} • {m.estMinutes} min {m.isPremium ? '• PLUS' : ''}</div>
            <div className="font-bold leading-tight mt-1">{m.title}</div>
            <div className={`text-xs mt-1 line-clamp-1 ${active.id===m.id ? 'text-zinc-600' : 'text-zinc-400'}`}>{m.premise.slice(0,60)}…</div>
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="p-6 md:p-8">
          <div className="flex flex-wrap gap-2 items-center">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-black text-xs font-black">{active.difficulty.toUpperCase()}</span>
            <span className="text-sm text-zinc-400">{active.location} • {active.estMinutes} min</span>
            {active.isPremium && <span className="ml-auto px-3 py-1 rounded-full bg-white text-black text-xs font-black">PLUS PREVIEW</span>}
          </div>
          <h2 className="mt-3 font-black text-2xl leading-tight">{active.title}</h2>
          <p className="mt-2 text-zinc-300 leading-relaxed">{active.premise}</p>

          {!solved ? (
            <>
              <div className="mt-6 grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-black tracking-widest text-xs text-zinc-400">CHARACTERS</h3>
                  <div className="mt-3 grid gap-3">
                    {active.characters.map((c:any)=> (
                      <div key={c.id} className={`p-4 rounded-2xl border flex gap-3 cursor-pointer transition ${selected===c.id ? 'bg-white text-black border-white' : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'}`} onClick={()=> setSelected(c.id)}>
                        <div className={`h-10 w-10 rounded-xl grid place-items-center font-black text-sm shrink-0 ${selected===c.id ? 'bg-black text-white' : 'bg-zinc-900 border border-zinc-800'}`}>{c.name[0]}</div>
                        <div>
                          <div className="font-bold text-sm leading-tight">{c.name} <span className={`text-xs font-medium ${selected===c.id ? 'text-zinc-600':'text-zinc-500'}`}>— {c.role}</span></div>
                          <div className={`text-xs mt-1 leading-relaxed ${selected===c.id ? 'text-zinc-700':'text-zinc-400'}`}>{c.bio}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-black tracking-widest text-xs text-zinc-400">EVIDENCE</h3>
                  <div className="mt-3 grid gap-3">
                    {active.evidence.map((e:any)=> (
                      <div key={e.id} className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                        <div className="font-bold text-sm">{e.title}</div>
                        <div className="text-xs text-zinc-400 mt-1 leading-relaxed">{e.description}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
                    <div className="text-xs font-black tracking-widest text-zinc-400">TIMELINE</div>
                    <div className="mt-2 space-y-1.5">
                      {active.timeline.map((t:any)=> <div key={t.time} className="flex gap-3 text-xs"><span className="font-mono font-bold text-amber-400">{t.time}</span><span className="text-zinc-300">{t.event}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3 items-center">
                <button onClick={submit} disabled={!selected} className="rounded-full bg-white text-black px-6 py-3 font-bold text-sm disabled:opacity-40">Accuse</button>
                <button onClick={()=> setHintsUsed(h=> Math.min(h+1, active.hints.length))} className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-800">Hint {hintsUsed}/{active.hints.length}</button>
                {hintsUsed>0 && <span className="text-sm text-amber-300">{active.hints[hintsUsed-1]}</span>}
                {selected && <span className="text-sm text-zinc-400">Selected: <span className="font-bold text-white">{active.characters.find((c:any)=> c.id===selected)?.name}</span></span>}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl border p-6" style={{ background: result==='correct' ? '#052e16' : '#450a0a', borderColor: result==='correct' ? '#16a34a' : '#dc2626' }}>
              <div className="font-black text-lg" style={{ color: result==='correct' ? '#86efac' : '#fca5a5' }}>{result==='correct' ? '✓ Case closed — correct!' : '✗ Not quite — but here’s the truth'}</div>
              <p className="mt-2 text-sm leading-relaxed text-zinc-100"><span className="font-bold">Culprit: {active.characters.find((c:any)=> c.id===active.solution.culpritId)?.name}</span> — {active.solution.explanation}</p>
              <p className="mt-2 text-xs text-zinc-300">Trick: {active.solution.trick}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={()=> { setSolved(false); setSelected(null); setResult(null); setShareId(null)}} className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm">Try again</button>
                {shareId && <Link href={`/share/${shareId}`} className="rounded-full bg-white text-black px-4 py-2 text-sm font-bold">View share card</Link>}
                {shareId && <button onClick={()=> navigator.clipboard.writeText(`${location.origin}/share/${shareId}`)} className="rounded-full bg-black text-white px-4 py-2 text-sm">Copy link</button>}
                <span className="text-xs py-2 text-white/70">Hints used: {hintsUsed} • {hintsUsed===0 ? 'Perfect deduction!' : hintsUsed===1 ? 'Sharp!' : 'Good effort'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-500">Completion stats are tracked (when signed in) and contribute to trending. Streaks are optional and never punitive.</div>
    </div>
  )
}
