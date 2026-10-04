// John AI — domain / use-case layer.
// This is the ONE place ministry rules live. REST routes, the AI agent tool
// registry, the command palette and voice all call into these same functions.
import { uid, now, json, badRequest, forbidden, notFound, dayBounds } from '../core.js';
import { can, defaultPermissions } from '../permissions.js';

/* ======================= serialization helpers ======================= */
const parseList = (v) => json(v, []);
const parseObj = (v) => json(v, {});

const mapSermon = (r) => r && ({
  ...r,
  passages: parseList(r.passages),
  tags: parseList(r.tags),
  body: parseList(r.body),
  checklist: parseList(r.checklist),
  timeline: parseList(r.timeline),
  readiness: readiness(parseList(r.checklist)),
});
const mapNote = (r) => r && ({ ...r, tags: parseList(r.tags), favorite: !!r.favorite });
const mapMeeting = (r) => r && ({ ...r, participants: parseList(r.participants), decisions: parseList(r.decisions) });
const mapProfile = (r) => r && ({
  ...r,
  bibleTranslations: parseList(r.bibleTranslations),
  ministryAreas: parseList(r.ministryAreas),
  notificationPrefs: parseObj(r.notificationPrefs),
  homeSections: parseList(r.homeSections),
  weeklyRhythm: parseObj(r.weeklyRhythm),
  quietTime: parseObj(r.quietTime),
  proactiveAi: !!r.proactiveAi,
  onboardingComplete: !!r.onboardingComplete,
});

/* ======================= audit ======================= */
export function audit(ctx, entityType, entityId, action, detail = '') {
  ctx.db.prepare(
    `INSERT INTO audit_logs (id,userId,churchId,entityType,entityId,action,detail,createdAt)
     VALUES (?,?,?,?,?,?,?,?)`
  ).run(uid(), ctx.user.id, ctx.profile?.churchId ?? null, entityType, entityId, action, detail, now());
}

export const listAudit = (ctx, { entityType, entityId } = {}) =>
  ctx.db.prepare(
    `SELECT * FROM audit_logs WHERE userId = ?
       AND (? IS NULL OR entityType = ?) AND (? IS NULL OR entityId = ?)
     ORDER BY createdAt DESC LIMIT 200`
  ).all(ctx.user.id, entityType ?? null, entityType ?? null, entityId ?? null, entityId ?? null);

/* ======================= ownership guard ======================= */
function owned(ctx, table, id) {
  const row = ctx.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row) throw notFound();
  if (row.userId !== ctx.user.id) {
    // Church-shared records may still be readable by authorized staff.
    const shared = row.visibility === 'church' && row.churchId && row.churchId === ctx.profile?.churchId;
    if (!shared) throw notFound(); // do not leak existence of other pastors' records
  }
  return row;
}
function mustOwn(ctx, table, id) {
  const row = ctx.db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(id);
  if (!row || row.userId !== ctx.user.id) throw notFound();
  return row;
}

/* ======================= profile / personalization ======================= */
export function getProfile(ctx) {
  const row = ctx.db.prepare('SELECT * FROM profiles WHERE userId = ?').get(ctx.user.id);
  return mapProfile(row);
}

const PROFILE_FIELDS = [
  'preferredName', 'role', 'churchId', 'timeZone', 'language', 'sermonWorkflow',
  'writingStyle', 'aiTone', 'aiResponseLength',
];
const PROFILE_JSON_FIELDS = ['bibleTranslations', 'ministryAreas', 'notificationPrefs', 'homeSections', 'weeklyRhythm', 'quietTime'];

export function updateProfile(ctx, patch = {}) {
  const sets = [], values = [];
  for (const f of PROFILE_FIELDS) if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  for (const f of PROFILE_JSON_FIELDS) if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(JSON.stringify(patch[f])); }
  if (patch.proactiveAi !== undefined) { sets.push('proactiveAi = ?'); values.push(patch.proactiveAi ? 1 : 0); }
  if (patch.onboardingComplete !== undefined) { sets.push('onboardingComplete = ?'); values.push(patch.onboardingComplete ? 1 : 0); }
  if (!sets.length) return getProfile(ctx);
  sets.push('updatedAt = ?'); values.push(now(), ctx.user.id);
  ctx.db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE userId = ?`).run(...values);
  return getProfile(ctx);
}

export function createChurch(ctx, { name, location = '', tradition = '', size = '' }) {
  if (!name) throw badRequest('Church name is required.');
  const id = uid();
  ctx.db.prepare('INSERT INTO churches (id,ownerId,name,location,tradition,size,createdAt) VALUES (?,?,?,?,?,?,?)')
    .run(id, ctx.user.id, name, location, tradition, size, now());
  ctx.db.prepare('INSERT INTO memberships (id,churchId,userId,role,permissions,createdAt) VALUES (?,?,?,?,?,?)')
    .run(uid(), id, ctx.user.id, 'owner', JSON.stringify(defaultPermissions('owner')), now());
  ctx.db.prepare('UPDATE profiles SET churchId = ?, updatedAt = ? WHERE userId = ?').run(id, now(), ctx.user.id);
  audit(ctx, 'church', id, 'created', name);
  return ctx.db.prepare('SELECT * FROM churches WHERE id = ?').get(id);
}

/* ======================= sermons ======================= */
export const SERMON_STATUSES = ['IDEA', 'RESEARCHING', 'OUTLINING', 'WRITING', 'REVIEW', 'READY', 'PREACHED', 'ARCHIVED'];

// Readiness is computed from the pastor's real checklist — never from a model.
export function readiness(checklist) {
  const items = Array.isArray(checklist) ? checklist : [];
  if (!items.length) return { percent: 0, done: 0, total: 0, remaining: [] };
  const done = items.filter((i) => i.done).length;
  return {
    percent: Math.round((done / items.length) * 100),
    done,
    total: items.length,
    remaining: items.filter((i) => !i.done).map((i) => i.label),
  };
}

export const DEFAULT_CHECKLIST = [
  'Bible study', 'Outline', 'Main points', 'Illustrations',
  'Applications', 'Introduction', 'Conclusion', 'Final review',
].map((label) => ({ id: label.toLowerCase().replace(/\s+/g, '-'), label, done: false }));

// Timeline is derived from the preaching date + the pastor's stated workflow.
// It is a starting point only and is fully editable.
export function buildTimeline(preachingDate, workflow = '') {
  if (!preachingDate) return [];
  const steps = workflow === 'bible_study_first'
    ? [['Bible study', 6], ['Research', 5], ['Outline', 4], ['Draft', 3], ['Review', 2], ['Finalize', 1], ['Preach', 0]]
    : workflow === 'outline_first'
      ? [['Outline', 6], ['Bible study', 5], ['Research', 4], ['Draft', 3], ['Review', 2], ['Finalize', 1], ['Preach', 0]]
      : [['Research', 6], ['Outline', 5], ['Draft', 3], ['Review', 2], ['Finalize', 1], ['Preach', 0]];
  const base = new Date(preachingDate);
  return steps.map(([label, daysBefore]) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() - daysBefore);
    return { id: label.toLowerCase().replace(/\s+/g, '-'), label, date: d.toISOString(), done: false };
  });
}

export function listSermons(ctx, { status, seriesId, query, limit = 50 } = {}) {
  const rows = ctx.db.prepare(
    `SELECT * FROM sermons WHERE userId = ?
       AND (? IS NULL OR status = ?) AND (? IS NULL OR seriesId = ?)
     ORDER BY COALESCE(preachingDate, updatedAt) DESC LIMIT ?`
  ).all(ctx.user.id, status ?? null, status ?? null, seriesId ?? null, seriesId ?? null, limit);
  const mapped = rows.map(mapSermon);
  if (!query) return mapped;
  const q = query.toLowerCase();
  return mapped.filter((s) =>
    [s.title, s.subtitle, s.keyIdea, ...s.passages, ...s.tags, JSON.stringify(s.body)]
      .join(' ').toLowerCase().includes(q));
}

export const getSermon = (ctx, id) => mapSermon(owned(ctx, 'sermons', id));

export function createSermon(ctx, input = {}) {
  if (!input.title) throw badRequest('A sermon needs a title.');
  const profile = ctx.profile ?? getProfile(ctx);
  const id = uid(), ts = now();
  const checklist = input.checklist ?? DEFAULT_CHECKLIST;
  const timeline = input.timeline ?? buildTimeline(input.preachingDate, profile?.sermonWorkflow);
  ctx.db.prepare(
    `INSERT INTO sermons (id,userId,churchId,visibility,seriesId,title,subtitle,keyIdea,passages,tags,status,
        preachingDate,service,body,checklist,timeline,lastPosition,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, profile?.churchId ?? null, input.visibility ?? 'private', input.seriesId ?? null,
    input.title, input.subtitle ?? '', input.keyIdea ?? '',
    JSON.stringify(input.passages ?? []), JSON.stringify(input.tags ?? []),
    input.status ?? 'IDEA', input.preachingDate ?? null, input.service ?? '',
    JSON.stringify(input.body ?? []), JSON.stringify(checklist), JSON.stringify(timeline), '', ts, ts);
  audit(ctx, 'sermon', id, 'created', input.title);
  return getSermon(ctx, id);
}

const SERMON_TEXT = ['title', 'subtitle', 'keyIdea', 'service', 'status', 'preachingDate', 'seriesId', 'visibility', 'lastPosition'];
const SERMON_JSON = ['passages', 'tags', 'body', 'checklist', 'timeline'];

export function updateSermon(ctx, id, patch = {}) {
  const existing = mustOwn(ctx, 'sermons', id);
  if (patch.status && !SERMON_STATUSES.includes(patch.status)) throw badRequest('Unknown sermon status.');
  const sets = [], values = [];
  for (const f of SERMON_TEXT) if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  for (const f of SERMON_JSON) if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(JSON.stringify(patch[f])); }
  if (!sets.length) return getSermon(ctx, id);
  // Snapshot before a content change so version history / undo is always possible.
  if (patch.body !== undefined || patch.checklist !== undefined) {
    ctx.db.prepare('INSERT INTO sermon_versions (id,sermonId,userId,label,snapshot,createdAt) VALUES (?,?,?,?,?,?)')
      .run(uid(), id, ctx.user.id, patch.versionLabel ?? 'Autosave', JSON.stringify(existing), now());
  }
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE sermons SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  audit(ctx, 'sermon', id, 'updated', Object.keys(patch).join(','));
  return getSermon(ctx, id);
}

export function deleteSermon(ctx, id) {
  const row = mustOwn(ctx, 'sermons', id);
  ctx.db.prepare('INSERT INTO sermon_versions (id,sermonId,userId,label,snapshot,createdAt) VALUES (?,?,?,?,?,?)')
    .run(uid(), id, ctx.user.id, 'Before delete', JSON.stringify(row), now());
  ctx.db.prepare('DELETE FROM sermons WHERE id = ?').run(id);
  audit(ctx, 'sermon', id, 'deleted', row.title);
  return { deleted: true, undoSnapshot: mapSermon(row) };
}

export function restoreSermon(ctx, snapshot) {
  if (!snapshot?.id) throw badRequest('Nothing to restore.');
  const s = snapshot;
  ctx.db.prepare(
    `INSERT OR REPLACE INTO sermons (id,userId,churchId,visibility,seriesId,title,subtitle,keyIdea,passages,tags,status,
        preachingDate,service,body,checklist,timeline,lastPosition,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(s.id, ctx.user.id, s.churchId ?? null, s.visibility ?? 'private', s.seriesId ?? null, s.title,
    s.subtitle ?? '', s.keyIdea ?? '', JSON.stringify(s.passages ?? []), JSON.stringify(s.tags ?? []),
    s.status ?? 'IDEA', s.preachingDate ?? null, s.service ?? '', JSON.stringify(s.body ?? []),
    JSON.stringify(s.checklist ?? []), JSON.stringify(s.timeline ?? []), s.lastPosition ?? '',
    s.createdAt ?? now(), now());
  audit(ctx, 'sermon', s.id, 'restored', s.title);
  return getSermon(ctx, s.id);
}

export const listSermonVersions = (ctx, sermonId) => {
  mustOwn(ctx, 'sermons', sermonId);
  return ctx.db.prepare('SELECT id,label,createdAt FROM sermon_versions WHERE sermonId = ? ORDER BY createdAt DESC LIMIT 50').all(sermonId);
};

export function restoreSermonVersion(ctx, sermonId, versionId) {
  mustOwn(ctx, 'sermons', sermonId);
  const v = ctx.db.prepare('SELECT * FROM sermon_versions WHERE id = ? AND sermonId = ? AND userId = ?')
    .get(versionId, sermonId, ctx.user.id);
  if (!v) throw notFound('That version is no longer available.');
  const snap = json(v.snapshot, null);
  if (!snap) throw badRequest('That version could not be read.');
  return updateSermon(ctx, sermonId, {
    body: json(snap.body, []), checklist: json(snap.checklist, []), versionLabel: 'Before restore',
  });
}

/**
 * Sermon Intelligence — every number below is counted from stored records.
 * No model-generated scores, no invented percentages.
 */
export function sermonIntelligence(ctx, id) {
  const s = getSermon(ctx, id);
  const body = s.body ?? [];
  const countKind = (k) => body.filter((b) => b.kind === k).length;
  const notes = ctx.db.prepare("SELECT id,title FROM notes WHERE userId = ? AND linkedType = 'sermon' AND linkedId = ?")
    .all(ctx.user.id, id);
  const tasks = ctx.db.prepare("SELECT id,title,status FROM tasks WHERE userId = ? AND linkedType = 'sermon' AND linkedId = ?")
    .all(ctx.user.id, id);
  const observations = [];
  for (const kind of ['introduction', 'conclusion']) {
    const section = body.find((b) => b.kind === kind);
    if (!section || !String(section.text ?? '').trim()) {
      observations.push({ text: `Your ${kind} has no content yet.`, source: { type: 'sermon', id, field: kind } });
    }
  }
  if (!s.passages.length) observations.push({ text: 'No Bible passages are attached to this sermon yet.', source: { type: 'sermon', id, field: 'passages' } });
  if (s.readiness.total && s.readiness.percent < 100) {
    observations.push({ text: `${s.readiness.total - s.readiness.done} preparation step(s) remain: ${s.readiness.remaining.join(', ')}.`, source: { type: 'sermon', id, field: 'checklist' } });
  }
  return {
    sermonId: id,
    counts: {
      bibleReferences: s.passages.length,
      sections: body.length,
      mainPoints: countKind('point'),
      illustrations: countKind('illustration'),
      applications: countKind('application'),
      linkedNotes: notes.length,
      linkedTasks: tasks.length,
      openTasks: tasks.filter((t) => t.status !== 'COMPLETED').length,
    },
    readiness: s.readiness,
    observations,
    relationships: { notes, tasks },
  };
}

/* ======================= series ======================= */
export const listSeries = (ctx) =>
  ctx.db.prepare('SELECT * FROM sermon_series WHERE userId = ? ORDER BY createdAt DESC').all(ctx.user.id)
    .map((s) => ({ ...s, sermons: listSermons(ctx, { seriesId: s.id }).map((x) => ({ id: x.id, title: x.title, status: x.status, preachingDate: x.preachingDate })) }));

export function createSeries(ctx, { title, description = '' }) {
  if (!title) throw badRequest('A series needs a title.');
  const id = uid();
  ctx.db.prepare('INSERT INTO sermon_series (id,userId,title,description,createdAt) VALUES (?,?,?,?,?)')
    .run(id, ctx.user.id, title, description, now());
  return ctx.db.prepare('SELECT * FROM sermon_series WHERE id = ?').get(id);
}

/* ======================= tasks ======================= */
export const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED'];

export function listTasks(ctx, { status, dueBefore, linkedType, linkedId, limit = 200 } = {}) {
  return ctx.db.prepare(
    `SELECT * FROM tasks WHERE userId = ?
       AND (? IS NULL OR status = ?)
       AND (? IS NULL OR (dueAt IS NOT NULL AND dueAt < ?))
       AND (? IS NULL OR linkedType = ?) AND (? IS NULL OR linkedId = ?)
     ORDER BY (dueAt IS NULL), dueAt ASC, createdAt DESC LIMIT ?`
  ).all(ctx.user.id, status ?? null, status ?? null, dueBefore ?? null, dueBefore ?? null,
    linkedType ?? null, linkedType ?? null, linkedId ?? null, linkedId ?? null, limit);
}

export function createTask(ctx, input = {}) {
  if (!input.title) throw badRequest('A task needs a title.');
  if (input.status && !TASK_STATUSES.includes(input.status)) throw badRequest('Unknown task status.');
  const id = uid(), ts = now();
  ctx.db.prepare(
    `INSERT INTO tasks (id,userId,churchId,visibility,title,description,category,priority,status,dueAt,recurrence,linkedType,linkedId,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, ctx.profile?.churchId ?? null, input.visibility ?? 'private', input.title,
    input.description ?? '', input.category ?? 'personal', input.priority ?? 'normal',
    input.status ?? 'TODO', input.dueAt ?? null, input.recurrence ?? '',
    input.linkedType ?? '', input.linkedId ?? '', ts, ts);
  audit(ctx, 'task', id, 'created', input.title);
  return ctx.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function updateTask(ctx, id, patch = {}) {
  mustOwn(ctx, 'tasks', id);
  const fields = ['title', 'description', 'category', 'priority', 'status', 'dueAt', 'recurrence', 'linkedType', 'linkedId', 'visibility'];
  const sets = [], values = [];
  for (const f of fields) if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  if (!sets.length) return ctx.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  audit(ctx, 'task', id, 'updated', Object.keys(patch).join(','));
  return ctx.db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

export function deleteTask(ctx, id) {
  const row = mustOwn(ctx, 'tasks', id);
  ctx.db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
  audit(ctx, 'task', id, 'deleted', row.title);
  return { deleted: true, undoSnapshot: row };
}

/* ======================= notes ======================= */
export function listNotes(ctx, { kind, query, favorite, linkedType, linkedId, limit = 200 } = {}) {
  const rows = ctx.db.prepare(
    `SELECT * FROM notes WHERE userId = ?
       AND (? IS NULL OR kind = ?) AND (? IS NULL OR favorite = ?)
       AND (? IS NULL OR linkedType = ?) AND (? IS NULL OR linkedId = ?)
     ORDER BY updatedAt DESC LIMIT ?`
  ).all(ctx.user.id, kind ?? null, kind ?? null,
    favorite === undefined ? null : (favorite ? 1 : 0), favorite === undefined ? null : (favorite ? 1 : 0),
    linkedType ?? null, linkedType ?? null, linkedId ?? null, linkedId ?? null, limit).map(mapNote);
  if (!query) return rows;
  const q = query.toLowerCase();
  return rows.filter((n) => `${n.title} ${n.body} ${n.tags.join(' ')}`.toLowerCase().includes(q));
}

export function createNote(ctx, input = {}) {
  if (!input.title && !input.body) throw badRequest('A note needs a title or some content.');
  const id = uid(), ts = now();
  ctx.db.prepare(
    `INSERT INTO notes (id,userId,churchId,visibility,title,body,kind,tags,favorite,linkedType,linkedId,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, ctx.profile?.churchId ?? null, input.visibility ?? 'private',
    input.title ?? 'Untitled note', input.body ?? '', input.kind ?? 'general',
    JSON.stringify(input.tags ?? []), input.favorite ? 1 : 0,
    input.linkedType ?? '', input.linkedId ?? '', ts, ts);
  audit(ctx, 'note', id, 'created', input.title ?? '');
  return mapNote(ctx.db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
}

export function updateNote(ctx, id, patch = {}) {
  mustOwn(ctx, 'notes', id);
  const sets = [], values = [];
  for (const f of ['title', 'body', 'kind', 'linkedType', 'linkedId', 'visibility']) {
    if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  }
  if (patch.tags !== undefined) { sets.push('tags = ?'); values.push(JSON.stringify(patch.tags)); }
  if (patch.favorite !== undefined) { sets.push('favorite = ?'); values.push(patch.favorite ? 1 : 0); }
  if (!sets.length) return mapNote(ctx.db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE notes SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return mapNote(ctx.db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
}

export function deleteNote(ctx, id) {
  const row = mustOwn(ctx, 'notes', id);
  ctx.db.prepare('DELETE FROM notes WHERE id = ?').run(id);
  audit(ctx, 'note', id, 'deleted', row.title);
  return { deleted: true, undoSnapshot: mapNote(row) };
}

/* ======================= prayer ======================= */
export const PRAYER_STATUSES = ['NEW', 'PRAYING', 'FOLLOW_UP', 'ANSWERED', 'ARCHIVED'];

export function listPrayerRequests(ctx, { status, dueBefore, limit = 200 } = {}) {
  return ctx.db.prepare(
    `SELECT * FROM prayer_requests WHERE userId = ?
       AND (? IS NULL OR status = ?)
       AND (? IS NULL OR (followUpAt IS NOT NULL AND followUpAt < ?))
     ORDER BY (followUpAt IS NULL), followUpAt ASC, createdAt DESC LIMIT ?`
  ).all(ctx.user.id, status ?? null, status ?? null, dueBefore ?? null, dueBefore ?? null, limit);
}

export function createPrayerRequest(ctx, input = {}) {
  if (!input.title) throw badRequest('A prayer request needs a title.');
  if (input.status && !PRAYER_STATUSES.includes(input.status)) throw badRequest('Unknown prayer status.');
  const id = uid(), ts = now();
  ctx.db.prepare(
    `INSERT INTO prayer_requests (id,userId,churchId,visibility,title,person,request,category,status,followUpAt,notes,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, ctx.profile?.churchId ?? null, input.visibility ?? 'private', input.title,
    input.person ?? '', input.request ?? '', input.category ?? '', input.status ?? 'NEW',
    input.followUpAt ?? null, input.notes ?? '', ts, ts);
  audit(ctx, 'prayer', id, 'created', input.title);
  return ctx.db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
}

export function updatePrayerRequest(ctx, id, patch = {}) {
  mustOwn(ctx, 'prayer_requests', id);
  const sets = [], values = [];
  for (const f of ['title', 'person', 'request', 'category', 'status', 'followUpAt', 'notes', 'visibility']) {
    if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  }
  if (!sets.length) return ctx.db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE prayer_requests SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  audit(ctx, 'prayer', id, 'updated', Object.keys(patch).join(','));
  return ctx.db.prepare('SELECT * FROM prayer_requests WHERE id = ?').get(id);
}

/* ======================= events + finances ======================= */
export const listEvents = (ctx, { from, limit = 100 } = {}) =>
  ctx.db.prepare(
    `SELECT * FROM events WHERE userId = ? AND (? IS NULL OR startsAt IS NULL OR startsAt >= ?)
     ORDER BY (startsAt IS NULL), startsAt ASC LIMIT ?`
  ).all(ctx.user.id, from ?? null, from ?? null, limit);

export function createEvent(ctx, input = {}) {
  if (!input.name) throw badRequest('An event needs a name.');
  const id = uid(), ts = now();
  ctx.db.prepare(
    `INSERT INTO events (id,userId,churchId,visibility,name,description,venue,startsAt,endsAt,collectedTarget,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, ctx.profile?.churchId ?? null, input.visibility ?? 'church', input.name,
    input.description ?? '', input.venue ?? '', input.startsAt ?? null, input.endsAt ?? null,
    Number(input.collectedTarget ?? 0), ts, ts);
  audit(ctx, 'event', id, 'created', input.name);
  return ctx.db.prepare('SELECT * FROM events WHERE id = ?').get(id);
}

export function updateEvent(ctx, id, patch = {}) {
  mustOwn(ctx, 'events', id);
  const sets = [], values = [];
  for (const f of ['name', 'description', 'venue', 'startsAt', 'endsAt', 'visibility']) {
    if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  }
  if (patch.collectedTarget !== undefined) { sets.push('collectedTarget = ?'); values.push(Number(patch.collectedTarget)); }
  if (!sets.length) return ctx.db.prepare('SELECT * FROM events WHERE id = ?').get(id);
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  audit(ctx, 'event', id, 'updated', Object.keys(patch).join(','));
  return ctx.db.prepare('SELECT * FROM events WHERE id = ?').get(id);
}

// Finance access is explicitly permission-gated, including for the AI.
function assertFinanceRead(ctx) {
  if (ctx.membership && !can(ctx.membership, 'canViewFinances') && ctx.membership.role !== 'owner') {
    throw forbidden('You do not have permission to view finances.');
  }
}
function assertFinanceWrite(ctx) {
  if (ctx.membership && !can(ctx.membership, 'canEditFinances') && ctx.membership.role !== 'owner') {
    throw forbidden('You do not have permission to change finances.');
  }
}

export function eventFinances(ctx, eventId) {
  owned(ctx, 'events', eventId);
  assertFinanceRead(ctx);
  const rows = ctx.db.prepare('SELECT * FROM event_ledger WHERE eventId = ? ORDER BY occurredAt DESC').all(eventId);
  const sum = (kind) => rows.filter((r) => r.kind === kind).reduce((t, r) => t + r.amount, 0);
  const totalCollected = sum('collection');
  const totalSpent = sum('expense');
  return { eventId, entries: rows, totalCollected, totalSpent, balance: totalCollected - totalSpent };
}

export function addLedgerEntry(ctx, eventId, input = {}) {
  owned(ctx, 'events', eventId);
  assertFinanceWrite(ctx);
  if (!['collection', 'expense'].includes(input.kind)) throw badRequest('Entry kind must be collection or expense.');
  if (!input.name) throw badRequest('Give the entry a name.');
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount < 0) throw badRequest('Amount must be a positive number.');
  const id = uid();
  ctx.db.prepare(
    `INSERT INTO event_ledger (id,eventId,userId,churchId,kind,name,category,amount,vendor,paymentMethod,occurredAt,notes,createdAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, eventId, ctx.user.id, ctx.profile?.churchId ?? null, input.kind, input.name,
    input.category ?? '', amount, input.vendor ?? '', input.paymentMethod ?? '',
    input.occurredAt ?? now(), input.notes ?? '', now());
  audit(ctx, 'event_ledger', id, 'created', `${input.kind} ${amount} for event ${eventId}`);
  return eventFinances(ctx, eventId);
}

/* ======================= meetings ======================= */
export const listMeetings = (ctx, { from, limit = 100 } = {}) =>
  ctx.db.prepare(
    `SELECT * FROM meetings WHERE userId = ? AND (? IS NULL OR startsAt IS NULL OR startsAt >= ?)
     ORDER BY (startsAt IS NULL), startsAt ASC LIMIT ?`
  ).all(ctx.user.id, from ?? null, from ?? null, limit).map(mapMeeting);

export function createMeeting(ctx, input = {}) {
  if (!input.title) throw badRequest('A meeting needs a title.');
  const id = uid(), ts = now();
  ctx.db.prepare(
    `INSERT INTO meetings (id,userId,churchId,visibility,title,startsAt,location,participants,agenda,notes,decisions,createdAt,updatedAt)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(id, ctx.user.id, ctx.profile?.churchId ?? null, input.visibility ?? 'private', input.title,
    input.startsAt ?? null, input.location ?? '', JSON.stringify(input.participants ?? []),
    input.agenda ?? '', input.notes ?? '', JSON.stringify(input.decisions ?? []), ts, ts);
  audit(ctx, 'meeting', id, 'created', input.title);
  return mapMeeting(ctx.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id));
}

export function updateMeeting(ctx, id, patch = {}) {
  mustOwn(ctx, 'meetings', id);
  const sets = [], values = [];
  for (const f of ['title', 'startsAt', 'location', 'agenda', 'notes', 'visibility']) {
    if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(patch[f]); }
  }
  for (const f of ['participants', 'decisions']) {
    if (patch[f] !== undefined) { sets.push(`${f} = ?`); values.push(JSON.stringify(patch[f])); }
  }
  if (!sets.length) return mapMeeting(ctx.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id));
  sets.push('updatedAt = ?'); values.push(now(), id);
  ctx.db.prepare(`UPDATE meetings SET ${sets.join(', ')} WHERE id = ?`).run(...values);
  return mapMeeting(ctx.db.prepare('SELECT * FROM meetings WHERE id = ?').get(id));
}

/**
 * Meeting -> tasks. Extracts candidate action items from the pastor's own notes
 * using explicit markers. Nothing is created until the pastor confirms.
 */
export function proposeMeetingActions(ctx, meetingId) {
  const m = mapMeeting(mustOwn(ctx, 'meetings', meetingId));
  const lines = String(m.notes ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
  const markers = /^(?:[-*•]\s*)?(?:todo|action|follow[- ]?up|task)\s*[:\-]\s*/i;
  const proposals = lines.filter((l) => markers.test(l)).map((l) => ({
    title: l.replace(markers, '').trim(),
    category: 'meeting',
    linkedType: 'meeting',
    linkedId: meetingId,
    sourceLine: l,
  }));
  return { meetingId, proposals, requiresConfirmation: true };
}

/* ======================= ideas ======================= */
export const listIdeas = (ctx, { limit = 100 } = {}) =>
  ctx.db.prepare('SELECT * FROM ideas WHERE userId = ? ORDER BY createdAt DESC LIMIT ?')
    .all(ctx.user.id, limit).map((i) => ({ ...i, tags: parseList(i.tags) }));

export function captureIdea(ctx, { text, source = 'text', tags = [] }) {
  if (!text?.trim()) throw badRequest('Nothing to capture yet.');
  const id = uid();
  ctx.db.prepare('INSERT INTO ideas (id,userId,text,source,tags,createdAt) VALUES (?,?,?,?,?,?)')
    .run(id, ctx.user.id, text.trim(), source, JSON.stringify(tags), now());
  return ctx.db.prepare('SELECT * FROM ideas WHERE id = ?').get(id);
}

/* ======================= goals + progress ======================= */
export const listGoals = (ctx) => ctx.db.prepare('SELECT * FROM goals WHERE userId = ? ORDER BY createdAt DESC').all(ctx.user.id)
  .map((g) => ({ ...g, current: goalCurrent(ctx, g) }));

function goalCurrent(ctx, goal) {
  const c = (sql, ...args) => ctx.db.prepare(sql).get(ctx.user.id, ...args).n;
  switch (goal.metric) {
    case 'sermons_preached': return c("SELECT COUNT(*) n FROM sermons WHERE userId = ? AND status = 'PREACHED'");
    case 'tasks_completed': return c("SELECT COUNT(*) n FROM tasks WHERE userId = ? AND status = 'COMPLETED'");
    default: return goal.manualValue;
  }
}

export function createGoal(ctx, input = {}) {
  if (!input.title) throw badRequest('A goal needs a title.');
  const id = uid();
  ctx.db.prepare('INSERT INTO goals (id,userId,title,category,metric,target,manualValue,dueAt,createdAt) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(id, ctx.user.id, input.title, input.category ?? '', input.metric ?? 'manual',
      Number(input.target ?? 0), Number(input.manualValue ?? 0), input.dueAt ?? null, now());
  return ctx.db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
}

/** Progress — every figure is a COUNT over the pastor's own records. */
export function progress(ctx) {
  const one = (sql, ...a) => ctx.db.prepare(sql).get(ctx.user.id, ...a).n;
  const sermonsTotal = one('SELECT COUNT(*) n FROM sermons WHERE userId = ?');
  const sermonsPreached = one("SELECT COUNT(*) n FROM sermons WHERE userId = ? AND status = 'PREACHED'");
  const sermonsReady = one("SELECT COUNT(*) n FROM sermons WHERE userId = ? AND status = 'READY'");
  const tasksTotal = one("SELECT COUNT(*) n FROM tasks WHERE userId = ? AND status != 'ARCHIVED'");
  const tasksDone = one("SELECT COUNT(*) n FROM tasks WHERE userId = ? AND status = 'COMPLETED'");
  return {
    sermons: { total: sermonsTotal, preached: sermonsPreached, ready: sermonsReady },
    tasks: { total: tasksTotal, completed: tasksDone, percent: tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : null },
    prayer: {
      open: one("SELECT COUNT(*) n FROM prayer_requests WHERE userId = ? AND status IN ('NEW','PRAYING','FOLLOW_UP')"),
      answered: one("SELECT COUNT(*) n FROM prayer_requests WHERE userId = ? AND status = 'ANSWERED'"),
    },
    events: { upcoming: one('SELECT COUNT(*) n FROM events WHERE userId = ? AND startsAt >= ?', now()) },
    notes: { total: one('SELECT COUNT(*) n FROM notes WHERE userId = ?') },
    ideas: { total: one('SELECT COUNT(*) n FROM ideas WHERE userId = ?') },
    goals: listGoals(ctx),
  };
}

/** Workload — factual counts per weekday for the coming 7 days. */
export function workload(ctx) {
  const { start } = dayBounds();
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 7);
  const w = [start, end.toISOString()];
  const q = (sql, kind) => ctx.db.prepare(sql).all(ctx.user.id, ...w).map((r) => ({ at: r.at, kind }));
  const rows = [
    ...q('SELECT dueAt AS at FROM tasks WHERE userId = ? AND dueAt >= ? AND dueAt < ?', 'task'),
    ...q('SELECT startsAt AS at FROM meetings WHERE userId = ? AND startsAt >= ? AND startsAt < ?', 'meeting'),
    ...q('SELECT startsAt AS at FROM events WHERE userId = ? AND startsAt >= ? AND startsAt < ?', 'event'),
    ...q('SELECT preachingDate AS at FROM sermons WHERE userId = ? AND preachingDate >= ? AND preachingDate < ?', 'sermon'),
  ].filter((r) => r.at);
  const byDay = {};
  for (const r of rows) {
    const key = r.at.slice(0, 10);
    byDay[key] ??= { date: key, task: 0, meeting: 0, event: 0, sermon: 0, total: 0 };
    byDay[key][r.kind] += 1;
    byDay[key].total += 1;
  }
  const days = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
  const busiest = days.reduce((m, d) => (!m || d.total > m.total ? d : m), null);
  return {
    days,
    totals: rows.reduce((t, r) => ({ ...t, [r.kind]: (t[r.kind] ?? 0) + 1 }), {}),
    observation: busiest && busiest.total > 1
      ? `${busiest.date} currently has the highest number of scheduled items (${busiest.total}).`
      : null,
  };
}

/* ======================= today + ministry pulse ======================= */
export function today(ctx, { date } = {}) {
  const { start, end } = dayBounds(date);
  const q = (sql, kind) => ctx.db.prepare(sql).all(ctx.user.id, start, end).map((r) => ({ ...r, kind }));
  const items = [
    ...q('SELECT id, title, startsAt AS at FROM meetings WHERE userId = ? AND startsAt >= ? AND startsAt < ?', 'meeting'),
    ...q('SELECT id, name AS title, startsAt AS at FROM events WHERE userId = ? AND startsAt >= ? AND startsAt < ?', 'event'),
    ...q("SELECT id, title, dueAt AS at FROM tasks WHERE userId = ? AND dueAt >= ? AND dueAt < ? AND status != 'COMPLETED'", 'task'),
    ...q('SELECT id, title, preachingDate AS at FROM sermons WHERE userId = ? AND preachingDate >= ? AND preachingDate < ?', 'sermon'),
    ...q("SELECT id, title, followUpAt AS at FROM prayer_requests WHERE userId = ? AND followUpAt >= ? AND followUpAt < ? AND status != 'ANSWERED'", 'prayer'),
  ].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  return { date: start, items };
}

/**
 * MINISTRY PULSE — transparent, rule-based prioritisation.
 * Each item carries the rule that produced it, so "Why am I seeing this?"
 * can always be answered honestly. No model-assigned urgency scores.
 */
export function ministryPulse(ctx, { limit = 5, dismissed = [] } = {}) {
  const nowIso = now();
  const { end: endOfToday } = dayBounds();
  const in3Days = new Date(); in3Days.setUTCDate(in3Days.getUTCDate() + 3);
  const pulse = [];

  const upcomingSermons = ctx.db.prepare(
    `SELECT * FROM sermons WHERE userId = ? AND preachingDate >= ? AND preachingDate <= ?
       AND status NOT IN ('PREACHED','ARCHIVED') ORDER BY preachingDate ASC LIMIT 3`
  ).all(ctx.user.id, nowIso, in3Days.toISOString()).map(mapSermon);
  for (const s of upcomingSermons) {
    pulse.push({
      id: `sermon:${s.id}`, category: 'sermon', priority: 10,
      title: s.title, subtitle: `${s.readiness.percent}% prepared`,
      detail: s.readiness.remaining.length ? `Remaining: ${s.readiness.remaining.join(', ')}` : 'Preparation checklist complete',
      route: `sermon/${s.id}`,
      rule: 'Preaching date is within 3 days and the sermon is not marked preached.',
      sources: [{ type: 'sermon', id: s.id, title: s.title }],
    });
  }

  const overdue = ctx.db.prepare(
    "SELECT * FROM tasks WHERE userId = ? AND status != 'COMPLETED' AND dueAt IS NOT NULL AND dueAt < ? ORDER BY dueAt ASC LIMIT 5"
  ).all(ctx.user.id, nowIso);
  if (overdue.length) {
    pulse.push({
      id: 'tasks:overdue', category: 'tasks', priority: 9,
      title: `${overdue.length} overdue task${overdue.length > 1 ? 's' : ''}`,
      subtitle: overdue[0].title, detail: 'Past their due date and not completed.',
      route: 'tasks?filter=overdue',
      rule: 'Task due date is in the past and status is not COMPLETED.',
      sources: overdue.map((t) => ({ type: 'task', id: t.id, title: t.title })),
    });
  }

  const meetings = ctx.db.prepare(
    'SELECT * FROM meetings WHERE userId = ? AND startsAt >= ? AND startsAt < ? ORDER BY startsAt ASC'
  ).all(ctx.user.id, nowIso, endOfToday);
  for (const m of meetings.slice(0, 2)) {
    pulse.push({
      id: `meeting:${m.id}`, category: 'meeting', priority: m.agenda?.trim() ? 7 : 8,
      title: m.title, subtitle: `Today · ${m.startsAt.slice(11, 16)}`,
      detail: m.agenda?.trim() ? 'Agenda prepared' : 'No agenda prepared yet',
      route: `meeting/${m.id}`,
      rule: 'Meeting starts later today.',
      sources: [{ type: 'meeting', id: m.id, title: m.title }],
    });
  }

  const prayer = ctx.db.prepare(
    "SELECT * FROM prayer_requests WHERE userId = ? AND status != 'ANSWERED' AND followUpAt IS NOT NULL AND followUpAt < ? ORDER BY followUpAt ASC"
  ).all(ctx.user.id, endOfToday);
  if (prayer.length) {
    pulse.push({
      id: 'prayer:due', category: 'prayer', priority: 8,
      title: `${prayer.length} prayer follow-up${prayer.length > 1 ? 's' : ''} due`,
      subtitle: prayer[0].person || prayer[0].title, detail: 'Follow-up date has arrived.',
      route: 'prayer?filter=due',
      rule: 'Prayer request follow-up date is today or earlier and it is not answered.',
      sources: prayer.map((p) => ({ type: 'prayer', id: p.id, title: p.title })),
    });
  }

  const events = ctx.db.prepare(
    'SELECT * FROM events WHERE userId = ? AND startsAt >= ? AND startsAt <= ? ORDER BY startsAt ASC LIMIT 3'
  ).all(ctx.user.id, nowIso, in3Days.toISOString());
  for (const e of events) {
    const open = ctx.db.prepare("SELECT COUNT(*) n FROM tasks WHERE userId = ? AND linkedType = 'event' AND linkedId = ? AND status != 'COMPLETED'")
      .get(ctx.user.id, e.id).n;
    pulse.push({
      id: `event:${e.id}`, category: 'event', priority: 6,
      title: e.name, subtitle: e.startsAt?.slice(0, 10) ?? '',
      detail: open ? `${open} task${open > 1 ? 's' : ''} remaining` : 'No open tasks',
      route: `event/${e.id}`,
      rule: 'Event starts within 3 days.',
      sources: [{ type: 'event', id: e.id, title: e.name }],
    });
  }

  return pulse
    .filter((p) => !dismissed.includes(p.id) && !dismissed.includes(p.category))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit);
}

/** Continue where I left off — most recently touched sermons/notes. */
export function continueItems(ctx, { limit = 5 } = {}) {
  const sermons = ctx.db.prepare('SELECT id,title,lastPosition,updatedAt FROM sermons WHERE userId = ? ORDER BY updatedAt DESC LIMIT ?')
    .all(ctx.user.id, limit).map((s) => ({ type: 'sermon', id: s.id, title: s.title, position: s.lastPosition, at: s.updatedAt, route: `sermon/${s.id}` }));
  const notes = ctx.db.prepare('SELECT id,title,updatedAt FROM notes WHERE userId = ? ORDER BY updatedAt DESC LIMIT ?')
    .all(ctx.user.id, limit).map((n) => ({ type: 'note', id: n.id, title: n.title, position: '', at: n.updatedAt, route: `note/${n.id}` }));
  return [...sermons, ...notes].sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Ministry Inbox — separates things needing action from things needing awareness. */
export function inbox(ctx) {
  const nowIso = now();
  const { end } = dayBounds();
  const actions = [
    ...ctx.db.prepare("SELECT id,title FROM tasks WHERE userId = ? AND status != 'COMPLETED' AND dueAt IS NOT NULL AND dueAt < ?")
      .all(ctx.user.id, end).map((t) => ({ type: 'task', id: t.id, title: t.title, route: `task/${t.id}` })),
    ...ctx.db.prepare("SELECT id,title FROM prayer_requests WHERE userId = ? AND status != 'ANSWERED' AND followUpAt IS NOT NULL AND followUpAt < ?")
      .all(ctx.user.id, end).map((p) => ({ type: 'prayer', id: p.id, title: `Follow up: ${p.title}`, route: `prayer/${p.id}` })),
    ...ctx.db.prepare("SELECT id,title FROM sermons WHERE userId = ? AND status = 'REVIEW'")
      .all(ctx.user.id).map((s) => ({ type: 'sermon', id: s.id, title: `Review: ${s.title}`, route: `sermon/${s.id}` })),
  ];
  const information = [
    ...ctx.db.prepare('SELECT id,name AS title,startsAt FROM events WHERE userId = ? AND startsAt >= ? ORDER BY startsAt LIMIT 5')
      .all(ctx.user.id, nowIso).map((e) => ({ type: 'event', id: e.id, title: e.title, route: `event/${e.id}` })),
    ...ctx.db.prepare('SELECT id,title FROM meetings WHERE userId = ? AND startsAt >= ? ORDER BY startsAt LIMIT 5')
      .all(ctx.user.id, nowIso).map((m) => ({ type: 'meeting', id: m.id, title: m.title, route: `meeting/${m.id}` })),
  ];
  return { actions, information };
}

/* ======================= universal search ======================= */
export function searchAll(ctx, query, { limit = 10 } = {}) {
  if (!query?.trim()) return { query: '', groups: [] };
  const like = `%${query.trim().toLowerCase()}%`;
  const g = (type, rows, route) => ({ type, count: rows.length, results: rows.map((r) => ({ ...r, route: route(r) })) });
  const groups = [
    g('sermons', ctx.db.prepare('SELECT id,title,status FROM sermons WHERE userId = ? AND (lower(title) LIKE ? OR lower(keyIdea) LIKE ? OR lower(passages) LIKE ? OR lower(body) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, like, like, limit), (r) => `sermon/${r.id}`),
    g('notes', ctx.db.prepare('SELECT id,title FROM notes WHERE userId = ? AND (lower(title) LIKE ? OR lower(body) LIKE ? OR lower(tags) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, like, limit), (r) => `note/${r.id}`),
    g('tasks', ctx.db.prepare('SELECT id,title,status FROM tasks WHERE userId = ? AND (lower(title) LIKE ? OR lower(description) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, limit), (r) => `task/${r.id}`),
    g('events', ctx.db.prepare('SELECT id,name AS title FROM events WHERE userId = ? AND (lower(name) LIKE ? OR lower(description) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, limit), (r) => `event/${r.id}`),
    g('meetings', ctx.db.prepare('SELECT id,title FROM meetings WHERE userId = ? AND (lower(title) LIKE ? OR lower(notes) LIKE ? OR lower(agenda) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, like, limit), (r) => `meeting/${r.id}`),
    g('prayer', ctx.db.prepare('SELECT id,title FROM prayer_requests WHERE userId = ? AND (lower(title) LIKE ? OR lower(person) LIKE ? OR lower(request) LIKE ?) LIMIT ?')
      .all(ctx.user.id, like, like, like, limit), (r) => `prayer/${r.id}`),
    g('ideas', ctx.db.prepare('SELECT id,text AS title FROM ideas WHERE userId = ? AND lower(text) LIKE ? LIMIT ?')
      .all(ctx.user.id, like, limit), (r) => `idea/${r.id}`),
  ].filter((group) => group.count > 0);
  return { query, groups };
}

/* ======================= ministry map (real relationships only) ======================= */
export function ministryMap(ctx, type, id) {
  const edges = [];
  const push = (from, to, label) => edges.push({ from, to, label });
  if (type === 'sermon') {
    const s = getSermon(ctx, id);
    const node = { type: 'sermon', id: s.id, title: s.title };
    for (const p of s.passages) push(node, { type: 'bible', id: p, title: p }, 'passage');
    for (const n of listNotes(ctx, { linkedType: 'sermon', linkedId: id })) push(node, { type: 'note', id: n.id, title: n.title }, 'note');
    for (const t of listTasks(ctx, { linkedType: 'sermon', linkedId: id })) push(node, { type: 'task', id: t.id, title: t.title }, 'task');
    if (s.preachingDate) push(node, { type: 'calendar', id: s.preachingDate, title: s.preachingDate.slice(0, 10) }, 'preaching date');
    if (s.seriesId) {
      const ser = ctx.db.prepare('SELECT * FROM sermon_series WHERE id = ? AND userId = ?').get(s.seriesId, ctx.user.id);
      if (ser) push(node, { type: 'series', id: ser.id, title: ser.title }, 'series');
    }
    return { root: node, edges };
  }
  if (type === 'event') {
    const e = owned(ctx, 'events', id);
    const node = { type: 'event', id: e.id, title: e.name };
    for (const t of listTasks(ctx, { linkedType: 'event', linkedId: id })) push(node, { type: 'task', id: t.id, title: t.title }, 'task');
    for (const n of listNotes(ctx, { linkedType: 'event', linkedId: id })) push(node, { type: 'note', id: n.id, title: n.title }, 'note');
    return { root: node, edges };
  }
  throw badRequest('Unsupported map root.');
}

/* ======================= AI memory ======================= */
export const listMemory = (ctx) =>
  ctx.db.prepare('SELECT * FROM ai_memory WHERE userId = ? ORDER BY createdAt DESC').all(ctx.user.id)
    .map((m) => ({ ...m, enabled: !!m.enabled }));

export function addMemory(ctx, { content, source = 'user' }) {
  if (!content?.trim()) throw badRequest('Memory content is required.');
  const id = uid();
  ctx.db.prepare('INSERT INTO ai_memory (id,userId,content,source,enabled,createdAt) VALUES (?,?,?,?,1,?)')
    .run(id, ctx.user.id, content.trim(), source, now());
  return ctx.db.prepare('SELECT * FROM ai_memory WHERE id = ?').get(id);
}

export function updateMemory(ctx, id, patch = {}) {
  mustOwn(ctx, 'ai_memory', id);
  if (patch.content !== undefined) ctx.db.prepare('UPDATE ai_memory SET content = ? WHERE id = ?').run(patch.content, id);
  if (patch.enabled !== undefined) ctx.db.prepare('UPDATE ai_memory SET enabled = ? WHERE id = ?').run(patch.enabled ? 1 : 0, id);
  return ctx.db.prepare('SELECT * FROM ai_memory WHERE id = ?').get(id);
}

export function deleteMemory(ctx, id) {
  mustOwn(ctx, 'ai_memory', id);
  ctx.db.prepare('DELETE FROM ai_memory WHERE id = ?').run(id);
  return { deleted: true };
}
export function clearMemory(ctx) {
  ctx.db.prepare('DELETE FROM ai_memory WHERE userId = ?').run(ctx.user.id);
  return { cleared: true };
}

/* ======================= data export / account deletion ======================= */
export function exportData(ctx) {
  const t = (name) => ctx.db.prepare(`SELECT * FROM ${name} WHERE userId = ?`).all(ctx.user.id);
  return {
    exportedAt: now(),
    profile: getProfile(ctx),
    sermons: t('sermons').map(mapSermon),
    sermonSeries: t('sermon_series'),
    notes: t('notes').map(mapNote),
    tasks: t('tasks'),
    prayerRequests: t('prayer_requests'),
    events: t('events'),
    eventLedger: t('event_ledger'),
    meetings: t('meetings').map(mapMeeting),
    ideas: t('ideas'),
    goals: t('goals'),
    aiMemory: t('ai_memory'),
    auditLogs: t('audit_logs'),
  };
}

export function deleteAccount(ctx) {
  ctx.db.prepare('DELETE FROM users WHERE id = ?').run(ctx.user.id);
  return { deleted: true };
}
