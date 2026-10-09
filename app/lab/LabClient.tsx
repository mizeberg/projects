'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LabClient({ quizzes }: { quizzes: any[] }) {
  const [active, setActive] = useState(quizzes[0])
  const [answers, setAnswers] = useState<Record<string,string>>({})
  const [result, setResult] = useState<any>(null)
  const [shareId, setShareId] = useState<string | null>(null)

  const idx = active.questions.findIndex((q:any)=> !answers[q.id])
  const progress = Object.keys(answers).length / active.questions.length
  const currentQ = active.questions.find((q:any)=> !answers[q.id])

  function pick(qid:string, optId:string) {
    const next = { ...answers, [qid]: optId }
    setAnswers(next)
    if (Object.keys(next).length === active.questions.length) {
      compute(next)
    }
  }

  async function compute(ans: Record<string,string>) {
    // score traits
    const scores: Record<string, number> = {}
    active.questions.forEach((q:any)=>{
      const opt = q.options.find((o:any)=> o.id===ans[q.id])
      if (!opt) return
      Object.entries(opt.traits).forEach(([k,v]:any)=> scores[k]=(scores[k]||0)+v)
    })
    const top = Object.entries(scores).sort((a,b)=> b[1]-a[1])[0][0]
    const res = active.results.find((r:any)=> r.id===top) || active.results[0]
    setResult(res)
    // create shareable result
    try {
      const resp = await fetch('/api/lab', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ quizId: active.id, resultId: res.id, answers: ans })
      })
      const data = await resp.json()
      if (data.shareId) setShareId(data.shareId)
    } catch {}
  }

  function restart() {
    setAnswers({})
    setResult(null)
    setShareId(null)
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/" className="text-zinc-500 hover:text-white">Home</Link>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">Personality Lab</span>
      </div>

      <div className="mt-4 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 md:p-8">
        <div className="flex flex-wrap gap-2">
          {quizzes.map((q:any)=> (
            <button key={q.id} onClick={()=>{ setActive(q); restart() }} className={`px-4 py-2 rounded-full text-sm font-medium border ${active.id===q.id ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>{q.title}</button>
          ))}
        </div>
        <h1 className="mt-6 font-black tracking-tighter text-3xl">{active.title}</h1>
        <p className="text-zinc-400 mt-2 max-w-[720px]">{active.description} <span className="text-zinc-500 text-sm">For entertainment only — not a scientific assessment.</span></p>
        <div className="mt-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-violet-500 transition-all" style={{ width: `${progress*100}%` }} />
        </div>
      </div>

      {!result ? (
        currentQ ? (
          <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-950 p-6 md:p-8">
            <div className="text-xs tracking-[0.2em] font-black text-violet-300">QUESTION {Object.keys(answers).length+1} OF {active.questions.length}</div>
            <h2 className="mt-3 font-bold text-xl md:text-2xl leading-tight">{currentQ.prompt}</h2>
            <div className="mt-6 grid gap-3">
              {currentQ.options.map((o:any)=> (
                <button key={o.id} onClick={()=> pick(currentQ.id, o.id)} className="text-left p-4 rounded-2xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 transition flex items-center justify-between gap-4">
                  <span className="font-medium">{o.label}</span>
                  <span className="h-8 w-8 shrink-0 grid place-items-center rounded-full border border-zinc-700 bg-zinc-950 text-sm">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-900 p-8 text-center">
            <div className="animate-pulse text-zinc-400">Calculating your result…</div>
          </div>
        )
      ) : (
        <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="rounded-[24px] border border-zinc-800 overflow-hidden bg-zinc-950">
            <div className="h-2" style={{ background: result.color }} />
            <div className="p-6 md:p-8">
              <div className="inline-flex px-3 py-1 rounded-full text-xs font-black tracking-widest text-white" style={{ background: result.color }}>YOUR RESULT</div>
              <h2 className="mt-3 font-black tracking-tighter text-3xl">{result.title}</h2>
              <p className="text-lg font-medium" style={{ color: result.color }}>{result.tagline}</p>
              <p className="text-zinc-300 mt-4 leading-relaxed">{result.description}</p>

              <div className="mt-6 grid sm:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                  <div className="text-xs font-black tracking-widest text-zinc-400">STRENGTHS</div>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">{result.strengths.map((s:string)=> <li key={s}>• {s}</li>)}</ul>
                </div>
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
                  <div className="text-xs font-black tracking-widest text-zinc-400">TRY THIS</div>
                  <ul className="mt-2 space-y-1 text-sm text-zinc-300">{result.recommendations.slice(0,3).map((s:string)=> <li key={s}>• {s}</li>)}</ul>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <button onClick={restart} className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium hover:bg-zinc-900">Restart quiz</button>
                {shareId && <Link href={`/share/${shareId}`} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">View share page</Link>}
                {shareId && <button onClick={()=> navigator.clipboard.writeText(`${location.origin}/share/${shareId}`)} className="rounded-full bg-zinc-800 border border-zinc-700 px-5 py-2.5 text-sm font-medium">Copy link</button>}
              </div>
              <p className="text-xs text-zinc-500 mt-4">Shareable card includes preview image and call-to-try. No personal data auto-published.</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-zinc-800 bg-white text-zinc-900 p-6 md:p-8 flex flex-col">
            <div className="text-[11px] tracking-[0.2em] font-black text-zinc-500">SHAREABLE CARD</div>
            <div className="mt-4 rounded-[20px] overflow-hidden border border-zinc-200 shadow-xl">
              <div className="h-40 p-6 flex flex-col justify-end text-white" style={{ background: `linear-gradient(135deg, ${result.color}, #0a0a0f)` }}>
                <div className="text-xs tracking-widest font-black opacity-80">INTERNET ARCADE • PERSONALITY LAB</div>
                <div className="font-black text-2xl leading-none mt-2">{result.title}</div>
                <div className="text-sm opacity-90">{result.tagline}</div>
              </div>
              <div className="p-5">
                <p className="text-sm leading-relaxed text-zinc-700">{result.description.slice(0,140)}…</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                  <span className="h-6 w-6 rounded-full grid place-items-center text-white" style={{ background: result.color }}>IA</span>
                  internetarcade.com/lab • Try it yourself
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-zinc-500 text-center">This card is what friends see when you share.</div>
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="font-bold">About this lab</h3>
        <p className="text-sm text-zinc-400 mt-2 leading-relaxed">These quizzes are original entertainment experiences designed for self-reflection and play. They are not scientifically validated psychological assessments and do not infer sensitive personal attributes or make medical diagnoses. Your answers stay on your device unless you choose to save or share a result.</p>
      </div>
    </div>
  )
}
