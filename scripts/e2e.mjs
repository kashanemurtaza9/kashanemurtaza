// API end-to-end test. Needs a real Postgres: DATABASE_URL=... ADMIN_TEST_PASSWORD=... npm test
// (starts the local dev server itself with a throwaway admin password and session secret).
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';

const PW = process.env.ADMIN_TEST_PASSWORD || 'test-password-123456';
const salt = crypto.randomBytes(16);
const hash = ['scrypt', 16384, 8, 1, salt.toString('base64'), crypto.scryptSync(PW, salt, 64, { N: 16384, r: 8, p: 1 }).toString('base64')].join('$');
const PORT = 3111, B = 'http://localhost:' + PORT;
const srv = spawn(process.execPath, ['scripts/dev-server.mjs'], { env: { ...process.env, PORT: String(PORT), ADMIN_PASSWORD_HASH: hash, SESSION_SECRET: crypto.randomBytes(32).toString('hex') }, stdio: 'inherit' });
await new Promise((r) => setTimeout(r, 1200));

let pass = 0, fail = 0;
const t = (name, ok, extra) => { (ok ? pass++ : fail++); console.log((ok ? 'PASS ' : 'FAIL ') + name + (ok ? '' : '  -> ' + JSON.stringify(extra))); };
const j = async (method, path, body, cookie, headers = {}) => {
  const r = await fetch(B + path, { method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}), ...headers }, body: body !== undefined ? JSON.stringify(body) : undefined, redirect: 'manual' });
  let data = null; try { data = await r.json(); } catch (e) {}
  return { status: r.status, data, setCookie: r.headers.get('set-cookie') };
};

try {
  const seed = JSON.parse(readFileSync('public/seed-content.json', 'utf8'));

  let r = await j('GET', '/api/auth/me');
  t('me: anonymous is not authenticated', r.status === 200 && r.data.authenticated === false);

  r = await j('PUT', '/api/content', { state: seed, baseVersion: 0 });
  t('PUT content without login is rejected (401)', r.status === 401, r);

  r = await j('POST', '/api/auth/login', { password: 'wrong-password' });
  t('login with wrong password is rejected (401)', r.status === 401 && !r.setCookie, r);

  r = await j('POST', '/api/auth/login', { password: PW }, null, { Origin: 'https://evil.example' });
  t('login from another origin is rejected (403)', r.status === 403, r);

  r = await j('POST', '/api/auth/login', { password: PW });
  const cookie = (r.setCookie || '').split(';')[0];
  t('login with correct password sets an HttpOnly SameSite=Strict cookie', r.status === 200 && /HttpOnly/i.test(r.setCookie) && /SameSite=Strict/i.test(r.setCookie), r);

  r = await j('GET', '/api/auth/me', undefined, cookie);
  t('me: authenticated with cookie, reports database status', r.data.authenticated === true && r.data.dbConfigured === true, r);

  r = await j('GET', '/api/auth/me', undefined, cookie.slice(0, -3) + 'xxx');
  t('me: tampered cookie is not authenticated', r.data.authenticated === false, r);

  r = await j('GET', '/api/content');
  const v0 = r.data.version;
  t('GET content is public and returns a version', r.status === 200 && typeof v0 === 'number', r);

  const edited = JSON.parse(JSON.stringify(seed));
  edited.projects[0].title = 'E2E edited title';
  r = await j('PUT', '/api/content', { state: edited, baseVersion: v0 }, cookie);
  t('PUT content with login saves and bumps the version', r.status === 200 && r.data.version === v0 + 1, r);
  const v1 = r.data.version;

  r = await j('GET', '/api/content');
  t('public GET returns the edited content (dashboard and site share the same data)', r.data.state.projects[0].title === 'E2E edited title' && r.data.version === v1, r.data && r.data.version);

  r = await j('PUT', '/api/content', { state: edited, baseVersion: v0 }, cookie);
  t('stale baseVersion is rejected with 409 conflict', r.status === 409 && r.data.code === 'conflict', r);

  const bad = JSON.parse(JSON.stringify(seed)); bad.projects[0].video = 'javascript:alert(1)';
  r = await j('PUT', '/api/content', { state: bad, baseVersion: v1 }, cookie);
  t('invalid video URL is rejected (422)', r.status === 422, r);

  const bad2 = JSON.parse(JSON.stringify(seed)); bad2.projects[0].category = 'Nonsense';
  r = await j('PUT', '/api/content', { state: bad2, baseVersion: v1 }, cookie);
  t('unknown category is rejected (422)', r.status === 422, r);

  r = await j('PUT', '/api/content', { state: seed, baseVersion: v1 }, cookie);
  t('restoring the seed content works', r.status === 200, r);

  r = await j('POST', '/api/auth/logout', {}, cookie);
  t('logout clears the cookie', r.status === 200 && /Max-Age=0/i.test(r.setCookie || ''), r);
} catch (e) { fail++; console.error('ERROR', e); }
srv.kill();
console.log('\n' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
