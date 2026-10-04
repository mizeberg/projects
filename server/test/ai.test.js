import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, iso } from './helpers.js';

test('AI read actions run directly; writes require confirmation', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('ai@church.org');
  await h.post('/api/tasks', { title: 'Finish conclusion', dueAt: iso(0, 20) }, { token });

  const read = await h.post('/api/ai/ask', { message: 'show my tasks' }, { token });
  assert.equal(read.body.type, 'answer');
  assert.match(read.body.message, /Finish conclusion/);

  const write = await h.post('/api/ai/ask', { message: 'Remind me to finish Sunday sermon tomorrow at 7 pm' }, { token });
  assert.equal(write.body.type, 'confirm', 'a write is never executed silently');
  assert.equal(write.body.card.tool, 'createTask');
  assert.match(write.body.card.args.title, /finish Sunday sermon/i);
  assert.ok(write.body.card.args.dueAt.endsWith('19:00:00.000Z'));
  assert.equal((await h.get('/api/tasks', { token })).body.length, 1, 'nothing created before confirmation');

  const exec = await h.post('/api/ai/execute', { tool: write.body.card.tool, args: write.body.card.args, confirm: true }, { token });
  assert.equal(exec.body.type, 'answer');
  assert.equal((await h.get('/api/tasks', { token })).body.length, 2);

  // execute without confirm is refused
  assert.equal((await h.post('/api/ai/execute', { tool: 'createTask', args: { title: 'x' } }, { token })).status, 400);
  assert.equal((await h.post('/api/ai/execute', { tool: 'wipeEverything', args: {}, confirm: true }, { token })).status, 400);

  // deletion is never inferred
  const del = await h.post('/api/ai/ask', { message: 'delete my sermon' }, { token });
  assert.equal(del.body.type, 'clarify');
});

test('AI context is scoped, transparent and user-controlled', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('ai2@church.org');
  const sermon = (await h.post('/api/sermons', { title: 'Faith in Trials', passages: ['James 1'] }, { token })).body;

  const res = await h.post('/api/ai/ask', {
    message: "What's still incomplete?",
    context: { screen: 'sermon', entityType: 'sermon', entityId: sermon.id },
  }, { token });
  assert.equal(res.body.tool, 'readSermonIntelligence');
  assert.ok(res.body.context.used.some((u) => u.type === 'sermon' && u.id === sermon.id));
  assert.ok(!res.body.context.used.some((u) => u.type === 'event'), 'unrelated context is not pulled in');

  // Memory is explicit and controllable.
  const mem = (await h.post('/api/ai/memory', { content: 'Prefers concise sermon outlines.' }, { token })).body;
  const withMem = await h.post('/api/ai/ask', { message: 'what do I have today' }, { token });
  assert.ok(withMem.body.context.used.some((u) => u.type === 'memory'));
  await h.patch(`/api/ai/memory/${mem.id}`, { enabled: false }, { token });
  const withoutMem = await h.post('/api/ai/ask', { message: 'what do I have today' }, { token });
  assert.ok(!withoutMem.body.context.used.some((u) => u.type === 'memory'));
  await h.del('/api/ai/memory', undefined, { token });
  assert.deepEqual((await h.get('/api/ai/memory', { token })).body, []);

  // Navigation uses real routes.
  const nav = await h.post('/api/ai/ask', { message: 'open my prayer' }, { token });
  assert.equal(nav.body.type, 'navigate');
  assert.equal(nav.body.route, 'prayer');

  // Conversation history is recorded and clearable.
  assert.ok((await h.get('/api/ai/conversation', { token })).body.length > 0);
  await h.del('/api/ai/conversation', undefined, { token });
  assert.deepEqual((await h.get('/api/ai/conversation', { token })).body, []);
});

test('AI will not answer beyond stored data', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('ai3@church.org');
  const res = await h.post('/api/ai/ask', { message: 'Pentecost 1998 attendance figures' }, { token });
  assert.match(res.body.message, /could not find anything|will not guess/i);
});

test('meeting notes become tasks only after confirmation', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('mtg@church.org');
  const m = (await h.post('/api/meetings', {
    title: 'Leadership', notes: 'Attendance was good\nAction: book the hall\nTODO: call the worship team\nJust a remark',
  }, { token })).body;

  const proposed = (await h.get(`/api/meetings/${m.id}/action-items`, { token })).body;
  assert.equal(proposed.proposals.length, 2);
  assert.equal(proposed.requiresConfirmation, true);
  assert.equal((await h.get('/api/tasks', { token })).body.length, 0);

  assert.equal((await h.post(`/api/meetings/${m.id}/action-items`, { proposals: proposed.proposals }, { token })).status, 400);
  const created = await h.post(`/api/meetings/${m.id}/action-items`, { proposals: proposed.proposals, confirm: true }, { token });
  assert.equal(created.status, 201);
  const tasks = (await h.get('/api/tasks', { token })).body;
  assert.equal(tasks.length, 2);
  assert.equal(tasks[0].linkedType, 'meeting');
});
