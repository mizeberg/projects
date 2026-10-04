import { randomUUID, randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';

export const uid = () => randomUUID();
export const now = () => new Date().toISOString();

export const json = (value, fallback) => {
  try { const v = JSON.parse(value); return v ?? fallback; } catch { return fallback; }
};

/* ---------------- passwords ---------------- */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`;
}
export function verifyPassword(password, stored) {
  const [scheme, salt, hash] = String(stored).split('$');
  if (scheme !== 'scrypt' || !salt || !hash) return false;
  const a = Buffer.from(hash, 'hex');
  const b = scryptSync(password, salt, a.length);
  return a.length === b.length && timingSafeEqual(a, b);
}

/* ---------------- tokens (HS256 JWT) ---------------- */
const b64 = (buf) => Buffer.from(buf).toString('base64url');
const DEV_SECRET = 'john-ai-dev-secret-change-me';

/**
 * Token signing key.
 *
 * In production a missing JOHN_JWT_SECRET is fatal rather than silently falling
 * back to a value that is published in this repository: with the dev key an
 * attacker could mint a token for any pastor's account and read their sermons,
 * prayer requests and finances.
 */
const secret = () => {
  const configured = process.env.JOHN_JWT_SECRET;
  if (configured && configured !== DEV_SECRET) return configured;
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'JOHN_JWT_SECRET must be set to a private value in production. ' +
        'Refusing to sign tokens with the public development key.',
    );
  }
  return DEV_SECRET;
};

export function signToken(payload, ttlSeconds = 60 * 60 * 24 * 30) {
  const header = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + ttlSeconds }));
  const sig = createHmac('sha256', secret()).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  const parts = String(token ?? '').split('.');
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const expected = createHmac('sha256', secret()).update(`${header}.${body}`).digest('base64url');
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const claims = json(Buffer.from(body, 'base64url').toString('utf8'), null);
  if (!claims || claims.exp * 1000 < Date.now()) return null;
  return claims;
}

/* ---------------- http helpers ---------------- */
export class HttpError extends Error {
  constructor(status, code, message) { super(message ?? code); this.status = status; this.code = code; }
}
export const badRequest = (m) => new HttpError(400, 'bad_request', m);
export const unauthorized = (m = 'Sign in to continue.') => new HttpError(401, 'unauthorized', m);
export const forbidden = (m = 'You do not have permission to do that.') => new HttpError(403, 'forbidden', m);
export const notFound = (m = 'Not found.') => new HttpError(404, 'not_found', m);

export const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function requireFields(body, fields) {
  for (const f of fields) {
    if (body?.[f] === undefined || body?.[f] === null || body?.[f] === '') {
      throw badRequest(`"${f}" is required.`);
    }
  }
}

/* ---------------- dates ---------------- */
export function dayBounds(isoDate, offsetDays = 0) {
  const d = isoDate ? new Date(isoDate) : new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  const start = new Date(d);
  const end = new Date(d);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
