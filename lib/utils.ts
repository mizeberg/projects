export function cn(...classes: (string|false|undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
export function formatDate(d: string|Date) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
export function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') }
