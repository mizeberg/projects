const hits = new Map<string, { count: number, reset: number }>()
export function rateLimit(ip: string, limit = 60, windowMs = 60_000) {
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + windowMs })
    return { ok: true, remaining: limit - 1 }
  }
  if (entry.count >= limit) return { ok: false, remaining: 0 }
  entry.count++
  return { ok: true, remaining: limit - entry.count }
}
