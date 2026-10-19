// Fails (exit 1) if the site references a file that does not exist in /public.
import { readFileSync, existsSync, statSync } from 'node:fs';

const missing = [];
const seen = new Set();
function need(p, from) {
  if (!p || seen.has(p)) return; seen.add(p);
  const f = 'public' + p.split('?')[0].split('#')[0];
  if (!existsSync(f) || !statSync(f).isFile()) missing.push(p + '   (referenced by ' + from + ')');
}
const seed = JSON.parse(readFileSync('public/seed-content.json', 'utf8'));
const p = seed.profile;
for (const k of ['heroVideo', 'heroPoster', 'photo']) if (p[k] && p[k].startsWith('/')) need(p[k], 'profile.' + k);
for (const x of seed.projects) for (const k of ['video', 'cover']) if (x[k] && x[k].startsWith('/')) need(x[k], 'project "' + x.title + '" ' + k);
for (const f of ['public/index.html', 'public/styles.css', 'public/app.js']) {
  const txt = readFileSync(f, 'utf8');
  for (const m of txt.matchAll(/["'(=]\s*(\/(?:fonts|vendor|media)\/[A-Za-z0-9._\-\/]+)/g)) need(m[1], f);
}
// the five static entry files
for (const f of ['/index.html', '/styles.css', '/app.js', '/seed-content.json']) need(f, 'required');

if (missing.length) { console.error('MISSING FILES:\n' + missing.map((m) => ' - ' + m).join('\n')); process.exit(1); }
console.log('asset check ok: ' + seen.size + ' referenced files exist; ' + seed.projects.length + ' projects in the seed content');
