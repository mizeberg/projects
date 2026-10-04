// John AI — tool registry.
// Tools are thin wrappers over the SAME domain use-cases the UI calls.
// Each tool declares read/write mode and whether it needs explicit confirmation.
import * as D from '../domain/index.js';

const tool = (name, { mode, confirm = false, description, args = [], run }) =>
  ({ name, mode, confirm, description, args, run });

export const TOOLS = [
  /* ---------------- read ---------------- */
  tool('readDashboard', { mode: 'read', description: 'Ministry Pulse for today', run: (ctx) => D.ministryPulse(ctx, {}) }),
  tool('readToday', { mode: 'read', description: "Today's schedule", run: (ctx, a) => D.today(ctx, a) }),
  tool('readCalendar', { mode: 'read', description: 'Upcoming calendar items', run: (ctx) => ({ meetings: D.listMeetings(ctx, { from: new Date().toISOString() }), events: D.listEvents(ctx, { from: new Date().toISOString() }) }) }),
  tool('readTasks', { mode: 'read', description: 'List tasks', args: ['status', 'dueBefore'], run: (ctx, a) => D.listTasks(ctx, a) }),
  tool('readSermons', { mode: 'read', description: 'List sermons', args: ['status', 'query'], run: (ctx, a) => D.listSermons(ctx, a) }),
  tool('readSermon', { mode: 'read', description: 'Open one sermon', args: ['id'], run: (ctx, a) => D.getSermon(ctx, a.id) }),
  tool('readSermonIntelligence', { mode: 'read', description: 'Counts and observations for a sermon', args: ['id'], run: (ctx, a) => D.sermonIntelligence(ctx, a.id) }),
  tool('searchNotes', { mode: 'read', description: 'Search notes', args: ['query'], run: (ctx, a) => D.listNotes(ctx, a) }),
  tool('readPrayerRequests', { mode: 'read', description: 'List prayer requests', args: ['status', 'dueBefore'], run: (ctx, a) => D.listPrayerRequests(ctx, a) }),
  tool('readEvents', { mode: 'read', description: 'List events', args: [], run: (ctx, a) => D.listEvents(ctx, a) }),
  tool('readEventFinances', { mode: 'read', description: 'Event collections, expenses and balance (permission gated)', args: ['eventId'], run: (ctx, a) => D.eventFinances(ctx, a.eventId) }),
  tool('readProgress', { mode: 'read', description: 'Ministry progress from stored records', run: (ctx) => D.progress(ctx) }),
  tool('readWorkload', { mode: 'read', description: 'Workload distribution for the coming week', run: (ctx) => D.workload(ctx) }),
  tool('readInbox', { mode: 'read', description: 'Ministry inbox', run: (ctx) => D.inbox(ctx) }),
  tool('searchAll', { mode: 'read', description: 'Universal search', args: ['query'], run: (ctx, a) => D.searchAll(ctx, a.query) }),
  tool('ministryMap', { mode: 'read', description: 'Relationships for an entity', args: ['type', 'id'], run: (ctx, a) => D.ministryMap(ctx, a.type, a.id) }),

  /* ---------------- write ---------------- */
  tool('createTask', { mode: 'write', description: 'Create a task', args: ['title', 'dueAt', 'category', 'linkedType', 'linkedId'], run: (ctx, a) => D.createTask(ctx, a) }),
  tool('updateTask', { mode: 'write', description: 'Update a task', args: ['id'], run: (ctx, a) => D.updateTask(ctx, a.id, a) }),
  tool('createNote', { mode: 'write', description: 'Create a note', args: ['title', 'body', 'linkedType', 'linkedId'], run: (ctx, a) => D.createNote(ctx, a) }),
  tool('createSermon', { mode: 'write', description: 'Create a sermon', args: ['title', 'preachingDate'], run: (ctx, a) => D.createSermon(ctx, a) }),
  tool('updateSermon', { mode: 'write', confirm: true, description: 'Change sermon content', args: ['id'], run: (ctx, a) => D.updateSermon(ctx, a.id, a) }),
  tool('createPrayerRequest', { mode: 'write', description: 'Create a prayer request', args: ['title', 'person', 'followUpAt'], run: (ctx, a) => D.createPrayerRequest(ctx, a) }),
  tool('updatePrayerRequest', { mode: 'write', description: 'Update a prayer request', args: ['id'], run: (ctx, a) => D.updatePrayerRequest(ctx, a.id, a) }),
  tool('createEvent', { mode: 'write', confirm: true, description: 'Create an event', args: ['name', 'startsAt'], run: (ctx, a) => D.createEvent(ctx, a) }),
  tool('captureIdea', { mode: 'write', description: 'Capture an idea', args: ['text'], run: (ctx, a) => D.captureIdea(ctx, a) }),
  tool('addLedgerEntry', { mode: 'write', confirm: true, description: 'Record a collection or expense', args: ['eventId', 'kind', 'name', 'amount'], run: (ctx, a) => D.addLedgerEntry(ctx, a.eventId, a) }),

  /* ---------------- destructive ---------------- */
  tool('deleteSermon', { mode: 'destructive', confirm: true, description: 'Delete a sermon (undoable)', args: ['id'], run: (ctx, a) => D.deleteSermon(ctx, a.id) }),
  tool('deleteTask', { mode: 'destructive', confirm: true, description: 'Delete a task (undoable)', args: ['id'], run: (ctx, a) => D.deleteTask(ctx, a.id) }),

  /* ---------------- navigation ---------------- */
  tool('navigateToScreen', { mode: 'read', description: 'Open a screen in the app', args: ['route'], run: (_ctx, a) => ({ route: a.route }) }),
];

export const TOOL_MAP = Object.fromEntries(TOOLS.map((t) => [t.name, t]));

export const describeSkills = () => ([
  { id: 'sermon', name: 'Sermon Assistant', tools: ['readSermons', 'readSermon', 'readSermonIntelligence', 'createSermon', 'updateSermon'] },
  { id: 'planning', name: 'Planning Assistant', tools: ['readToday', 'readCalendar', 'createTask', 'readWorkload'] },
  { id: 'prayer', name: 'Prayer Organizer', tools: ['readPrayerRequests', 'createPrayerRequest', 'updatePrayerRequest'] },
  { id: 'events', name: 'Event Assistant', tools: ['readEvents', 'createEvent', 'readEventFinances', 'addLedgerEntry'] },
  { id: 'organizer', name: 'Ministry Organizer', tools: ['readInbox', 'readProgress', 'searchAll', 'ministryMap'] },
  { id: 'notes', name: 'Writing & Notes', tools: ['searchNotes', 'createNote', 'captureIdea'] },
]);
