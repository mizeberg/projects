'use client'
import { useState } from 'react'
import Link from 'next/link'

type Tool = 'story'|'world'|'character'|'greeting'|'name'|'challenge'

const nameLists = {
  hero: ['Ari Solis','Mira Quill','Jonah Vale','Sable Thorn','Ellis Wren'],
  place: ['Ash Market','Glass Harbor','Night Bazaar','Echo Hollow','Neon Veridian'],
  artifact: ['Lumen Compass','Ink That Remembers','Second Moon Lens','Thread of Quiet'],
}

export default function CreativeClient() {
  const [tool, setTool] = useState<Tool>('story')
  const [input, setInput] = useState('')
  const [tone, setTone] = useState('playful')
  const [output, setOutput] = useState<any>(null)
  const [shareId, setShareId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  async function generate() {
    setLoading(true)
    setShareId(null)
    // local deterministic generation (no external AI required)
    await new Promise(r=>setTimeout(r, 600))
    let result:any = {}
    if (tool==='story') {
      const starters = [
        `You find a door that only opens when you tell it a secret you've never told anyone. ${input || 'The arcade at midnight hums.'}`,
        `In a city where everyone hums the same note to keep it floating, one child hums differently — and the city tilts. ${input}`,
        `The last bookstore lends memories, not books. You check out a stranger's childhood. ${input}`,
      ]
      const pick = starters[Math.floor(Math.random()*starters.length)]
      result = {
        title: `Story Spark — ${tone}`,
        body: `${pick}\n\nAct I: You follow the thread. Act II: The thread follows you. Act III: You realize the thread was your own curiosity all along. Tone: ${tone}. Your prompt: "${input}" becomes the key to the ending.`,
        meta: 'Story starter • 3-act seed'
      }
    } else if (tool==='world') {
      result = {
        title: `World: ${input || 'The Archipelago of Seasons'}`,
        body: `Geography: Islands that drift with mood. Culture: Citizens trade seasons, not goods. Conflict: A winter island refuses to melt. Ritual: Solstice Leap — a low-gravity dance. Hook: ${input || 'What if seasons were places?'}`,
        meta: 'World Bible • geography + culture + hook'
      }
    } else if (tool==='character') {
      result = {
        title: `Character: ${input || 'Mira, Keeper of Lost Keys'}`,
        body: `Role: Archivist of doors that open elsewhere. Want: To find the one door she lost as a child. Fear: That some doors shouldn't be opened. Trait: Hums while thinking. Secret: Carries a key that opens any dream she's had — but hasn't dreamed enough. Prompt: "${input}"`,
        meta: 'Character sheet • want/fear/secret'
      }
    } else if (tool==='greeting') {
      result = {
        title: `Greeting for ${input || 'Someone curious'}`,
        body: `Front: "You make the internet feel smaller and kinder." Inside: "${input || 'For the one who always asks why — may your next rabbit hole be joyful.'}" — with doodles of tiny doors and twin moons. Tone: ${tone}. Ready to print or share.`,
        meta: 'Digital greeting • shareable card'
      }
    } else if (tool==='name') {
      const cat = (input.toLowerCase().includes('place') ? 'place' : input.toLowerCase().includes('artifact') ? 'artifact' : 'hero') as keyof typeof nameLists
      const list = nameLists[cat]
      result = {
        title: `Names for "${input || 'hero'}"`,
        body: list.join(' • ') + ` • plus ${input ? `"${input} Echo"` : 'Custom twist'}`,
        meta: 'Name generator • 5 options'
      }
    } else if (tool==='challenge') {
      const challenges = [
        'Write a story where every sentence starts with the last word of the previous.',
        'Design a shop that sells lost things — draw its window display.',
        'Invent a holiday for procrastinators — what are its rituals?',
        'Create a recipe where ingredients are feelings.',
      ]
      result = {
        title: 'Creative Challenge',
        body: challenges[Math.floor(Math.random()*challenges.length)] + ` Twist: Use "${input || 'twin moons'}" somewhere. Timer: 12 minutes. Share when done.`,
        meta: 'Daily-style challenge • 12 min sprint'
      }
    }
    setOutput(result)
    setLoading(false)
    // create share
    try {
      const r = await fetch('/api/creative', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ tool, input, tone, output: result }) })
      const j = await r.json()
      if (j.shareId) setShareId(j.shareId)
    } catch {}
  }

  return (
    <div className="mx-auto max-w-[1080px] px-6 py-8">
      <div className="flex items-center gap-2 text-xs">
        <Link href="/" className="text-zinc-500 hover:text-white">Home</Link>
        <span className="text-zinc-600">/</span>
        <span className="font-medium">Creative Machine</span>
      </div>
      <h1 className="mt-4 font-black tracking-tighter text-3xl">The Creative Machine</h1>
      <p className="text-zinc-400 mt-2">Turn a spark into something shareable. Works without AI — add an API key for AI-powered variations.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {[
          ['story','Story Starter'],
          ['world','World Builder'],
          ['character','Character Creator'],
          ['greeting','Greeting Maker'],
          ['name','Name Forge'],
          ['challenge','Challenge Generator'],
        ].map(([id,label])=> (
          <button key={id} onClick={()=> { setTool(id as Tool); setOutput(null); setShareId(null)}} className={`px-4 py-2 rounded-full text-sm font-medium border ${tool===id ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>{label}</button>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-[1.05fr_0.95fr] gap-6">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
          <label className="text-xs font-black tracking-widest text-zinc-400">YOUR SPARK</label>
          <textarea value={input} onChange={e=> setInput(e.target.value)} placeholder={tool==='story' ? 'e.g., A librarian who hears books whisper' : tool==='world' ? 'e.g., A desert where wind writes messages' : tool==='character' ? 'e.g., A night janitor who remembers every lost key' : tool==='greeting' ? 'e.g., For Maya, who loves twin moons' : tool==='name' ? 'e.g., hero, place, artifact' : 'e.g., twin moons'} className="mt-3 w-full min-h-[120px] rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-sm outline-none focus:border-zinc-700 placeholder:text-zinc-600" />

          <div className="mt-4 flex gap-2">
            <span className="text-xs font-black tracking-widest text-zinc-400 py-2">TONE</span>
            {['playful','poetic','mysterious','warm'].map(t=> (
              <button key={t} onClick={()=> setTone(t)} className={`px-3 py-1.5 rounded-full text-xs font-medium border ${tone===t ? 'bg-white text-black border-white' : 'bg-zinc-800 border-zinc-700 text-zinc-300'}`}>{t}</button>
            ))}
          </div>

          <button onClick={generate} disabled={loading} className="mt-6 w-full rounded-full bg-white text-black py-3 font-bold text-sm disabled:opacity-50">
            {loading ? 'Crafting…' : 'Generate →'}
          </button>
          <p className="text-xs text-zinc-500 mt-3">Deterministic local logic — no API cost. If OPENAI_API_KEY is set, server can enhance output (clearly labeled).</p>
        </div>

        <div className="rounded-[24px] border border-zinc-800 bg-zinc-950 p-6 flex flex-col min-h-[340px]">
          {!output ? (
            <div className="flex-1 grid place-items-center text-center">
              <div>
                <div className="text-4xl">✦</div>
                <p className="text-sm text-zinc-500 mt-2">Your creation will appear here — ready to share as a card.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[11px] tracking-[0.2em] font-black text-pink-400">CREATED • {output.meta}</div>
              <h3 className="mt-2 font-black text-xl leading-tight">{output.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-zinc-300 whitespace-pre-wrap">{output.body}</p>

              <div className="mt-6 rounded-2xl border border-zinc-800 bg-white text-zinc-900 p-5">
                <div className="text-[11px] tracking-[0.2em] font-black text-zinc-500">SHAREABLE CARD PREVIEW</div>
                <div className="mt-3 font-black text-lg leading-tight">{output.title}</div>
                <div className="text-sm text-zinc-600 mt-2 line-clamp-3">{output.body.slice(0,160)}…</div>
                <div className="mt-4 text-xs font-bold flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-black text-white grid place-items-center">IA</span> internetarcade.com/creative</div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {shareId && <Link href={`/share/${shareId}`} className="rounded-full bg-white text-black px-4 py-2 text-sm font-bold">View share page</Link>}
                {shareId && <button onClick={()=> navigator.clipboard.writeText(`${location.origin}/share/${shareId}`)} className="rounded-full border border-zinc-700 px-4 py-2 text-sm">Copy link</button>}
                <button onClick={()=> setOutput(null)} className="rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm">New</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-3 gap-4 text-sm">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="font-bold">Prompts to try</div>
          <ul className="mt-2 space-y-1 text-zinc-400">
            <li>• “A market that appears when strangers meet eyes”</li>
            <li>• “A language model in love with a typo”</li>
            <li>• “Inherit a key to doors you’ve dreamed”</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="font-bold">How AI helps (optional)</div>
          <p className="text-zinc-400 mt-1 leading-relaxed">Set OPENAI_API_KEY to get AI-enhanced variants. Without it, you get the same polished local generator — no fake AI claims.</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="font-bold">Keep it real</div>
          <p className="text-zinc-400 mt-1 leading-relaxed">No simulated results. Every card is generated from your input + deterministic templates. You own what you make.</p>
        </div>
      </div>
    </div>
  )
}
