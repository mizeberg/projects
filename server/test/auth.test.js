import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers.js';
import { signToken, verifyToken } from '../src/core.js';

test('registration, login and session', async (t) => {
  const h = harness(); t.after(() => h.close());

  const bad = await h.post('/api/auth/register', { email: 'not-an-email', password: 'ministry-pass-1' });
  assert.equal(bad.status, 400);

  const short = await h.post('/api/auth/register', { email: 'a@b.com', password: 'short' });
  assert.equal(short.status, 400);

  const reg = await h.post('/api/auth/register', { email: 'Pastor@Church.org', password: 'ministry-pass-1' });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);

  const dupe = await h.post('/api/auth/register', { email: 'pastor@church.org', password: 'ministry-pass-1' });
  assert.equal(dupe.status, 409);

  const wrong = await h.post('/api/auth/login', { email: 'pastor@church.org', password: 'nope-nope-nope' });
  assert.equal(wrong.status, 401);

  const login = await h.post('/api/auth/login', { email: 'pastor@church.org', password: 'ministry-pass-1' });
  assert.equal(login.status, 200);

  const me = await h.get('/api/me', { token: login.body.token });
  assert.equal(me.body.user.email, 'pastor@church.org');
  assert.equal(me.body.profile.onboardingComplete, false);

  assert.equal((await h.get('/api/me')).status, 401);
  assert.equal((await h.get('/api/me', { token: 'garbage.token.here' })).status, 401);
});

test('onboarding personalization persists and is never invented', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('p1@church.org');

  const before = await h.get('/api/me', { token });
  assert.equal(before.body.profile.preferredName, 'Pastor');
  assert.deepEqual(before.body.profile.bibleTranslations, []);

  const church = await h.post('/api/me/church', { name: 'Grace Fellowship', location: 'Hyderabad' }, { token });
  assert.equal(church.status, 201);

  const updated = await h.patch('/api/me/profile', {
    preferredName: 'David', role: 'senior_pastor',
    bibleTranslations: ['ESV', 'Telugu BSI'], ministryAreas: ['preaching', 'youth'],
    sermonWorkflow: 'bible_study_first', onboardingComplete: true,
  }, { token });
  assert.equal(updated.body.preferredName, 'David');
  assert.deepEqual(updated.body.bibleTranslations, ['ESV', 'Telugu BSI']);
  assert.equal(updated.body.onboardingComplete, true);
  assert.ok(updated.body.churchId);
});

test('production refuses to sign tokens with the public development key', async (t) => {
  const prevEnv = process.env.NODE_ENV;
  const prevSecret = process.env.JOHN_JWT_SECRET;
  t.after(() => {
    if (prevEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = prevEnv;
    if (prevSecret === undefined) delete process.env.JOHN_JWT_SECRET; else process.env.JOHN_JWT_SECRET = prevSecret;
  });

  process.env.NODE_ENV = 'production';
  delete process.env.JOHN_JWT_SECRET;
  assert.throws(() => signToken({ sub: 'u1' }), /JOHN_JWT_SECRET must be set/);

  process.env.JOHN_JWT_SECRET = 'john-ai-dev-secret-change-me';
  assert.throws(() => signToken({ sub: 'u1' }), /JOHN_JWT_SECRET must be set/);

  process.env.JOHN_JWT_SECRET = 'a-real-private-production-secret';
  const token = signToken({ sub: 'u1' });
  assert.equal(verifyToken(token).sub, 'u1');
});
