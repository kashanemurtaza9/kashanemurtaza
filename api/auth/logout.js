import { clearSessionCookie, sameOrigin } from '../../lib/auth.js';
import { send } from '../../lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return send(res, 405, { code: 'method_not_allowed' }); }
  if (!sameOrigin(req)) return send(res, 403, { code: 'forbidden' });
  clearSessionCookie(req, res);
  return send(res, 200, { ok: true });
}
