import test from 'node:test';
import assert from 'node:assert/strict';
import { harness } from './helpers.js';

// The single most important guarantee in John AI.
test('Pastor A cannot access Pastor B private data', async (t) => {
  const h = harness(); t.after(() => h.close());
  const a = await h.signUp('a@church.org');
  const b = await h.signUp('b@church.org');

  const sermon = (await h.post('/api/sermons', { title: 'Faith in Trials', passages: ['James 1:2-4'] }, { token: a })).body;
  const note = (await h.post('/api/notes', { title: 'Counselling note', body: 'private' }, { token: a })).body;
  const prayer = (await h.post('/api/prayer', { title: 'Private request', person: 'John' }, { token: a })).body;
  const task = (await h.post('/api/tasks', { title: 'A task' }, { token: a })).body;

  // B sees nothing of A's
  assert.deepEqual((await h.get('/api/sermons', { token: b })).body, []);
  assert.deepEqual((await h.get('/api/notes', { token: b })).body, []);
  assert.deepEqual((await h.get('/api/prayer', { token: b })).body, []);
  assert.deepEqual((await h.get('/api/tasks', { token: b })).body, []);

  // Direct id access is a 404, not a 403 — existence is not leaked.
  assert.equal((await h.get(`/api/sermons/${sermon.id}`, { token: b })).status, 404);
  assert.equal((await h.patch(`/api/sermons/${sermon.id}`, { title: 'hijack' }, { token: b })).status, 404);
  assert.equal((await h.del(`/api/sermons/${sermon.id}`, undefined, { token: b })).status, 404);
  assert.equal((await h.patch(`/api/notes/${note.id}`, { body: 'x' }, { token: b })).status, 404);
  assert.equal((await h.patch(`/api/prayer/${prayer.id}`, { status: 'ANSWERED' }, { token: b })).status, 404);
  assert.equal((await h.del(`/api/tasks/${task.id}`, undefined, { token: b })).status, 404);

  // Search and AI must not cross the boundary either.
  assert.deepEqual((await h.get('/api/search?q=Faith', { token: b })).body.groups, []);
  const ai = await h.post('/api/ai/ask', { message: 'Faith in Trials' }, { token: b });
  assert.match(ai.body.message, /could not find anything/i);

  // A still has everything.
  assert.equal((await h.get('/api/sermons', { token: a })).body.length, 1);
  assert.equal((await h.get(`/api/sermons/${sermon.id}`, { token: a })).status, 200);
});

test('finance access is permission gated for staff roles', async (t) => {
  const h = harness(); t.after(() => h.close());
  const owner = await h.signUp('owner@church.org');
  await h.post('/api/me/church', { name: 'Grace' }, { token: owner });
  const event = (await h.post('/api/events', { name: 'Christmas Service' }, { token: owner })).body;

  const fin = await h.post(`/api/events/${event.id}/finances`, { kind: 'collection', name: 'Offering', amount: 1000 }, { token: owner });
  assert.equal(fin.status, 201);
  assert.equal(fin.body.totalCollected, 1000);

  const spend = await h.post(`/api/events/${event.id}/finances`, { kind: 'expense', name: 'Decor', amount: 250 }, { token: owner });
  assert.equal(spend.body.balance, 750);

  // Negative / malformed amounts rejected.
  assert.equal((await h.post(`/api/events/${event.id}/finances`, { kind: 'expense', name: 'x', amount: -5 }, { token: owner })).status, 400);
  assert.equal((await h.post(`/api/events/${event.id}/finances`, { kind: 'nonsense', name: 'x', amount: 5 }, { token: owner })).status, 400);

  // Another pastor cannot read the ledger at all.
  const other = await h.signUp('other@church.org');
  assert.equal((await h.get(`/api/events/${event.id}/finances`, { token: other })).status, 404);
});
