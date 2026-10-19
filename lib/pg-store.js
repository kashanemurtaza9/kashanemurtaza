import pg from 'pg';

let pool;

export function pgConfigured() {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw Object.assign(new Error('DATABASE_URL is not set'), { code: 'db_not_configured' });
    // One connection per serverless instance. Use your provider's pooled connection string.
    pool = new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000 });
    pool.on('error', () => {});
  }
  return pool;
}

let ensured = false;
async function ensure() {
  if (ensured) return;
  await getPool().query(`CREATE TABLE IF NOT EXISTS site_content (
    id text PRIMARY KEY, data jsonb NOT NULL, version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())`);
  ensured = true;
}

/** Returns { state, version, updatedAt } or { state: null, version: 0 } when nothing has been published yet. */
export async function readContent() {
  await ensure();
  const r = await getPool().query("SELECT data, version, updated_at FROM site_content WHERE id = 'main'");
  if (!r.rows.length) return { state: null, version: 0, updatedAt: null };
  return { state: r.rows[0].data, version: r.rows[0].version, updatedAt: r.rows[0].updated_at };
}

/**
 * Saves the content if `baseVersion` still matches the stored version.
 * Returns { ok: true, version } or { ok: false } on a version conflict.
 */
export async function writeContent(state, baseVersion) {
  await ensure();
  const p = getPool();
  const json = JSON.stringify(state);
  if (baseVersion === 0) {
    const ins = await p.query(
      "INSERT INTO site_content (id, data, version) VALUES ('main', $1::jsonb, 1) ON CONFLICT (id) DO NOTHING RETURNING version", [json]);
    return ins.rows.length ? { ok: true, version: ins.rows[0].version } : { ok: false };
  }
  const upd = await p.query(
    "UPDATE site_content SET data = $1::jsonb, version = version + 1, updated_at = now() WHERE id = 'main' AND version = $2 RETURNING version",
    [json, baseVersion]);
  return upd.rows.length ? { ok: true, version: upd.rows[0].version } : { ok: false };
}
