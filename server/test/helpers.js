import { createApp } from '../src/app.js';
import { openDb } from '../src/db.js';

export function harness() {
  const app = createApp({ db: openDb(':memory:') });
  const server = app.listen(0);
  const base = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, { token, body } = {}) => {
    const res = await fetch(base + path, {
      method,
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    return { status: res.status, body: text ? JSON.parse(text) : null };
  };
  return {
    close: () => server.close(),
    get: (p, o) => call('GET', p, o),
    post: (p, body, o) => call('POST', p, { ...o, body }),
    patch: (p, body, o) => call('PATCH', p, { ...o, body }),
    del: (p, body, o) => call('DELETE', p, { ...o, body }),
    async signUp(email) {
      const r = await call('POST', '/api/auth/register', { body: { email, password: 'ministry-pass-1', displayName: 'Pastor' } });
      return r.body.token;
    },
  };
}

export const iso = (daysFromNow, hour = 9) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + daysFromNow);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
};
