import { findResultByShareId } from '@/lib/db'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ShareActions from '@/components/ShareActions'

export async function generateMetadata({ params }: { params: { id: string } }) {
  const r = findResultByShareId(params.id)
  if (!r) return { title: 'Not found — Internet Arcade' }
  return {
    title: `${r.title} — Internet Arcade`,
    description: r.summary,
    openGraph: {
      title: `${r.title} — Internet Arcade`,
      description: r.summary,
      type: 'article',
      url: `/share/${r.shareId}`,
    },
    twitter: { card: 'summary_large_image', title: r.title, description: r.summary },
  }
}

export default function Page({ params }: { params: { id: string } }) {
  const r = findResultByShareId(params.id)
  if (!r) return notFound()
  const data = r.data as any
  const isPersonality = r.type==='personality'
  const isMystery = r.type==='mystery'
  const isWhatIf = r.type==='whatif'
  const isCreative = r.type==='creative'
  const isQuest = r.type==='quest'

  return (
    <div className="mx-auto max-w-[880px] px-6 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-white">← Back to arcade</Link>

      <div className="mt-6 rounded-[24px] border border-zinc-800 bg-zinc-900 overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-violet-500 via-cyan-400 to-amber-400" />
        <div className="p-6 md:p-10">
          <div className="text-xs tracking-[0.2em] font-black text-violet-300">SHARED FROM INTERNET ARCADE</div>
          <h1 className="mt-2 font-black tracking-tighter text-3xl md:text-4xl leading-none">{r.title}</h1>
          <p className="mt-3 text-zinc-300 leading-relaxed">{r.summary}</p>
          <div className="mt-2 text-xs text-zinc-500">{new Date(r.createdAt).toLocaleDateString()} • {r.type} • {r.isPublic ? 'Public' : 'Private'}</div>

          {/* Pretty card */}
          <div className="mt-8 rounded-[20px] overflow-hidden border border-zinc-800 bg-zinc-950 grid md:grid-cols-[1.2fr_0.8fr]">
            <div className="p-6 md:p-8">
              {isPersonality && (
                <>
                  <div className="inline-flex px-3 py-1 rounded-full text-xs font-black text-white" style={{ background: data.result?.color || '#7c5cff' }}>{data.result?.title}</div>
                  <div className="mt-2 font-bold" style={{ color: data.result?.color }}>{data.result?.tagline}</div>
                  <p className="mt-3 text-sm text-zinc-300 leading-relaxed">{data.result?.description}</p>
                </>
              )}
              {isWhatIf && (
                <>
                  <div className="text-sm font-bold">{data.hook}</div>
                  <div className="mt-2 text-sm text-zinc-300">{data.choice?.outcome}</div>
                  <div className="mt-3 text-xs text-zinc-500">Choice: {data.choice?.label}</div>
                </>
              )}
              {isMystery && (
                <>
                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${data.correct ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>{data.correct ? 'SOLVED' : 'CASE FILE'}</div>
                  <div className="mt-2 text-sm text-zinc-300">Accused: {data.accused} • Difficulty: {data.difficulty} • Hints: {data.hintsUsed}</div>
                </>
              )}
              {isCreative && (
                <>
                  <div className="font-black">{data.output?.title}</div>
                  <p className="text-sm text-zinc-300 mt-2 whitespace-pre-wrap">{data.output?.body}</p>
                </>
              )}
              {isQuest && (
                <>
                  <div className="font-bold">Daily Quest — {data.date}</div>
                  <p className="text-sm text-zinc-300 mt-2">{data.puzzle}</p>
                </>
              )}
            </div>
            <div className="bg-white text-zinc-900 p-6 flex flex-col justify-between">
              <div>
                <div className="text-[11px] tracking-[0.2em] font-black text-zinc-500">INTERNET ARCADE CARD</div>
                <div className="font-black text-xl mt-2 leading-tight">{r.title}</div>
                <p className="text-sm text-zinc-600 mt-2">{r.summary.slice(0,120)}…</p>
              </div>
              <div className="mt-6 text-xs font-bold flex items-center gap-2"><span className="h-6 w-6 rounded-full bg-black text-white grid place-items-center">IA</span> internetarcade.com</div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={r.experienceId ? `/${r.experienceId}` : '/'} className="rounded-full bg-white text-black px-6 py-3 font-bold text-sm">Try it yourself →</Link>
            <ShareActions url={`${process.env.NEXT_PUBLIC_URL || ''}/share/${r.shareId}`} />
          </div>

          <p className="text-xs text-zinc-500 mt-6">Shared results are public pages with preview metadata. No private data is auto-published. Want your own? Explore free — sign in to save collections.</p>
        </div>
      </div>
    </div>
  )
}
