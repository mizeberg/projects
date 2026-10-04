import express from 'express';
import { openDb } from './db.js';
import {
  uid, now, json, hashPassword, verifyPassword, signToken, verifyToken,
  HttpError, unauthorized, badRequest, asyncRoute, requireFields,
} from './core.js';
import { defaultPermissions } from './permissions.js';
import * as D from './domain/index.js';
import { runAgent, listConversation, clearConversation, suggestions } from './ai/agent.js';
import { TOOLS, TOOL_MAP, describeSkills } from './ai/tools.js';

export function createApp({ db = openDb() } = {}) {
  const app = express();
  app.use(express.json({ limit: '2mb' }));
  app.set('db', db);

  /* -------- authentication context -------- */
  const authenticate = (req) => {
    const header = req.get('authorization') ?? '';
    const claims = verifyToken(header.replace(/^Bearer\s+/i, ''));
    if (!claims?.sub) throw unauthorized();
    const user = db.prepare('SELECT id,email,displayName FROM users WHERE id = ?').get(claims.sub);
    if (!user) throw unauthorized();
    const profile = D.getProfile({ db, user });
    const membership = profile?.churchId
      ? db.prepare('SELECT * FROM memberships WHERE churchId = ? AND userId = ?').get(profile.churchId, user.id)
      : null;
    return {
      db, user, profile,
      membership: membership ? { ...membership, permissions: json(membership.permissions, {}) } : null,
    };
  };
  const auth = (handler) => asyncRoute((req, res) => handler(authenticate(req), req, res));

  /* ============ health ============ */
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'john-ai', time: now() }));

  /* ============ auth ============ */
  app.post('/api/auth/register', asyncRoute((req, res) => {
    requireFields(req.body, ['email', 'password']);
    const email = String(req.body.email).trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw badRequest('Enter a valid email address.');
    if (String(req.body.password).length < 8) throw badRequest('Use at least 8 characters for your password.');
    if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
      throw new HttpError(409, 'email_taken', 'An account already exists for that email.');
    }
    const id = uid();
    db.prepare('INSERT INTO users (id,email,passwordHash,displayName,createdAt) VALUES (?,?,?,?,?)')
      .run(id, email, hashPassword(String(req.body.password)), req.body.displayName ?? '', now());
    db.prepare('INSERT INTO profiles (userId,preferredName,updatedAt) VALUES (?,?,?)')
      .run(id, req.body.displayName ?? '', now());
    res.status(201).json({ token: signToken({ sub: id }), user: { id, email, displayName: req.body.displayName ?? '' } });
  }));

  app.post('/api/auth/login', asyncRoute((req, res) => {
    requireFields(req.body, ['email', 'password']);
    const email = String(req.body.email).trim().toLowerCase();
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!row || !verifyPassword(String(req.body.password), row.passwordHash)) {
      throw unauthorized('Email or password is incorrect.');
    }
    res.json({ token: signToken({ sub: row.id }), user: { id: row.id, email: row.email, displayName: row.displayName } });
  }));

  app.get('/api/me', auth((ctx, _req, res) => res.json({ user: ctx.user, profile: ctx.profile, membership: ctx.membership })));
  app.patch('/api/me/profile', auth((ctx, req, res) => res.json(D.updateProfile(ctx, req.body))));
  app.post('/api/me/church', auth((ctx, req, res) => res.status(201).json(D.createChurch(ctx, req.body))));
  app.get('/api/me/export', auth((ctx, _req, res) => res.json(D.exportData(ctx))));
  app.delete('/api/me', auth((ctx, req, res) => {
    if (req.body?.confirm !== true) throw badRequest('Account deletion requires explicit confirmation.');
    res.json(D.deleteAccount(ctx));
  }));
  app.get('/api/me/permissions', auth((ctx, _req, res) =>
    res.json({ role: ctx.membership?.role ?? null, permissions: ctx.membership?.permissions ?? defaultPermissions('owner') })));

  /* ============ home ============ */
  app.get('/api/home/pulse', auth((ctx, req, res) =>
    res.json(D.ministryPulse(ctx, { dismissed: String(req.query.dismissed ?? '').split(',').filter(Boolean) }))));
  app.get('/api/home/today', auth((ctx, req, res) => res.json(D.today(ctx, { date: req.query.date }))));
  app.get('/api/home/continue', auth((ctx, _req, res) => res.json(D.continueItems(ctx, {}))));
  app.get('/api/home/inbox', auth((ctx, _req, res) => res.json(D.inbox(ctx))));

  /* ============ sermons ============ */
  app.get('/api/sermons', auth((ctx, req, res) => res.json(D.listSermons(ctx, req.query))));
  app.post('/api/sermons', auth((ctx, req, res) => res.status(201).json(D.createSermon(ctx, req.body))));
  app.get('/api/sermons/:id', auth((ctx, req, res) => res.json(D.getSermon(ctx, req.params.id))));
  app.patch('/api/sermons/:id', auth((ctx, req, res) => res.json(D.updateSermon(ctx, req.params.id, req.body))));
  app.delete('/api/sermons/:id', auth((ctx, req, res) => res.json(D.deleteSermon(ctx, req.params.id))));
  app.post('/api/sermons/restore', auth((ctx, req, res) => res.json(D.restoreSermon(ctx, req.body.snapshot))));
  app.get('/api/sermons/:id/intelligence', auth((ctx, req, res) => res.json(D.sermonIntelligence(ctx, req.params.id))));
  app.get('/api/sermons/:id/map', auth((ctx, req, res) => res.json(D.ministryMap(ctx, 'sermon', req.params.id))));
  app.get('/api/sermons/:id/versions', auth((ctx, req, res) => res.json(D.listSermonVersions(ctx, req.params.id))));
  app.post('/api/sermons/:id/versions/:versionId/restore',
    auth((ctx, req, res) => res.json(D.restoreSermonVersion(ctx, req.params.id, req.params.versionId))));
  app.get('/api/series', auth((ctx, _req, res) => res.json(D.listSeries(ctx))));
  app.post('/api/series', auth((ctx, req, res) => res.status(201).json(D.createSeries(ctx, req.body))));

  /* ============ tasks / notes / prayer / ideas / goals ============ */
  app.get('/api/tasks', auth((ctx, req, res) => res.json(D.listTasks(ctx, req.query))));
  app.post('/api/tasks', auth((ctx, req, res) => res.status(201).json(D.createTask(ctx, req.body))));
  app.patch('/api/tasks/:id', auth((ctx, req, res) => res.json(D.updateTask(ctx, req.params.id, req.body))));
  app.delete('/api/tasks/:id', auth((ctx, req, res) => res.json(D.deleteTask(ctx, req.params.id))));

  app.get('/api/notes', auth((ctx, req, res) => res.json(D.listNotes(ctx, req.query))));
  app.post('/api/notes', auth((ctx, req, res) => res.status(201).json(D.createNote(ctx, req.body))));
  app.patch('/api/notes/:id', auth((ctx, req, res) => res.json(D.updateNote(ctx, req.params.id, req.body))));
  app.delete('/api/notes/:id', auth((ctx, req, res) => res.json(D.deleteNote(ctx, req.params.id))));

  app.get('/api/prayer', auth((ctx, req, res) => res.json(D.listPrayerRequests(ctx, req.query))));
  app.post('/api/prayer', auth((ctx, req, res) => res.status(201).json(D.createPrayerRequest(ctx, req.body))));
  app.patch('/api/prayer/:id', auth((ctx, req, res) => res.json(D.updatePrayerRequest(ctx, req.params.id, req.body))));

  app.get('/api/ideas', auth((ctx, _req, res) => res.json(D.listIdeas(ctx, {}))));
  app.post('/api/ideas', auth((ctx, req, res) => res.status(201).json(D.captureIdea(ctx, req.body))));

  app.get('/api/goals', auth((ctx, _req, res) => res.json(D.listGoals(ctx))));
  app.post('/api/goals', auth((ctx, req, res) => res.status(201).json(D.createGoal(ctx, req.body))));

  /* ============ events, finances, meetings ============ */
  app.get('/api/events', auth((ctx, req, res) => res.json(D.listEvents(ctx, req.query))));
  app.post('/api/events', auth((ctx, req, res) => res.status(201).json(D.createEvent(ctx, req.body))));
  app.patch('/api/events/:id', auth((ctx, req, res) => res.json(D.updateEvent(ctx, req.params.id, req.body))));
  app.get('/api/events/:id/finances', auth((ctx, req, res) => res.json(D.eventFinances(ctx, req.params.id))));
  app.post('/api/events/:id/finances', auth((ctx, req, res) => res.status(201).json(D.addLedgerEntry(ctx, req.params.id, req.body))));
  app.get('/api/events/:id/map', auth((ctx, req, res) => res.json(D.ministryMap(ctx, 'event', req.params.id))));

  app.get('/api/meetings', auth((ctx, req, res) => res.json(D.listMeetings(ctx, req.query))));
  app.post('/api/meetings', auth((ctx, req, res) => res.status(201).json(D.createMeeting(ctx, req.body))));
  app.patch('/api/meetings/:id', auth((ctx, req, res) => res.json(D.updateMeeting(ctx, req.params.id, req.body))));
  app.get('/api/meetings/:id/action-items', auth((ctx, req, res) => res.json(D.proposeMeetingActions(ctx, req.params.id))));
  app.post('/api/meetings/:id/action-items', auth((ctx, req, res) => {
    if (req.body?.confirm !== true) throw badRequest('Action items are only created after you confirm them.');
    const created = (req.body.proposals ?? []).map((p) => D.createTask(ctx, p));
    res.status(201).json(created);
  }));

  /* ============ progress / search / audit ============ */
  app.get('/api/progress', auth((ctx, _req, res) => res.json(D.progress(ctx))));
  app.get('/api/workload', auth((ctx, _req, res) => res.json(D.workload(ctx))));
  app.get('/api/search', auth((ctx, req, res) => res.json(D.searchAll(ctx, String(req.query.q ?? '')))));
  app.get('/api/audit', auth((ctx, req, res) => res.json(D.listAudit(ctx, req.query))));

  /* ============ AI ============ */
  app.post('/api/ai/ask', auth((ctx, req, res) => res.json(runAgent(ctx, {
    message: req.body?.message,
    context: req.body?.context ?? {},
    confirm: req.body?.confirm === true,
  }))));
  app.post('/api/ai/execute', auth((ctx, req, res) => {
    requireFields(req.body, ['tool']);
    if (req.body.confirm !== true) throw badRequest('This action requires confirmation.');
    if (!TOOL_MAP[req.body.tool]) throw badRequest('Unknown capability.');
    res.json(runAgent(ctx, { message: null, context: req.body.context ?? {}, confirm: true, forcedTool: req.body.tool, forcedArgs: req.body.args ?? {} }));
  }));
  app.get('/api/ai/conversation', auth((ctx, _req, res) => res.json(listConversation(ctx))));
  app.delete('/api/ai/conversation', auth((ctx, _req, res) => res.json(clearConversation(ctx))));
  app.get('/api/ai/suggestions', auth((ctx, req, res) => res.json(suggestions(ctx, req.query))));
  app.get('/api/ai/skills', auth((_ctx, _req, res) => res.json(describeSkills())));
  app.get('/api/ai/tools', auth((_ctx, _req, res) =>
    res.json(TOOLS.map((t) => ({ name: t.name, mode: t.mode, confirm: t.confirm, description: t.description, args: t.args })))));

  app.get('/api/ai/memory', auth((ctx, _req, res) => res.json(D.listMemory(ctx))));
  app.post('/api/ai/memory', auth((ctx, req, res) => res.status(201).json(D.addMemory(ctx, req.body))));
  app.patch('/api/ai/memory/:id', auth((ctx, req, res) => res.json(D.updateMemory(ctx, req.params.id, req.body))));
  app.delete('/api/ai/memory/:id', auth((ctx, req, res) => res.json(D.deleteMemory(ctx, req.params.id))));
  app.delete('/api/ai/memory', auth((ctx, _req, res) => res.json(D.clearMemory(ctx))));

  /* ============ errors ============ */
  app.use((_req, res) => res.status(404).json({ error: 'not_found', message: 'That endpoint does not exist.' }));
  app.use((err, _req, res, _next) => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code, message: err.message });
    // Never surface stack traces to the pastor.
    console.error('[john-ai]', err);
    res.status(500).json({ error: 'server_error', message: 'Something went wrong on our side. Please try again.' });
  });

  return app;
}
