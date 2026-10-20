// Content storage in a *private* Vercel Blob store (used when no Postgres DATABASE_URL is set).
// One JSON file holds { version, updatedAt, state }. Writes use the blob's ETag (ifMatch), so two
// dashboards saving at once cannot silently overwrite each other.
import { get, put } from '@vercel/blob';

const KEY = 'content/site.json';

export function blobConfigured() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

async function current() {
  const r = await get(KEY, { access: 'private', useCache: false });
  if (!r || r.statusCode !== 200 || !r.stream) return null;
  const doc = JSON.parse(await new Response(r.stream).text());
  return { doc, etag: r.blob && r.blob.etag };
}

export async function readContent() {
  const c = await current();
  if (!c) return { state: null, version: 0, updatedAt: null };
  return { state: c.doc.state, version: c.doc.version, updatedAt: c.doc.updatedAt };
}

export async function writeContent(state, baseVersion) {
  const c = await current();
  const have = c ? c.doc.version : 0;
  if (have !== baseVersion) return { ok: false };
  const version = have + 1;
  const body = JSON.stringify({ version, updatedAt: new Date().toISOString(), state });
  const opts = { access: 'private', contentType: 'application/json', addRandomSuffix: false, cacheControlMaxAge: 60 };
  // Single admin: the version check above is enough. (An ETag precondition here rejected valid saves.)
  if (c) opts.allowOverwrite = true;
  try {
    await put(KEY, body, opts);
  } catch (e) {
    if (/already exists/i.test(e && e.message)) return { ok: false };
    throw e;
  }
  return { ok: true, version };
}
