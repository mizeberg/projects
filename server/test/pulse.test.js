import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, iso } from './helpers.js';

test('ministry pulse is empty when there is nothing to surface', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('pulse1@church.org');
  assert.deepEqual((await h.get('/api/home/pulse', { token })).body, [], 'no fabricated urgency on an empty account');
  assert.deepEqual((await h.get('/api/home/today', { token })).body.items, []);
  const progress = (await h.get('/api/progress', { token })).body;
  assert.equal(progress.sermons.total, 0);
  assert.equal(progress.tasks.percent, null, 'no percentage is invented without data');
});

test('ministry pulse surfaces real items with transparent rules', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('pulse2@church.org');

  await h.post('/api/sermons', { title: 'Sunday Sermon', preachingDate: iso(2) }, { token });
  await h.post('/api/tasks', { title: 'Overdue task', dueAt: iso(-2) }, { token });
  await h.post('/api/prayer', { title: 'Follow up with John', person: 'John', followUpAt: iso(0, 1) }, { token });
  await h.post('/api/meetings', { title: 'Leadership Meeting', startsAt: iso(0, 23) }, { token });
  await h.post('/api/events', { name: 'Youth Event', startsAt: iso(2) }, { token });

  const pulse = (await h.get('/api/home/pulse', { token })).body;
  assert.ok(pulse.length >= 4);
  for (const item of pulse) {
    assert.ok(item.rule, 'every pulse item explains why it is shown');
    assert.ok(Array.isArray(item.sources) && item.sources.length, 'every pulse item cites real sources');
    assert.ok(item.route, 'every pulse item navigates somewhere real');
  }
  assert.equal(pulse[0].category, 'sermon', 'sermon within 3 days outranks the rest');

  // Dismissal is honoured.
  const dismissed = (await h.get('/api/home/pulse?dismissed=sermon', { token })).body;
  assert.ok(!dismissed.some((p) => p.category === 'sermon'));

  const inbox = (await h.get('/api/home/inbox', { token })).body;
  assert.ok(inbox.actions.length >= 2);
  assert.ok(inbox.information.length >= 2);

  const workload = (await h.get('/api/workload', { token })).body;
  assert.ok(workload.days.length >= 1);

  const cont = (await h.get('/api/home/continue', { token })).body;
  assert.equal(cont[0].type, 'sermon');
});
