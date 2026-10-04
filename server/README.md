# John AI — server

Express + SQLite (`node:sqlite`). No AI provider key ever reaches the client; all model
access would happen here, behind authentication.

## Layout

```
src/
  db.js               schema — every record carries ownership metadata
  core.js             ids, scrypt passwords, HS256 tokens, http errors, date windows
  permissions.js      roles -> granular permission flags (permissions are the source of truth)
  domain/index.js     the ONE domain layer: all ministry rules live here
  ai/tools.js         tool registry — thin wrappers over the same domain functions
  ai/agent.js         intent -> context -> authorization -> tool -> confirmation
  app.js              HTTP surface
test/                 auth, isolation, sermons, pulse, ai
```

The UI, the command palette and the agent all call `domain/index.js`. There is no second
copy of the business logic for the AI to use.

## Guarantees under test

- `isolation.test.js` — Pastor A cannot read, write, delete, search or ask John about
  Pastor B's records; unauthorized ids return `404`
- `ai.test.js` — writes always return a confirmation card first; `/ai/execute` refuses
  without `confirm: true`; context never pulls in unrelated entities; memory can be
  disabled and cleared; John declines to answer beyond stored data
- `pulse.test.js` — an empty account produces an empty pulse and a `null` task
  percentage; every pulse item carries a rule, sources and a route
- `sermons.test.js` — readiness tracks the checklist, the timeline follows the stated
  workflow, content changes snapshot a version, delete returns an undo snapshot

## Environment

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `8787` | listen port |
| `JOHN_DB` | `data/john.db` | SQLite file (`:memory:` in tests) |
| `JOHN_JWT_SECRET` | dev value | **must** be set in production |
