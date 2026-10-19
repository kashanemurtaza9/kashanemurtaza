import crypto from 'node:crypto';

export const COOKIE = 'pf_admin';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function authConfigured() {
  return !!(process.env.ADMIN_PASSWORD_HASH && process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32);
}

/** Hash format: scrypt$N$r$p$saltBase64$hashBase64 (made by `npm run hash-password`). */
export function verifyPassword(password) {
  const stored = process.env.ADMIN_PASSWORD_HASH || '';
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  try {
    const expected = Buffer.from(hashB64, 'base64');
    const got = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64'), expected.length, { N: +N, r: +r, p: +p, maxmem: 256 * 1024 * 1024 });
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  } catch (e) { return false; }
}

function sign(payload) {
  return crypto.createHmac('sha256', process.env.SESSION_SECRET).update(payload).digest('base64url');
}

export function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + MAX_AGE, n: crypto.randomBytes(8).toString('hex') })).toString('base64url');
  return payload + '.' + sign(payload);
}

function parseCookies(req) {
  const out = {};
  String(req.headers.cookie || '').split(';').forEach((c) => {
    const i = c.indexOf('=');
    if (i > 0) out[c.slice(0, i).trim()] = decodeURIComponent(c.slice(i + 1).trim());
  });
  return out;
}

export function isAuthenticated(req) {
  if (!authConfigured()) return false;
  const tok = parseCookies(req)[COOKIE];
  if (!tok) return false;
  const [payload, sig] = tok.split('.');
  if (!payload || !sig) return false;
  const good = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(good);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try { return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now() / 1000; } catch (e) { return false; }
}

function isSecure(req) {
  return (req.headers['x-forwarded-proto'] || '').split(',')[0] === 'https' || process.env.NODE_ENV === 'production' && !/^localhost|^127\./.test(req.headers.host || '');
}

export function setSessionCookie(req, res, token) {
  res.setHeader('Set-Cookie', `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${MAX_AGE}${isSecure(req) ? '; Secure' : ''}`);
}
export function clearSessionCookie(req, res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${isSecure(req) ? '; Secure' : ''}`);
}

/** Blocks cross-site state-changing requests (defence in depth on top of SameSite=Strict). */
export function sameOrigin(req) {
  const o = req.headers.origin;
  if (!o) return true;
  try { return new URL(o).host === req.headers.host; } catch (e) { return false; }
}

/** Naive per-instance throttle for login attempts. See README: add Vercel WAF rate limiting for real protection. */
const fails = new Map();
export function throttled(ip) {
  const f = fails.get(ip);
  return !!f && f.count >= 8 && Date.now() - f.last < 15 * 60 * 1000;
}
export function noteFail(ip) {
  const f = fails.get(ip) || { count: 0, last: 0 };
  f.count += 1; f.last = Date.now(); fails.set(ip, f);
}
export function clearFails(ip) { fails.delete(ip); }

export function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}
