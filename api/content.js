import { readContent, writeContent, dbConfigured, storageKind } from '../lib/db.js';
import { isAuthenticated, sameOrigin } from '../lib/auth.js';
import { send, readJson } from '../lib/http.js';
import { validateState } from '../lib/validate.js';
import { migrate } from '../lib/migrate.js';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      if (!dbConfigured()) return send(res, 200, { state: null, version: 0, source: 'none' });
      const r = await readContent();
      if (r.state && migrate(r.state)) {
        try { const w = await writeContent(r.state, r.version); if (w.ok) r.version = w.version; else console.error('migrate write: version conflict'); } catch (e) { console.error('migrate write failed', e && e.message); }
      }
      return send(res, 200, { state: r.state, version: r.version, source: r.state ? storageKind() : 'none' });
    }

    if (req.method === 'PUT') {
      if (!sameOrigin(req)) return send(res, 403, { code: 'forbidden' });
      if (!isAuthenticated(req)) return send(res, 401, { code: 'unauthorized' });
      if (!dbConfigured()) return send(res, 503, { code: 'db_not_configured' });
      let body;
      try { body = await readJson(req); } catch (e) { return send(res, e.code === 'too_large' ? 413 : 400, { code: e.code === 'too_large' ? 'too_large' : 'bad_json' }); }
      const err = validateState(body && body.state);
      if (err) return send(res, 422, { code: 'invalid', message: err });
      const baseVersion = Number.isInteger(body.baseVersion) ? body.baseVersion : -1;
      if (baseVersion < 0) return send(res, 422, { code: 'invalid', message: 'baseVersion is required.' });

      const w = await writeContent(body.state, baseVersion);
      if (!w.ok) return send(res, 409, { code: 'conflict' });

      return send(res, 200, { ok: true, version: w.version });
    }

    res.setHeader('Allow', 'GET, PUT');
    return send(res, 405, { code: 'method_not_allowed' });
  } catch (e) {
    console.error('content api error', e && e.message);
    return send(res, 500, { code: 'server_error' });
  }
}
