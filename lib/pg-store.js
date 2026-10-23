import pg from 'pg';
import * as blobStore from './blob-store.js';

let pool;

export function pgConfigured() {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_URL);
}

// Supabase signs its database certificates with its own root CA, published at this official address.
const SUPABASE_CA_URL = 'https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt';

async function caFor(url) {
  const set = (process.env.PG_CA_CERT || '').replace(/\\n/g, '\n').trim();
  if (set) return set;
  if (!/supabase\.(co|com)/.test(url)) return null; // other providers use public CAs that Node already trusts
  const r = await fetch(SUPABASE_CA_URL);
  if (!r.ok) throw new Error('could not fetch the Supabase CA (' + r.status + ')');
  const pem = (await r.text()).trim();
  if (!/BEGIN CERTIFICATE/.test(pem)) throw new Error('unexpected Supabase CA content');
  return pem;
}

async function getPool() {
  if (!pool) {
    const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    if (!url) throw Object.assign(new Error('DATABASE_URL is not set'), { code: 'db_not_configured' });
    // One connection per serverless instance. Use your provider's pooled connection string.
    // Hosted Postgres is reached over verified TLS (with the provider's CA when it uses its own). Local URLs stay plain.
    // sslmode is dropped from the URL because it would override the ssl settings below.
    const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
    const connectionString = url.replace(/([?&])sslmode=[^&]*&?/, '$1').replace(/[?&]$/, '');
    const ca = local ? null : await caFor(url);
    const p = new pg.Pool({ connectionString, ssl: local ? false : (ca ? { ca } : true), max: 1, idleTimeoutMillis: 10000, connectionTimeoutMillis: 8000 });
    p.on('error', () => {});
    if (!pool) pool = p;
  }
  return pool;
}

let ensured = false;
async function ensure() {
  if (ensured) return;
  await (await getPool()).query(`CREATE TABLE IF NOT EXISTS site_content (
    id text PRIMARY KEY, data jsonb NOT NULL, version integer NOT NULL DEFAULT 1, updated_at timestamptz NOT NULL DEFAULT now())`);
  // Row level security with no policies: Supabase's public API (anon/authenticated keys) can't read or change the
  // content; the site's server connects as the table owner, which isn't subject to these rules.
  await (await getPool()).query('ALTER TABLE site_content ENABLE ROW LEVEL SECURITY');
  ensured = true;
}

/** Returns { state, version, updatedAt } or { state: null, version: 0 } when nothing has been published yet. */
export async function readContent() {
  await ensure();
  const r = await (await getPool()).query("SELECT data, version, updated_at FROM site_content WHERE id = 'main'");
  if (!r.rows.length) {
    // First run on a new database: copy the content published so far (in the Vercel Blob store) so nothing is lost.
    if (blobStore.blobConfigured()) {
      try {
        const old = await blobStore.readContent();
        if (old && old.state) {
          await (await getPool()).query("INSERT INTO site_content (id, data, version) VALUES ('main', $1::jsonb, 1) ON CONFLICT (id) DO NOTHING", [JSON.stringify(old.state)]);
          const again = await (await getPool()).query("SELECT data, version, updated_at FROM site_content WHERE id = 'main'");
          if (again.rows.length) return { state: again.rows[0].data, version: again.rows[0].version, updatedAt: again.rows[0].updated_at };
        }
      } catch (e) { console.error('pg: copy from blob failed', e && e.message); }
    }
    return { state: null, version: 0, updatedAt: null };
  }
  return { state: r.rows[0].data, version: r.rows[0].version, updatedAt: r.rows[0].updated_at };
}

/**
 * Saves the content if `baseVersion` still matches the stored version.
 * Returns { ok: true, version } or { ok: false } on a version conflict.
 */
export async function writeContent(state, baseVersion) {
  await ensure();
  const p = await getPool();
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
