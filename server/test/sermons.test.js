import test from 'node:test';
import assert from 'node:assert/strict';
import { harness, iso } from './helpers.js';

test('sermon workspace: readiness, timeline, versions, undo', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('s@church.org');
  await h.patch('/api/me/profile', { sermonWorkflow: 'bible_study_first' }, { token });

  const created = (await h.post('/api/sermons', {
    title: 'Faith in Trials', passages: ['James 1:2-4'], preachingDate: iso(5),
  }, { token })).body;

  // Readiness comes from the real checklist, starting at 0 — never a guess.
  assert.equal(created.readiness.percent, 0);
  assert.equal(created.readiness.total, 8);
  assert.equal(created.timeline[0].label, 'Bible study', 'timeline follows the pastor stated workflow');
  assert.equal(created.timeline.at(-1).label, 'Preach');

  const checklist = created.checklist.map((c, i) => ({ ...c, done: i < 4 }));
  const updated = (await h.patch(`/api/sermons/${created.id}`, { checklist }, { token })).body;
  assert.equal(updated.readiness.percent, 50);
  assert.equal(updated.readiness.remaining.length, 4);

  // Intelligence counts real records only.
  const intel = (await h.get(`/api/sermons/${created.id}/intelligence`, { token })).body;
  assert.equal(intel.counts.bibleReferences, 1);
  assert.equal(intel.counts.mainPoints, 0);
  assert.ok(intel.observations.some((o) => /introduction/.test(o.text)));
  assert.ok(intel.observations.every((o) => o.source), 'every observation cites a source');

  // Body sections, then version history.
  await h.patch(`/api/sermons/${created.id}`, {
    body: [
      { id: '1', kind: 'introduction', text: 'Opening', author: 'user' },
      { id: '2', kind: 'point', text: 'Perseverance', author: 'user' },
      { id: '3', kind: 'application', text: 'Apply', author: 'ai' },
    ],
  }, { token });
  const versions = (await h.get(`/api/sermons/${created.id}/versions`, { token })).body;
  assert.ok(versions.length >= 2, 'content changes are snapshotted');

  const intel2 = (await h.get(`/api/sermons/${created.id}/intelligence`, { token })).body;
  assert.equal(intel2.counts.mainPoints, 1);
  assert.equal(intel2.counts.applications, 1);

  // Relationship map uses only real links.
  await h.post('/api/notes', { title: 'Research note', linkedType: 'sermon', linkedId: created.id }, { token });
  const map = (await h.get(`/api/sermons/${created.id}/map`, { token })).body;
  assert.ok(map.edges.some((e) => e.label === 'note'));
  assert.ok(map.edges.some((e) => e.label === 'passage'));

  // Delete returns an undo snapshot and restore works.
  const deleted = (await h.del(`/api/sermons/${created.id}`, undefined, { token })).body;
  assert.equal(deleted.deleted, true);
  assert.equal((await h.get(`/api/sermons/${created.id}`, { token })).status, 404);
  const restored = (await h.post('/api/sermons/restore', { snapshot: deleted.undoSnapshot }, { token })).body;
  assert.equal(restored.title, 'Faith in Trials');
  assert.equal(restored.readiness.percent, 50);
});

test('sermon validation and series', async (t) => {
  const h = harness(); t.after(() => h.close());
  const token = await h.signUp('s2@church.org');
  assert.equal((await h.post('/api/sermons', {}, { token })).status, 400);

  const series = (await h.post('/api/series', { title: 'Faith in Difficult Seasons' }, { token })).body;
  await h.post('/api/sermons', { title: 'Week 1', seriesId: series.id }, { token });
  await h.post('/api/sermons', { title: 'Week 2', seriesId: series.id }, { token });
  const list = (await h.get('/api/series', { token })).body;
  assert.equal(list[0].sermons.length, 2);

  const s = (await h.post('/api/sermons', { title: 'Bad status test' }, { token })).body;
  assert.equal((await h.patch(`/api/sermons/${s.id}`, { status: 'NONSENSE' }, { token })).status, 400);
  assert.equal((await h.patch(`/api/sermons/${s.id}`, { status: 'READY' }, { token })).body.status, 'READY');
});
