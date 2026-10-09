export const metadata = { title: 'Help Center — Internet Arcade' }

export default function Page() {
  return (
    <div className="mx-auto max-w-[880px] px-6 py-10">
      <h1 className="font-black tracking-tighter text-3xl">Help Center</h1>
      <p className="text-zinc-400 mt-2">Searchable answers, grounded in real docs. AI assistant only answers from these pages.</p>

      <div className="mt-6">
        <input placeholder="Search help… (e.g., billing, privacy, mystery hints)" className="w-full rounded-full bg-zinc-900 border border-zinc-800 px-4 py-3 text-sm outline-none focus:border-zinc-700" />
      </div>

      <div className="mt-6 grid gap-4">
        {[
          { q: 'Do I need an account?', a: 'No. Explore labs, explorer, mysteries, creative tools, and daily quests without signing in. Create an account only to save collections, streaks, and sync across devices.' },
          { q: 'What does Plus cost and what do I get?', a: 'Plus is $6.99/mo or $59/yr (≈30% off). You get premium mysteries/worlds, unlimited creative generations, saved collections, personalization, and early access. Free tier stays useful — we don’t degrade it.' },
          { q: 'How do you handle billing?', a: 'Real Stripe integration (requires STRIPE_SECRET_KEY). Webhooks verify payments server-side; entitlements update only after verification. Cancel in Account. No card stored locally.' },
          { q: 'Are personality results scientific?', a: 'No — they’re entertaining self-reflection, not validated assessments. We don’t infer sensitive attributes or diagnose. Your answers stay local unless you share a card.' },
          { q: 'How does What If separate science from speculation?', a: 'Every scenario lists assumptions, established science, and speculation as distinct sections. Branching outcomes are structured, deterministic simulation — not predictions. We cite mechanisms, not fiction as fact.' },
          { q: 'Can I delete my data?', a: 'Yes. In Account → Delete account & data removes your user, results, and quest completions. Shared public cards remain unless you request removal — email privacy@internetarcade.example.' },
          { q: 'Do you sell data or use manipulative streaks?', a: 'No. No data selling, no manipulative notifications, no punitive streaks. Streaks are opt-in and celebratory. We log only what’s needed (completions, views) for trending and analytics.' },
          { q: 'How does trending work?', a: 'Trending = count of view/completion events per experience in last 7 days — real aggregations, not invented. Editorial curation prevents low-quality spam.' },
          { q: 'Stuck in Mystery Room?', a: 'Use progressive hints (not penalties). Each mystery has a logically consistent solution. Hints track for stats but never gate success.' },
        ].map((item, i)=> (
          <details key={i} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5 open:bg-zinc-950">
            <summary className="cursor-pointer font-bold">{item.q}</summary>
            <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{item.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <h2 className="font-bold">AI Support Assistant (grounded)</h2>
        <p className="text-sm text-zinc-400 mt-1">Ask anything — it only answers from this help content and experience docs. Escalates billing disputes, privacy, and security to humans.</p>
        <div className="mt-4 flex gap-2">
          <input placeholder="e.g., How do I cancel Plus?" className="flex-1 rounded-full bg-zinc-900 border border-zinc-800 px-4 py-2.5 text-sm outline-none" />
          <button className="rounded-full bg-white text-black px-5 py-2.5 text-sm font-bold">Ask</button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">Demo: responses echo help docs locally. Connect OPENAI_API_KEY for live grounded answers — flagged accordingly.</p>
      </div>

      <div className="mt-6 text-xs text-zinc-500">Contact: hello@internetarcade.example • privacy@internetarcade.example • Include your account email for fastest help.</div>
    </div>
  )
}
