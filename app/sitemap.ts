import type { MetadataRoute } from 'next'
import { experiences } from '@/lib/content'
import { personalityQuizzes, whatIfScenarios, mysteries } from '@/lib/content'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const staticPages = ['', '/lab', '/explorer', '/mystery', '/creative', '/quest', '/premium', '/help', '/privacy', '/terms']
  const pages: MetadataRoute.Sitemap = staticPages.map(p => ({ url: `${base}${p}`, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: p==='' ? 1 : 0.8 }))
  // Experience detail hypothetical URLs (for SEO uniqueness)
  whatIfScenarios.forEach(s=> pages.push({ url: `${base}/explorer#${s.slug}`, changeFrequency: 'monthly', priority: 0.6 }))
  mysteries.forEach(m=> pages.push({ url: `${base}/mystery#${m.slug}`, changeFrequency: 'monthly', priority: 0.6 }))
  personalityQuizzes.forEach(q=> pages.push({ url: `${base}/lab#${q.id}`, changeFrequency: 'monthly', priority: 0.6 }))
  return pages
}
