import Link from 'next/link'
export default function NotFound() {
  return (
    <div className="mx-auto max-w-[720px] px-6 py-20 text-center">
      <div className="text-6xl">🌀</div>
      <h1 className="mt-4 font-black text-3xl">Lost in the playground?</h1>
      <p className="text-zinc-400 mt-2">That door doesn’t open here. Try the arcade map.</p>
      <Link href="/" className="inline-flex mt-6 rounded-full bg-white text-black px-6 py-3 font-bold">Back to arcade</Link>
    </div>
  )
}
