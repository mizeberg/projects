export const metadata = { title: 'Privacy — Internet Arcade' }
export default function Page() {
  return (
    <div className="mx-auto max-w-[880px] px-6 py-10 prose prose-invert">
      <h1 className="font-black tracking-tighter text-3xl">Privacy Policy</h1>
      <p className="text-sm text-zinc-500">Last updated: October 9, 2026</p>
      <div className="mt-6 space-y-6 text-sm leading-relaxed text-zinc-300">
        <p>Internet Arcade collects only what’s needed to run the playground. We don’t sell personal data, we don’t create manipulative psychological profiles, and we keep children’s privacy and age-appropriate design in mind.</p>
        <h2 className="font-bold text-white">What we collect</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>Account info (email, name, hashed password) if you create an account</li>
          <li>Your saved results, collections, and quest completions (linked to your account)</li>
          <li>Aggregated, anonymized usage for trending and analytics (experience views/completions)</li>
          <li>Support messages you send us</li>
        </ul>
        <h2 className="font-bold text-white">What we don’t</h2>
        <ul className="list-disc list-inside space-y-1">
          <li>No selling data to third parties</li>
          <li>No inferring sensitive personal attributes</li>
          <li>No automatic publishing of your private projects — sharing is explicit</li>
          <li>No mandatory account for basic exploration</li>
        </ul>
        <h2 className="font-bold text-white">Cookies & tracking</h2>
        <p>We use an httpOnly auth cookie to keep you signed in, and aggregated analytics for trending. Non-essential tracking and marketing require consent (banner when configured). You can manage preferences in Account.</p>
        <h2 className="font-bold text-white">Your rights</h2>
        <p>Access, correct, export, or delete your data anytime in Account → Delete account & data, or email privacy@internetarcade.example. Deletion removes your user, results, and completions from our files. Shared public cards you explicitly published may remain until you request removal.</p>
        <h2 className="font-bold text-white">Retention & security</h2>
        <p>We store data in file-based JSON (demo) / SQLite (production) with hashed passwords, server-side auth, rate limiting, and input validation. Secrets via env vars. Backups where supported.</p>
        <h2 className="font-bold text-white">Contact</h2>
        <p>privacy@internetarcade.example</p>
      </div>
    </div>
  )
}
