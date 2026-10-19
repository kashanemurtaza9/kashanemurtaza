import { authConfigured, verifyPassword, makeToken, setSessionCookie, sameOrigin, throttled, noteFail, clearFails, clientIp } from '../../lib/auth.js';
import { send, readJson } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { code: 'method_not_allowed' }); }
  if (!sameOrigin(req)) return send(res, 403, { code: 'forbidden' });
  if (!authConfigured()) return send(res, 503, { code: 'auth_not_configured' });
  const ip = clientIp(req);
  if (throttled(ip)) return send(res, 429, { code: 'rate_limited' });
  let body;
  try { body = await readJson(req, 10 * 1024); } catch (e) { return send(res, 400, { code: 'bad_json' }); }
  const ok = !!(body && typeof body.password === 'string' && body.password.length < 512 && verifyPassword(body.password));
  if (!ok) {
    noteFail(ip);
    await new Promise((r) => setTimeout(r, 500));
    return send(res, 401, { code: 'invalid_credentials' });
  }
  clearFails(ip);
  setSessionCookie(req, res, makeToken());
  return send(res, 200, { ok: true });
}
