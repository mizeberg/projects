/**
 * John AI agent.
 *
 * USER INPUT -> INTENT -> CONTEXT -> AUTHORIZATION -> TOOL -> ACTION/RESPONSE -> CONFIRMATION
 *
 * Design rules enforced here:
 *  - Write/destructive tools never execute without an explicit confirmation step.
 *  - Only the minimum authorized context is collected for a request.
 *  - When no language model is configured, John answers from stored records only
 *    and says plainly that it cannot answer open-ended questions — it never invents.
 */
import { uid, now } from '../core.js';
import * as D from '../domain/index.js';
import { TOOL_MAP } from './tools.js';

/* ---------------- intent detection (deterministic, auditable) ---------------- */
const INTENTS = [
  { tool: 'readToday', test: /\b(today|what('s| is) (on|next)|my day|schedule)\b/i },
  { tool: 'readDashboard', test: /\b(pulse|needs my attention|what matters)\b/i },
  { tool: 'readTasks', test: /\b(tasks?|to-?dos?|overdue)\b/i },
  { tool: 'readPrayerRequests', test: /\b(prayer|follow[- ]?ups?)\b/i },
  { tool: 'readSermons', test: /\b(sermons?|preach(ing)? list|drafts?)\b/i },
  { tool: 'readProgress', test: /\b(progress|how am i doing|ministry stats)\b/i },
  { tool: 'readWorkload', test: /\b(workload|busiest|how busy)\b/i },
  { tool: 'readInbox', test: /\b(inbox|action required)\b/i },
  { tool: 'readEvents', test: /\b(events?|upcoming events)\b/i },
];

const CREATE_PATTERNS = [
  { tool: 'createTask', test: /\b(remind me to|create a task|add a task|new task)\b/i, titleFrom: /(?:remind me to|create a task(?: to)?|add a task(?: to)?|new task(?::)?)\s+(.*)/i },
  { tool: 'captureIdea', test: /\b(capture (this )?idea|save this thought|note this idea)\b/i, titleFrom: /(?:capture (?:this )?idea|save this thought|note this idea)[:\s]+(.*)/i },
  { tool: 'createNote', test: /\b(create a note|new note|write a note)\b/i, titleFrom: /(?:create a note(?: about)?|new note(?::)?|write a note(?: about)?)\s+(.*)/i },
  { tool: 'createPrayerRequest', test: /\b(new prayer request|add prayer request)\b/i, titleFrom: /(?:new prayer request|add prayer request)(?: for)?\s+(.*)/i },
];

// "Open" / "take me to" is navigation. "Show" is a read query, handled by INTENTS,
// because a pastor asking "show my tasks" wants the answer, not a screen change.
const OPEN_PATTERNS = [
  { route: 'sermons', test: /\b(open|take me to|go to) (my )?sermons?\b/i },
  { route: 'prayer', test: /\b(open|take me to|go to) (my )?prayer\b/i },
  { route: 'tasks', test: /\b(open|take me to|go to) (my )?tasks?\b/i },
  { route: 'calendar', test: /\b(open|take me to|go to) (my )?calendar\b/i },
  { route: 'events', test: /\b(open|take me to|go to) (my )?events?\b/i },
  { route: 'progress', test: /\b(open|take me to|go to) (my )?progress\b/i },
];

/* ---------------- natural-language date parsing (conservative) ---------------- */
export function parseWhen(text, base = new Date()) {
  const t = text.toLowerCase();
  const d = new Date(base);
  let matched = false;
  if (/\btomorrow\b/.test(t)) { d.setDate(d.getDate() + 1); matched = true; }
  else if (/\btoday\b|\btonight\b/.test(t)) { matched = true; }
  else {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const m = t.match(/\b(?:next |this )?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);
    if (m) {
      const target = days.indexOf(m[1]);
      let delta = (target - d.getDay() + 7) % 7;
      if (delta === 0) delta = 7;
      d.setDate(d.getDate() + delta);
      matched = true;
    }
  }
  const time = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  if (time) {
    let h = Number(time[1]) % 12;
    if (time[3] === 'pm') h += 12;
    d.setHours(h, Number(time[2] ?? 0), 0, 0);
    matched = true;
  } else if (matched) {
    d.setHours(9, 0, 0, 0);
  }
  return matched ? d.toISOString() : null;
}

/* ---------------- context collection (minimum necessary) ---------------- */
export function collectContext(ctx, { screen, entityType, entityId } = {}) {
  const used = [];
  const data = {};
  const profile = ctx.profile;
  if (profile) {
    used.push({ type: 'profile', id: ctx.user.id, title: 'Your personalization settings' });
    data.profile = {
      preferredName: profile.preferredName, role: profile.role,
      bibleTranslations: profile.bibleTranslations, sermonWorkflow: profile.sermonWorkflow,
      aiTone: profile.aiTone, aiResponseLength: profile.aiResponseLength, timeZone: profile.timeZone,
    };
  }
  const memory = D.listMemory(ctx).filter((m) => m.enabled);
  if (memory.length) {
    data.memory = memory.map((m) => m.content);
    used.push({ type: 'memory', id: 'ai_memory', title: `${memory.length} remembered preference(s)` });
  }
  if (entityType === 'sermon' && entityId) {
    const s = D.getSermon(ctx, entityId);
    data.sermon = { id: s.id, title: s.title, status: s.status, passages: s.passages, readiness: s.readiness };
    used.push({ type: 'sermon', id: s.id, title: s.title });
  }
  if (entityType === 'event' && entityId) {
    const e = D.listEvents(ctx).find((x) => x.id === entityId);
    if (e) { data.event = e; used.push({ type: 'event', id: e.id, title: e.name }); }
  }
  if (entityType === 'meeting' && entityId) {
    const m = D.listMeetings(ctx).find((x) => x.id === entityId);
    if (m) { data.meeting = m; used.push({ type: 'meeting', id: m.id, title: m.title }); }
  }
  return { screen: screen ?? null, used, data };
}

/* ---------------- authorization ---------------- */
function authorize(ctx, toolDef) {
  if (!toolDef) return { allowed: false, reason: 'Unknown capability.' };
  if (toolDef.name === 'readEventFinances' || toolDef.name === 'addLedgerEntry') {
    const m = ctx.membership;
    if (m && m.role !== 'owner' && !m.permissions?.canViewFinances) {
      return { allowed: false, reason: 'You do not have permission to access finances.' };
    }
  }
  return { allowed: true };
}

/* ---------------- planning ---------------- */
export function plan(message, context = {}) {
  const text = String(message ?? '').trim();

  for (const p of OPEN_PATTERNS) {
    if (p.test.test(text)) return { kind: 'tool', tool: 'navigateToScreen', args: { route: p.route } };
  }
  for (const c of CREATE_PATTERNS) {
    if (c.test.test(text)) {
      const raw = (text.match(c.titleFrom)?.[1] ?? text).trim().replace(/[.]$/, '');
      const dueAt = parseWhen(text);
      const title = raw.replace(/\b(tomorrow|today|tonight|next week|this week)\b/gi, '')
        .replace(/\bat\s+\d{1,2}(?::\d{2})?\s*(am|pm)\b/gi, '')
        .replace(/\bon\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/gi, '')
        .replace(/\s{2,}/g, ' ').trim();
      if (!title) return { kind: 'clarify', question: 'What should I call it?' };
      if (c.tool === 'captureIdea') return { kind: 'tool', tool: 'captureIdea', args: { text: title } };
      if (c.tool === 'createNote') return { kind: 'tool', tool: 'createNote', args: { title, body: '' } };
      if (c.tool === 'createPrayerRequest') return { kind: 'tool', tool: 'createPrayerRequest', args: { title, person: title } };
      return { kind: 'tool', tool: 'createTask', args: { title, dueAt, category: 'personal' } };
    }
  }
  if (/\b(delete|remove)\b/i.test(text)) {
    return { kind: 'clarify', question: 'Deleting is permanent-ish — tell me exactly which item to delete and I will ask you to confirm.' };
  }
  if (context.entityType === 'sermon' && context.entityId && /\b(incomplete|what('s| is) (left|missing)|how (ready|prepared))\b/i.test(text)) {
    return { kind: 'tool', tool: 'readSermonIntelligence', args: { id: context.entityId } };
  }
  if (context.entityType === 'event' && context.entityId && /\b(spent|budget|balance|collected)\b/i.test(text)) {
    return { kind: 'tool', tool: 'readEventFinances', args: { eventId: context.entityId } };
  }
  if (context.entityType === 'event' && context.entityId && /\b(incomplete|what('s| is) left|remaining)\b/i.test(text)) {
    return { kind: 'tool', tool: 'ministryMap', args: { type: 'event', id: context.entityId } };
  }
  for (const i of INTENTS) if (i.test.test(text)) return { kind: 'tool', tool: i.tool, args: {} };
  if (text) return { kind: 'search', args: { query: text } };
  return { kind: 'clarify', question: 'What would you like help with?' };
}

/* ---------------- answer rendering (grounded in returned records) ---------------- */
function render(toolName, result, planned) {
  const n = (x) => (Array.isArray(x) ? x.length : 0);
  switch (toolName) {
    case 'readToday': {
      if (!result.items.length) return 'Nothing is scheduled for today in John AI.';
      return `Today you have ${result.items.length} item(s):\n` +
        result.items.map((i) => `• ${String(i.at).slice(11, 16)} — ${i.title} (${i.kind})`).join('\n');
    }
    case 'readDashboard':
      return result.length
        ? `Here is what needs your attention:\n${result.map((p) => `• ${p.title} — ${p.subtitle}`).join('\n')}`
        : 'Nothing is flagged for your attention right now.';
    case 'readTasks':
      return n(result) ? `You have ${result.length} task(s):\n${result.map((t) => `• ${t.title}${t.dueAt ? ` — due ${t.dueAt.slice(0, 16).replace('T', ' ')}` : ''}`).join('\n')}` : 'You have no tasks stored.';
    case 'readPrayerRequests':
      return n(result) ? `${result.length} prayer request(s):\n${result.map((p) => `• ${p.title}${p.person ? ` (${p.person})` : ''} — ${p.status}`).join('\n')}` : 'Your prayer list is clear.';
    case 'readSermons':
      return n(result) ? `${result.length} sermon(s):\n${result.map((s) => `• ${s.title} — ${s.status}, ${s.readiness.percent}% prepared`).join('\n')}` : 'You have no sermons yet.';
    case 'readEvents':
      return n(result) ? `${result.length} event(s):\n${result.map((e) => `• ${e.name}${e.startsAt ? ` — ${e.startsAt.slice(0, 10)}` : ''}`).join('\n')}` : 'No events are stored.';
    case 'readSermonIntelligence': {
      const c = result.counts;
      const obs = result.observations.map((o) => `• ${o.text}`).join('\n');
      return `This sermon is ${result.readiness.percent}% through your preparation checklist.\n` +
        `${c.bibleReferences} passage(s), ${c.mainPoints} main point(s), ${c.illustrations} illustration(s), ${c.applications} application(s), ${c.linkedNotes} linked note(s).` +
        (obs ? `\n\nI noticed:\n${obs}` : '');
    }
    case 'readEventFinances':
      return `Collected ${result.totalCollected}, spent ${result.totalSpent}. Balance: ${result.balance}.`;
    case 'readProgress':
      return `Sermons: ${result.sermons.preached} preached of ${result.sermons.total}. ` +
        `Tasks: ${result.tasks.completed}/${result.tasks.total}${result.tasks.percent === null ? '' : ` (${result.tasks.percent}%)`}. ` +
        `Open prayer requests: ${result.prayer.open}. Upcoming events: ${result.events.upcoming}.`;
    case 'readWorkload':
      return result.observation ?? 'There is not enough scheduled this week to show a workload pattern.';
    case 'readInbox':
      return `${result.actions.length} item(s) need action, ${result.information.length} for awareness.`;
    case 'ministryMap':
      return result.edges.length
        ? `${result.root.title} is connected to ${result.edges.length} record(s): ${result.edges.map((e) => `${e.label} — ${e.to.title}`).join('; ')}.`
        : `${result.root.title} has no linked records yet.`;
    case 'navigateToScreen':
      return `Opening ${result.route}.`;
    case 'createTask':
      return `Task created: "${result.title}"${result.dueAt ? ` due ${result.dueAt.slice(0, 16).replace('T', ' ')}` : ''}.`;
    case 'createNote': return `Note created: "${result.title}".`;
    case 'captureIdea': return 'Idea captured.';
    case 'createPrayerRequest': return `Prayer request created: "${result.title}".`;
    case 'createSermon': return `Sermon created: "${result.title}".`;
    case 'createEvent': return `Event created: "${result.name}".`;
    case 'addLedgerEntry': return `Recorded. Balance is now ${result.balance}.`;
    case 'deleteSermon': return 'Sermon deleted. You can undo this.';
    case 'deleteTask': return 'Task deleted. You can undo this.';
    default: return planned?.question ?? 'Done.';
  }
}

/* ---------------- main entry ---------------- */
export function runAgent(ctx, { message, context = {}, confirm = false, forcedTool = null, forcedArgs = null }) {
  const aiContext = collectContext(ctx, context);
  const planned = forcedTool
    ? { kind: 'tool', tool: forcedTool, args: forcedArgs ?? {} }
    : plan(message, context);

  const record = (role, content, sources = []) => {
    ctx.db.prepare('INSERT INTO ai_messages (id,userId,role,content,contextJson,sourcesJson,createdAt) VALUES (?,?,?,?,?,?,?)')
      .run(uid(), ctx.user.id, role, content, JSON.stringify(aiContext.used), JSON.stringify(sources), now());
  };
  if (message) record('user', message);

  if (planned.kind === 'clarify') {
    record('assistant', planned.question);
    return { type: 'clarify', message: planned.question, context: aiContext };
  }

  if (planned.kind === 'search') {
    const results = D.searchAll(ctx, planned.args.query);
    const total = results.groups.reduce((t, g) => t + g.count, 0);
    const text = total
      ? `I found ${total} record(s) matching "${planned.args.query}":\n` +
        results.groups.map((g) => `• ${g.type}: ${g.count}`).join('\n')
      : `I could not find anything in your workspace matching "${planned.args.query}". ` +
        'I only answer from what you have stored, so I will not guess.';
    record('assistant', text, results.groups.flatMap((g) => g.results.map((r) => ({ type: g.type, id: r.id, title: r.title }))));
    return { type: 'answer', message: text, data: results, context: aiContext, sources: results.groups };
  }

  const def = TOOL_MAP[planned.tool];
  const auth = authorize(ctx, def);
  if (!auth.allowed) {
    record('assistant', auth.reason);
    return { type: 'denied', message: auth.reason, context: aiContext };
  }

  const needsConfirmation = (def.mode !== 'read') && (def.confirm || !confirm);
  if (needsConfirmation && !confirm) {
    const card = {
      type: 'action_card',
      tool: def.name,
      mode: def.mode,
      title: def.description,
      args: planned.args,
      confirmLabel: def.mode === 'destructive' ? 'Delete' : 'Create',
    };
    record('assistant', `Confirm: ${def.description}`);
    return { type: 'confirm', card, message: `${def.description} — review and confirm.`, context: aiContext };
  }

  const result = def.run(ctx, planned.args);
  const text = render(def.name, result, planned);
  const sources = aiContext.used;
  record('assistant', text, sources);
  return {
    type: def.name === 'navigateToScreen' ? 'navigate' : 'answer',
    message: text,
    tool: def.name,
    data: result,
    route: def.name === 'navigateToScreen' ? result.route : undefined,
    context: aiContext,
    sources,
  };
}

export const listConversation = (ctx, limit = 50) =>
  ctx.db.prepare('SELECT * FROM ai_messages WHERE userId = ? ORDER BY createdAt DESC LIMIT ?')
    .all(ctx.user.id, limit).reverse()
    .map((m) => ({ ...m, context: JSON.parse(m.contextJson), sources: JSON.parse(m.sourcesJson) }));

export function clearConversation(ctx) {
  ctx.db.prepare('DELETE FROM ai_messages WHERE userId = ?').run(ctx.user.id);
  return { cleared: true };
}

/* Contextual suggestion chips — derived from the screen the pastor is on. */
export function suggestions(ctx, { screen, entityType } = {}) {
  if (entityType === 'sermon') return ["What's still incomplete?", 'Show related notes', 'How prepared is this sermon?'];
  if (entityType === 'event') return ['How much have we spent?', "What's still incomplete?"];
  if (screen === 'prayer') return ['Show prayer follow-ups due this week'];
  if (screen === 'calendar') return ["What do I have today?", 'How busy is this week?'];
  return ['What do I have today?', 'What needs my attention?', 'Show unfinished tasks', 'How is my ministry progressing?'];
}
