export const metadata = { title: 'Terms — Internet Arcade' }
export default function Page() {
  return (
    <div className="mx-auto max-w-[880px] px-6 py-10">
      <h1 className="font-black tracking-tighter text-3xl">Terms of Service</h1>
      <p className="text-sm text-zinc-500">Last updated: October 9, 2026</p>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
        <p>Welcome to Internet Arcade — a playground for curiosity. By using the site you agree to these terms.</p>
        <h2 className="font-bold text-white">Subscriptions</h2>
        <p>Arcade Plus is $6.99/mo or $59/yr (configurable via env). Renewal: monthly every 30 days, annual every 365 days. Cancel anytime in Account — access continues until period end. Payments via Stripe (when configured) with webhook verification. No entitlement via frontend redirect.</p>
        <h2 className="font-bold text-white">Refunds</h2>
        <p>Contact hello@internetarcade.example within 14 days for a refund review. We handle disputes promptly and escalate per Help Center.</p>
        <h2 className="font-bold text-white">Content & conduct</h2>
        <p>Be kind. Don’t abuse AI endpoints, scrape aggressively, or publish harmful content. You own what you create; you grant us a license to host shared cards you explicitly publish.</p>
        <h2 className="font-bold text-white">Disclaimers</h2>
        <p>Personality Labs are entertainment, not clinical tools. What-If outcomes are structured speculation, not predictions. Use judgment; verify with reputable sources for important decisions.</p>
        <h2 className="font-bold text-white">Changes</h2>
        <p>We’ll post updates here and note material changes in-account.</p>
      </div>
    </div>
  )
}
