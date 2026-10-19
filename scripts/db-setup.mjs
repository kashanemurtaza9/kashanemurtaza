// Creates the table and, if nothing is stored yet, loads public/seed-content.json (the site content as exported).
import pg from 'pg';
import { readFileSync } from 'node:fs';
import './load-env.mjs';

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) { console.error('Set DATABASE_URL first (see .env.example).'); process.exit(1); }
const c = new pg.Client({ connectionString: url });
await c.connect();
await c.query(readFileSync('db/001_init.sql', 'utf8'));
const r = await c.query("SELECT version FROM site_content WHERE id = 'main'");
if (r.rows.length) console.log('Table ready. Content already stored (version ' + r.rows[0].version + '), left unchanged.');
else {
  await c.query("INSERT INTO site_content (id, data, version) VALUES ('main', $1::jsonb, 1)", [readFileSync('public/seed-content.json', 'utf8')]);
  console.log('Table ready. Seeded with the exported site content (version 1).');
}
await c.end();
