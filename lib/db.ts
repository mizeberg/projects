// Simple file-based persistence with Prisma fallback
// For production portability, we use JSON files when Prisma/SQLite not configured
import fs from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const USERS_FILE = path.join(DATA_DIR, 'users.json')
const RESULTS_FILE = path.join(DATA_DIR, 'results.json')
const ANALYTICS_FILE = path.join(DATA_DIR, 'analytics.json')
const QUESTS_FILE = path.join(DATA_DIR, 'quests.json')

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
  if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]')
  if (!fs.existsSync(RESULTS_FILE)) fs.writeFileSync(RESULTS_FILE, '[]')
  if (!fs.existsSync(ANALYTICS_FILE)) fs.writeFileSync(ANALYTICS_FILE, '[]')
  if (!fs.existsSync(QUESTS_FILE)) fs.writeFileSync(QUESTS_FILE, '[]')
}

function readJson<T>(file: string, fallback: T): T {
  try {
    ensureDataDir()
    if (!fs.existsSync(file)) return fallback
    const raw = fs.readFileSync(file, 'utf-8')
    return JSON.parse(raw) as T
  } catch { return fallback }
}
function writeJson(file: string, data: any) {
  ensureDataDir()
  fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

// Types
export type User = {
  id: string
  email: string
  passwordHash: string
  name?: string
  createdAt: string
  isPremium: boolean
  stripeCustomerId?: string
  subscriptionStatus?: string
  subscriptionEndsAt?: string
  streak: number
  lastQuestDate?: string
  interests?: string[]
}

export type Result = {
  id: string
  userId?: string
  type: string
  title: string
  summary: string
  data: any
  shareId: string
  createdAt: string
  isPublic: boolean
  experienceId?: string
}

export type QuestCompletion = {
  id: string
  userId: string
  date: string
  data: any
  createdAt: string
}

export type AnalyticsEvent = {
  id: string
  event: string
  experienceId?: string
  userId?: string
  meta?: any
  createdAt: string
}

// Users
export function getUsers(): User[] { return readJson<User[]>(USERS_FILE, []) }
export function saveUsers(users: User[]) { writeJson(USERS_FILE, users) }
export function findUserByEmail(email: string) { return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) }
export function findUserById(id: string) { return getUsers().find(u => u.id === id) }
export function createUser(user: User) {
  const users = getUsers()
  users.push(user)
  saveUsers(users)
  return user
}
export function updateUser(id: string, patch: Partial<User>) {
  const users = getUsers()
  const idx = users.findIndex(u => u.id === id)
  if (idx === -1) return null
  users[idx] = { ...users[idx], ...patch }
  saveUsers(users)
  return users[idx]
}

// Results
export function getResults(): Result[] { return readJson<Result[]>(RESULTS_FILE, []) }
export function saveResults(results: Result[]) { writeJson(RESULTS_FILE, results) }
export function createResult(result: Result) {
  const results = getResults()
  results.push(result)
  saveResults(results)
  // increment trending
  recordAnalytics({ event: 'completion', experienceId: result.experienceId, userId: result.userId })
  return result
}
export function findResultByShareId(shareId: string) { return getResults().find(r => r.shareId === shareId) }
export function getResultsByUser(userId: string) { return getResults().filter(r => r.userId === userId).sort((a,b)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) }

// Quests
export function getQuests(): QuestCompletion[] { return readJson<QuestCompletion[]>(QUESTS_FILE, []) }
export function saveQuests(q: QuestCompletion[]) { writeJson(QUESTS_FILE, q) }

// Analytics
export function getAnalytics(): AnalyticsEvent[] { return readJson<AnalyticsEvent[]>(ANALYTICS_FILE, []) }
export function saveAnalytics(evts: AnalyticsEvent[]) { writeJson(ANALYTICS_FILE, evts) }
export function recordAnalytics(evt: Omit<AnalyticsEvent, 'id'|'createdAt'> & { id?: string }) {
  const evts = getAnalytics()
  evts.push({ id: Math.random().toString(36).slice(2), createdAt: new Date().toISOString(), ...evt } as AnalyticsEvent)
  // keep last 5000
  if (evts.length > 5000) evts.splice(0, evts.length - 5000)
  saveAnalytics(evts)
}

export function getTrending(experienceId: string) {
  const evts = getAnalytics().filter(e => e.experienceId === experienceId && e.event === 'view')
  // count last 7 days
  const cutoff = Date.now() - 7*24*60*60*1000
  return evts.filter(e => new Date(e.createdAt).getTime() > cutoff).length
}

export function getStats() {
  const users = getUsers()
  const results = getResults()
  const evts = getAnalytics()
  const now = Date.now()
  const dayAgo = now - 24*60*60*1000
  const monthAgo = now - 30*24*60*60*1000
  const dau = new Set(evts.filter(e=> new Date(e.createdAt).getTime() > dayAgo && e.userId).map(e=>e.userId)).size || evts.filter(e=> new Date(e.createdAt).getTime() > dayAgo).length
  const mau = new Set(evts.filter(e=> new Date(e.createdAt).getTime() > monthAgo && e.userId).map(e=>e.userId)).size || evts.filter(e=> new Date(e.createdAt).getTime() > monthAgo).length
  const newRegsDay = users.filter(u=> new Date(u.createdAt).getTime() > dayAgo).length
  const completions = results.length
  const shareRate = results.length ? Math.round((results.filter(r=>r.isPublic).length / results.length)*100) : 0
  const premium = users.filter(u=>u.isPremium).length
  const mrr = premium * 6.99
  const churn = 0 // 0 until subscription history exists; honest aggregation
  return {
    dau, mau, newRegsDay, completions, shareRate, premium, mrr, churn,
    totalUsers: users.length,
    totalResults: results.length,
    totalEvents: evts.length,
  }
}
