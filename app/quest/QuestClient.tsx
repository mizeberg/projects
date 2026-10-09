'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function QuestClient({ quest }: { quest: any }) {
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState<null|boolean>(null)
  const [showCreative, setShowCreative] = useState(false)
  const [streak, setStreak] = useState(0)
  const [completed, setCompleted] = useState(false)
  const [shareId, setShareId] = useState<string|null>(null)

  useEffect(()=>{
    const s = localStorage.getItem('arcade_streak')
    if (s) setStreak(parseInt(s))
    const done = localStorage.getItem(`quest_${quest.date}`)
    if (done) setCompleted(true)
  }, [quest.date])

  function check() {
    const ok = answer.trim().toLowerCase() === quest.puzzle.a.toLowerCase()
    setChecked(ok)
    if (ok && !completed) {
      const next = streak + 1
      setStreak(next)
      localStorage.setItem('arcade_streak', String(next))
      localStorage.setItem(`quest_${quest.date}`, '1')
      setCompleted(true)
      // record completion
      fetch('/api/quest', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ date: quest.date, puzzle: quest.puzzle.q, correct: true }) }).then(r=>r.json()).then(j=>{ if(j.shareId) setShareId(j.shareId) }).catch(()=>{})
    }
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/" className="text-zinc-500 hover:text-white">Home</Link>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">Daily Quest</span>
      </div>

      <div className="mt-4 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <div className="text-xs tracking-[0.2em] font-black text-lime-400">DAILY QUEST • {quest.date}</div>
          <h1 className="mt-2 font-black tracking-tighter text-3xl">Today’s playground</h1>
          <p className="text-zinc-400 mt-2">Five tiny adventures. Do one, do all — streaks are optional and celebratory, never punitive.</p>
        </div>
        <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 min-w-[160px] text-center">
          <div className="text-xs tracking-widest font-black text-zinc-400">STREAK</div>
          <div className="font-black text-3xl">{streak} <span className="text-lime-400">⚡</span></div>
          <div className="text-xs text-zinc-500">{completed ? 'Completed today!' : 'Complete puzzle to extend'}</div>
        </div>
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Puzzle */}
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl grid place-items-center bg-violet-600 text-white font-black text-sm">1</span>
            <span className="text-xs tracking-[0.2em] font-black text-violet-300">LOGIC PUZZLE</span>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">~3 min</span>
          </div>
          <p className="mt-4 font-medium leading-relaxed">{quest.puzzle.q}</p>
          <div className="mt-4 flex gap-2">
            <input value={answer} onChange={e=> setAnswer(e.target.value)} placeholder="Your answer" className="flex-1 rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm outline-none focus:border-zinc-700" />
            <button onClick={check} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">Check</button>
          </div>
          {checked!==null && (
            <div className={`mt-3 p-3 rounded-2xl text-sm ${checked ? 'bg-emerald-950 border border-emerald-800 text-emerald-100' : 'bg-red-950 border border-red-800 text-red-100'}`}>
              {checked ? `✓ Correct! ${quest.puzzle.explain}` : `Not quite. Try again — hint: think about what “all labels are wrong” really means.`}
            </div>
          )}
          {checked===false && (
            <button onClick={()=> { setAnswer(quest.puzzle.a); setChecked(true) }} className="mt-2 text-xs text-zinc-500 underline">Show answer (no penalty)</button>
          )}
        </div>

        {/* Creative */}
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl grid place-items-center bg-pink-600 text-white font-black text-sm">2</span>
            <span className="text-xs tracking-[0.2em] font-black text-pink-300">CREATIVE CHALLENGE</span>
            <span className="ml-auto text-xs px-2 py-1 rounded-full bg-zinc-900 border border-zinc-800">~6 min</span>
          </div>
          <p className="mt-4 font-medium leading-relaxed">{quest.creative}</p>
          <textarea placeholder="Write your 6-word story or idea here…" className="mt-4 w-full min-h-[80px] rounded-2xl bg-zinc-900 border border-zinc-800 p-3 text-sm outline-none focus:border-zinc-700" />
          <button onClick={()=> setShowCreative(!showCreative)} className="mt-3 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-900">{showCreative ? 'Hide inspiration' : 'Need a nudge?'}</button>
          {showCreative && <p className="mt-2 text-xs text-zinc-400">Try starting with a place, then a feeling, then a twist. Example: “Bottle arrived yesterday, dated tomorrow.”</p>}
        </div>

        {/* Curiosity */}
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl grid place-items-center bg-cyan-600 text-white font-black text-sm">3</span>
            <span className="text-xs tracking-[0.2em] font-black text-cyan-300">CURIOSITY QUESTION</span>
          </div>
          <p className="mt-4 font-medium leading-relaxed">{quest.curiosity}</p>
          <details className="mt-4 rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
            <summary className="cursor-pointer text-sm font-medium">Reveal context</summary>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">We link to reputable explainers (not invented). For today’s question, think about evolution, physics, or neuroscience — then chase one rabbit hole further than needed. That’s where wonder lives.</p>
          </details>
        </div>

        {/* Experiment */}
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl grid place-items-center bg-amber-600 text-white font-black text-sm">4</span>
            <span className="text-xs tracking-[0.2em] font-black text-amber-300">TINY EXPERIMENT</span>
          </div>
          <div className="mt-3 font-bold">{quest.experiment.title}</div>
          <ol className="mt-2 space-y-1 text-sm text-zinc-300 list-decimal list-inside">
            {quest.experiment.steps.map((s:string)=> <li key={s}>{s}</li>)}
          </ol>
          <div className="mt-4 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-sm">
            <div className="font-bold text-xs tracking-widest text-zinc-400">BONUS DISCOVERY</div>
            <p className="mt-1 text-zinc-400">{quest.bonus}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <div className="font-bold">Progress today</div>
          <div className="text-sm text-zinc-400">{completed ? 'Puzzle completed — streak extended!' : 'Complete the logic puzzle to log today’s quest.'} Share your achievement optionally.</div>
        </div>
        <div className="flex gap-2">
          {shareId && <Link href={`/share/${shareId}`} className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">View share card</Link>}
          <button onClick={()=> { if(shareId) navigator.clipboard.writeText(`${location.origin}/share/${shareId}`) }} disabled={!shareId} className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium disabled:opacity-40">Copy share link</button>
          <Link href="/" className="rounded-full bg-zinc-800 border border-zinc-700 px-5 py-2.5 text-sm">Back to arcade</Link>
        </div>
      </div>

      <div className="mt-6 text-xs text-zinc-500 text-center">Daily quests are deterministic and validated. History is available when you sign in. No push notifications without consent.</div>
    </div>
  )
}
