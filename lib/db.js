// Picks the content store: Postgres when DATABASE_URL/POSTGRES_URL is set, otherwise a private Vercel Blob store
// (BLOB_READ_WRITE_TOKEN, added automatically when a Blob store is connected to the project).
import * as pgStore from './pg-store.js';
import * as blobStore from './blob-store.js';

function store() {
  if (pgStore.pgConfigured()) return pgStore;
  if (blobStore.blobConfigured()) return blobStore;
  return null;
}

export function dbConfigured() { return !!store(); }
export function storageKind() { return pgStore.pgConfigured() ? 'postgres' : blobStore.blobConfigured() ? 'blob' : 'none'; }
export function readContent() { return store().readContent(); }
export function writeContent(state, baseVersion) { return store().writeContent(state, baseVersion); }
