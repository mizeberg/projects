// John AI — persistence layer.
// Every ministry record carries explicit ownership metadata (userId / churchId)
// so authorization can be enforced in SQL, never only in the UI.
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  passwordHash TEXT NOT NULL,
  displayName TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS churches (
  id TEXT PRIMARY KEY,
  ownerId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  tradition TEXT NOT NULL DEFAULT '',
  size TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

-- Church membership + granular role permissions (JSON object of boolean flags).
CREATE TABLE IF NOT EXISTS memberships (
  id TEXT PRIMARY KEY,
  churchId TEXT NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  permissions TEXT NOT NULL DEFAULT '{}',
  createdAt TEXT NOT NULL,
  UNIQUE(churchId, userId)
);

-- Personalization: one row per pastor. Nothing here is ever invented by the system.
CREATE TABLE IF NOT EXISTS profiles (
  userId TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  preferredName TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT '',
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  timeZone TEXT NOT NULL DEFAULT 'UTC',
  language TEXT NOT NULL DEFAULT 'en',
  bibleTranslations TEXT NOT NULL DEFAULT '[]',
  ministryAreas TEXT NOT NULL DEFAULT '[]',
  sermonWorkflow TEXT NOT NULL DEFAULT '',
  writingStyle TEXT NOT NULL DEFAULT '',
  aiTone TEXT NOT NULL DEFAULT 'calm',
  aiResponseLength TEXT NOT NULL DEFAULT 'medium',
  proactiveAi INTEGER NOT NULL DEFAULT 1,
  notificationPrefs TEXT NOT NULL DEFAULT '{}',
  homeSections TEXT NOT NULL DEFAULT '[]',
  weeklyRhythm TEXT NOT NULL DEFAULT '{}',
  quietTime TEXT NOT NULL DEFAULT '{}',
  onboardingComplete INTEGER NOT NULL DEFAULT 0,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sermon_series (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sermons (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  seriesId TEXT REFERENCES sermon_series(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  keyIdea TEXT NOT NULL DEFAULT '',
  passages TEXT NOT NULL DEFAULT '[]',
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'IDEA',
  preachingDate TEXT,
  service TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '[]',          -- ordered sections, each author-tagged
  checklist TEXT NOT NULL DEFAULT '[]',     -- real readiness source of truth
  timeline TEXT NOT NULL DEFAULT '[]',
  lastPosition TEXT NOT NULL DEFAULT '',    -- "continue where I left off"
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sermon_versions (
  id TEXT PRIMARY KEY,
  sermonId TEXT NOT NULL REFERENCES sermons(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT '',
  snapshot TEXT NOT NULL,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'personal',
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'TODO',
  dueAt TEXT,
  recurrence TEXT NOT NULL DEFAULT '',
  linkedType TEXT NOT NULL DEFAULT '',
  linkedId TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  kind TEXT NOT NULL DEFAULT 'general',
  tags TEXT NOT NULL DEFAULT '[]',
  favorite INTEGER NOT NULL DEFAULT 0,
  linkedType TEXT NOT NULL DEFAULT '',
  linkedId TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  title TEXT NOT NULL,
  person TEXT NOT NULL DEFAULT '',
  request TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'NEW',
  followUpAt TEXT,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'church',
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  startsAt TEXT,
  endsAt TEXT,
  collectedTarget REAL NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS event_ledger (
  id TEXT PRIMARY KEY,
  eventId TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,                        -- 'collection' | 'expense'
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  amount REAL NOT NULL,
  vendor TEXT NOT NULL DEFAULT '',
  paymentMethod TEXT NOT NULL DEFAULT '',
  occurredAt TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  churchId TEXT REFERENCES churches(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'private',
  title TEXT NOT NULL,
  startsAt TEXT,
  location TEXT NOT NULL DEFAULT '',
  participants TEXT NOT NULL DEFAULT '[]',
  agenda TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  decisions TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'text',       -- text | voice | scan
  tags TEXT NOT NULL DEFAULT '[]',
  usedInSermonId TEXT,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  metric TEXT NOT NULL DEFAULT 'manual',     -- manual | sermons_preached | tasks_completed
  target REAL NOT NULL DEFAULT 0,
  manualValue REAL NOT NULL DEFAULT 0,
  dueAt TEXT,
  createdAt TEXT NOT NULL
);

-- AI memory is explicit, sourced, and fully user-controlled.
CREATE TABLE IF NOT EXISTS ai_memory (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'user',
  enabled INTEGER NOT NULL DEFAULT 1,
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  contextJson TEXT NOT NULL DEFAULT '{}',
  sourcesJson TEXT NOT NULL DEFAULT '[]',
  createdAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  churchId TEXT,
  entityType TEXT NOT NULL,
  entityId TEXT NOT NULL,
  action TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  createdAt TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sermons_user ON sermons(userId, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(userId, status, dueAt);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(userId, updatedAt DESC);
CREATE INDEX IF NOT EXISTS idx_prayer_user ON prayer_requests(userId, status, followUpAt);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(userId, startsAt);
CREATE INDEX IF NOT EXISTS idx_meetings_user ON meetings(userId, startsAt);
CREATE INDEX IF NOT EXISTS idx_ledger_event ON event_ledger(eventId);
`;

export function openDb(path = process.env.JOHN_DB ?? 'data/john.db') {
  if (path !== ':memory:') mkdirSync(dirname(resolve(path)), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return db;
}
