import Link from 'next/link'
import { experiences, getDailyQuest, whatIfScenarios, mysteries, personalityQuizzes } from '@/lib/content'
import ExperienceCard from '@/components/ExperienceCard'
import { getAnalytics, getTrending } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default function Home() {
  const today = getDailyQuest(new Date())
  const featured = experiences[1] // What If
  const trendingMap: Record<string, number> = {}
  experiences.forEach(e => trendingMap[e.id] = getTrending(e.id))
  const trendingSorted = [...experiences].sort((a,b)=> trendingMap[b.id]-trendingMap[a.id])
  const analytics = getAnalytics()
  const hasTraffic = analytics.length > 0

  return (
    <div className="bg-[#09090b]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-zinc-800">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-transparent to-transparent" />
          <div className="absolute -top-32 -right-32 h-[600px] w-[600px] rounded-full blur-[120px] opacity-30" style={{ background: 'radial-gradient(circle, #7c5cff, transparent 60%)' }} />
          <div className="absolute -bottom-32 -left-32 h-[500px] w-[500px] rounded-full blur-[120px] opacity-20" style={{ background: 'radial-gradient(circle, #00e5cc, transparent 60%)' }} />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-6 py-14 md:py-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs font-medium text-zinc-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> LIVE PLAYGROUND • 5 polished worlds
            </div>
            <h1 className="mt-6 font-black tracking-tighter leading-[0.85] text-[42px] md:text-[64px]">
              THE INTERNET<br />
              <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent">IS YOUR</span><br />
              PLAYGROUND.
            </h1>
            <p className="mt-4 text-[18px] leading-relaxed text-zinc-400 max-w-[560px]">You came for one thing. You’ll discover something unexpected. Personality lab, hypothetical worlds, mysteries, creative machines, and a new quest every day.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/quest" className="inline-flex items-center gap-2 rounded-full bg-white text-black px-6 py-3 font-bold text-sm hover:bg-zinc-100 transition">Start today’s quest →</Link>
              <Link href="#explore" className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-6 py-3 font-medium text-sm hover:bg-zinc-800 transition">Explore the arcade</Link>
              <span className="inline-flex items-center gap-2 text-xs text-zinc-500 px-2 py-3">No account needed. Play instantly.</span>
            </div>
            <div className="mt-8 flex items-center gap-6 text-xs">
              <div className="flex -space-x-2">
                {['🌀','🧬','🕵️','✦','⚡'].map((e,i)=> <div key={i} className="h-8 w-8 rounded-full bg-zinc-800 border-2 border-zinc-950 grid place-items-center text-sm">{e}</div>)}
              </div>
              <div className="text-zinc-500">{hasTraffic ? <><span className="text-white font-bold">{analytics.length}</span> playground events tracked live</> : 'Be one of the first explorers — every play shapes trending'}</div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-[32px] border border-zinc-800 bg-zinc-900 p-4 md:p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[11px] tracking-[0.2em] font-black text-zinc-400">DAILY FEATURED</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white text-black">Today</span>
              </div>
              <div className="mt-4 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <div className="h-44 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 p-6 flex flex-col justify-end relative overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_50%)]" />
                  <div className="relative">
                    <div className="text-4xl">🌀</div>
                    <h3 className="mt-2 font-black text-xl leading-tight text-white">{whatIfScenarios[0].title}</h3>
                    <p className="text-sm text-white/80 mt-1">{whatIfScenarios[0].hook}</p>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">8 min • Interactive</span>
                  <Link href="/explorer" className="rounded-full bg-white text-black px-4 py-2 text-sm font-bold">Play now</Link>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { k: 'Lab', v: 'Curiosity Compass', c: '#7c5cff' },
                  { k: 'Solve', v: 'Vanishing Violin', c: '#ffb020' },
                  { k: 'Create', v: 'Story Starter', c: '#ff4d6e' },
                ].map(x=> (
                  <div key={x.k} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
                    <div className="text-[10px] tracking-widest font-black" style={{ color: x.c }}>{x.k}</div>
                    <div className="text-sm font-bold leading-tight mt-1">{x.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -z-10 -right-6 -bottom-6 h-40 w-40 rounded-full blur-3xl opacity-30" style={{ background: '#ffb020' }} />
          </div>
        </div>

        <div className="border-y border-zinc-800 bg-zinc-950 overflow-hidden">
          <div className="flex animate-marquee whitespace-nowrap py-3 text-xs tracking-[0.2em] font-black text-zinc-500">
            <span className="mx-8">THINK • CREATE • DISCOVER • SOLVE • IMAGINE • CHALLENGE •</span>
            <span className="mx-8">THINK • CREATE • DISCOVER • SOLVE • IMAGINE • CHALLENGE •</span>
            <span className="mx-8">THINK • CREATE • DISCOVER • SOLVE • IMAGINE • CHALLENGE •</span>
            <span className="mx-8">THINK • CREATE • DISCOVER • SOLVE • IMAGINE • CHALLENGE •</span>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="explore" className="mx-auto max-w-[1280px] px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {['All','Think','Create','Discover','Solve','Imagine','Challenge'].map(c=> (
            <span key={c} className={`px-4 py-2 rounded-full border text-sm font-medium ${c==='All' ? 'bg-white text-black border-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'}`}>{c}</span>
          ))}
          <span className="ml-auto hidden md:inline-flex items-center gap-2 text-xs text-zinc-500"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Trending now based on real plays {hasTraffic ? `• ${analytics.length} events` : '• be first to play'}</span>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {experiences.map(exp => <ExperienceCard key={exp.id} exp={exp} />)}
        </div>

        <div className="mt-6 grid md:grid-cols-12 gap-4">
          <div className="md:col-span-8 rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 grid md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="text-xs tracking-[0.2em] font-black text-amber-400">DAILY QUEST</div>
              <h3 className="mt-2 font-black text-2xl leading-tight">A new playground every day.</h3>
              <p className="text-sm text-zinc-400 mt-2">Logic puzzle, creative challenge, curiosity spark, and a tiny experiment. Keep a streak — no punishments.</p>
              <div className="mt-4 flex gap-2">
                <Link href="/quest" className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">Play today</Link>
                <span className="text-xs text-zinc-500 py-2.5">{today.date}</span>
              </div>
            </div>
            <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4">
              <div className="text-xs font-bold text-zinc-300">TODAY’S PUZZLE</div>
              <p className="text-sm mt-2 leading-relaxed">{today.puzzle.q}</p>
              <div className="mt-3 text-xs text-zinc-500">Creative: {today.creative}</div>
            </div>
          </div>
          <div className="md:col-span-4 rounded-[24px] border border-zinc-800 bg-gradient-to-br from-violet-600 to-cyan-600 p-[1px]">
            <div className="rounded-[23px] bg-zinc-950 p-6 h-full flex flex-col">
              <div className="text-xs tracking-[0.2em] font-black text-violet-300">ARCADE PLUS</div>
              <h3 className="mt-2 font-black text-xl">Unlock the full playground</h3>
              <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                <li>• Premium mysteries & worlds</li>
                <li>• Unlimited creative generations</li>
                <li>• Save collections & streaks</li>
                <li>• Early access to new drops</li>
              </ul>
              <Link href="/premium" className="mt-6 rounded-full bg-white text-black text-center py-3 font-bold text-sm">Join for $6.99/mo</Link>
              <p className="text-[11px] text-zinc-500 text-center mt-2">Cancel anytime. Keep free tier forever.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Discovery */}
      <section className="mx-auto max-w-[1280px] px-6 pb-10">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-black tracking-tighter text-2xl md:text-3xl">Trending now</h2>
          <Link href="/explorer" className="text-sm font-medium text-zinc-400 hover:text-white">View all →</Link>
        </div>
        <div className="mt-5 grid md:grid-cols-3 gap-4">
          {trendingSorted.slice(0,3).map(exp=> (
            <div key={exp.id} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 flex gap-4 items-center">
              <div className="h-14 w-14 rounded-2xl grid place-items-center text-2xl bg-zinc-950 border border-zinc-800">{exp.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold leading-tight">{exp.title}</div>
                <div className="text-xs text-zinc-500 mt-1 line-clamp-1">{exp.description}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-black" style={{ color: exp.color }}>{trendingMap[exp.id] > 0 ? `${trendingMap[exp.id]} plays` : '— plays yet'}</div>
                <div className="text-[11px] text-zinc-500">this week {trendingMap[exp.id]===0 && '• be first'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-xs tracking-[0.2em] font-black text-zinc-400">NEW DISCOVERY</div>
            <h3 className="font-black text-lg mt-2">{personalityQuizzes[0].title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{personalityQuizzes[0].description}</p>
            <Link href="/lab" className="inline-flex mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-800">Take quiz</Link>
          </div>
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-xs tracking-[0.2em] font-black text-zinc-400">MYSTERY OF THE WEEK</div>
            <h3 className="font-black text-lg mt-2">{mysteries[0].title}</h3>
            <p className="text-sm text-zinc-400 mt-1">{mysteries[0].premise.slice(0,90)}…</p>
            <Link href="/mystery" className="inline-flex mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium hover:bg-zinc-800">Solve case</Link>
          </div>
          <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6">
            <div className="text-xs tracking-[0.2em] font-black text-zinc-400">CREATIVE PROMPT</div>
            <h3 className="font-black text-lg mt-2">Build a world tonight</h3>
            <p className="text-sm text-zinc-400 mt-1">“A market that appears only when two strangers make eye contact.” Turn it into a story.</p>
            <Link href="/creative" className="inline-flex mt-4 rounded-full bg-white text-black px-4 py-2 text-sm font-bold">Create</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1280px] px-6 pb-16">
        <div className="rounded-[24px] border border-zinc-800 bg-zinc-900 p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
          <div>
            <h3 className="font-black text-xl tracking-tight">Made for curious humans, not algorithms.</h3>
            <p className="text-sm text-zinc-400 mt-1">No ads. No doomscroll. Just five excellent worlds to return to. Free forever, plus optional upgrades.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link href="/help" className="rounded-full border border-zinc-700 px-5 py-2.5 text-sm font-medium">How it works</Link>
            <Link href="/premium" className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">See Plus benefits</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
