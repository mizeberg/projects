'use client'
export default function ShareActions({ url }: { url: string }) {
  return (
    <button onClick={()=> navigator.clipboard.writeText(url)} className="rounded-full border border-zinc-700 px-5 py-3 text-sm font-medium">Copy link</button>
  )
}
