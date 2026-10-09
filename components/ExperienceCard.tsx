import Link from 'next/link'
export default function ExperienceCard({ exp, featured }: { exp: any, featured?: boolean }) {
  return (
    <Link href={`/${exp.slug}`} className={`group relative overflow-hidden rounded-[24px] border border-zinc-800 bg-zinc-900 flex flex-col ${featured ? 'md:col-span-2 md:row-span-2' : ''} hover:border-zinc-700 transition`}>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500" style={{ background: `radial-gradient(600px circle at 0% 0%, ${exp.color}18, transparent 60%)` }} />
      <div className="p-6 flex flex-col h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="h-12 w-12 rounded-2xl grid place-items-center text-xl border border-zinc-800 bg-zinc-950" style={{ borderColor: `${exp.color}30` }}>{exp.icon}</div>
          <div className="flex items-center gap-2">
            {exp.isPremium && <span className="text-[10px] tracking-widest font-black px-2 py-1 rounded-full bg-white text-black">PLUS</span>}
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300">{exp.category}</span>
          </div>
        </div>
        <div className="mt-5">
          <h3 className="font-black tracking-tight text-[20px] leading-none">{exp.title}</h3>
          <p className="text-sm text-zinc-400 leading-relaxed mt-2 line-clamp-2">{exp.description}</p>
        </div>
        <div className="mt-auto pt-6 flex items-center gap-3 text-xs text-zinc-500 font-medium">
          <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: exp.color}} /> {exp.estMinutes} min</span>
          <span>•</span>
          <span>{exp.difficulty || 'All levels'}</span>
          <span className="ml-auto inline-flex items-center gap-1 font-bold text-white group-hover:gap-2 transition-all">Play →</span>
        </div>
      </div>
      <div className="h-1 w-full" style={{ background: exp.color }} />
    </Link>
  )
}
