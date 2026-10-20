// Case study pages: /work (list) and /work/<slug> (one project), rendered as plain HTML from the live content
// so search engines get one indexable page per project. Content edits in the dashboard show up here automatically.
import { readContent, dbConfigured } from '../lib/db.js';
import { slugify } from '../lib/slug.js';

const SITE = 'https://kashanemurtaza-portfolio.vercel.app';
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const okUrl = (u) => /^https:\/\/[^\s"'<>]+$/.test(u || '') || /^\/media\/[\w./-]+$/.test(u || '');
const abs = (u) => (u && u.startsWith('/') ? SITE + u : u);

async function loadState(req) {
  if (dbConfigured()) {
    try { const r = await readContent(); if (r && r.state) return r.state; } catch (e) { console.error('work: read failed', e && e.message); }
  }
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = /^(localhost|127\.0\.0\.1)(:|$)/.test(host || '') ? 'http' : 'https';
  const r = await fetch(proto + '://' + host + '/seed-content.json');
  return r.ok ? r.json() : null;
}

const CSS = `
:root{--bg:#050806;--bg2:#0d1310;--fg:#efe6d2;--muted:#a7ab9d;--line:rgba(239,230,210,.15);--accent:#1fb980;--hi:#3ddc97}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 "Inter",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
a{color:var(--hi)}img,video{max-width:100%;display:block}
.wrap{max-width:1040px;margin:0 auto;padding:0 16px}
header{border-bottom:1px solid var(--line)}header .wrap{display:flex;justify-content:space-between;align-items:center;min-height:60px;gap:16px}
.brand{color:var(--fg);text-decoration:none;font-weight:700;letter-spacing:.01em}.nav{display:flex;gap:24px;flex-wrap:wrap}.nav a{color:var(--muted);text-decoration:none;font-size:14px}.nav a:hover{color:var(--fg)}
.eyebrow{color:var(--muted);text-transform:uppercase;letter-spacing:.14em;font-size:12px;margin:48px 0 8px}
h1{font-size:clamp(34px,6vw,64px);line-height:1.05;letter-spacing:-.03em;margin:0 0 16px;font-weight:700}h1 em{color:var(--hi);font-style:italic;font-weight:500}
h2{font-size:22px;margin:40px 0 12px;letter-spacing:-.01em}
.lede{font-size:clamp(18px,2.2vw,21px);color:var(--fg);max-width:760px}
.media{margin:32px 0;border:1px solid var(--line);background:var(--bg2);aspect-ratio:16/9;overflow:hidden}.media video,.media img{width:100%;height:100%;object-fit:cover}
.grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr);gap:40px}@media(max-width:760px){.grid{grid-template-columns:1fr;gap:8px}}
.body p{color:var(--muted);margin:0 0 16px}
dl{margin:0;border-top:1px solid var(--line)}dl div{display:flex;justify-content:space-between;gap:16px;padding:12px 0;border-bottom:1px solid var(--line)}dt{color:var(--muted);font-size:13px}dd{margin:0;text-align:right;font-size:14px}
.tags{display:flex;flex-wrap:wrap;gap:8px;margin:20px 0}.tag{border:1px solid var(--line);padding:4px 10px;font-size:12px;color:var(--muted)}
.btn{display:inline-flex;align-items:center;gap:8px;min-height:46px;padding:0 20px;border:1.5px solid var(--accent);color:var(--hi);text-decoration:none;font-weight:600;font-size:14px}
.btn:hover{background:rgba(31,185,128,.14)}.row{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}
.cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:20px;margin:24px 0 64px}
.card{display:block;border:1px solid var(--line);color:var(--fg);text-decoration:none;background:var(--bg2)}.card:hover{border-color:var(--accent)}
.card img{aspect-ratio:4/3;object-fit:cover;width:100%}.card div{padding:16px}.card h3{margin:0 0 4px;font-size:18px}.card p{margin:0;color:var(--muted);font-size:14px}
.next{border-top:1px solid var(--line);margin-top:56px;padding:32px 0 64px;display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
footer{border-top:1px solid var(--line);color:var(--muted);font-size:13px}footer .wrap{padding:24px 16px}
`;

function shell({ title, desc, canonical, image, ld, body }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="article"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${esc(image || SITE + '/media/og.jpg')}"><meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml"><meta name="theme-color" content="#050806">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,600;0,700;1,500&display=swap">
<style>${CSS}</style><script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script></head>
<body><header><div class="wrap"><a class="brand" href="/">Kashan Murtaza</a><nav class="nav"><a href="/work">Case studies</a><a href="/#about">About me</a><a href="/#experience">Experience</a><a href="/#contact">Contact</a></nav></div></header>
<main class="wrap">${body}</main>
<footer><div class="wrap">Kashan Murtaza · Lahore, Pakistan · <a href="/">kashanemurtaza-portfolio.vercel.app</a></div></footer></body></html>`;
}

function contactRow(p) {
  return `<div class="row">${p.email ? `<a class="btn" href="mailto:${esc(p.email)}">${esc(p.contactButton || 'Email Kashan')} ↗</a>` : ''}`
    + `<a class="btn" href="${esc(okUrl(p.linkedin) ? p.linkedin : 'https://www.linkedin.com/in/kashanemurtaza')}" rel="noopener">LinkedIn ↗</a></div>`;
}

function projectPage(s, x, list) {
  const p = s.profile || {};
  const slug = slugify(x.title);
  const canonical = `${SITE}/work/${slug}`;
  const what = x.role ? `${x.role}` : x.category;
  const title = `${x.title} · ${what} | Kashan Murtaza`;
  const desc = (x.summary || x.details || '').slice(0, 300);
  const cover = okUrl(x.cover) ? abs(x.cover) : '';
  const media = okUrl(x.video)
    ? `<video src="${esc(abs(x.video))}#t=0.1" controls muted playsinline preload="metadata"${cover ? ` poster="${esc(cover)}"` : ''}></video>`
    : cover ? `<img src="${esc(cover)}" alt="${esc(x.title)}" width="1200" height="675">` : '';
  const paras = String(x.details || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
  const i = list.indexOf(x), nx = list[(i + 1) % list.length];
  const ld = {
    '@context': 'https://schema.org', '@graph': [
      { '@type': 'CreativeWork', name: x.title, description: desc, url: canonical, image: cover || undefined, genre: x.category,
        keywords: (x.tags || []).join(', '), author: { '@type': 'Person', name: p.fullName || 'Kashan Murtaza', url: SITE } },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Case studies', item: SITE + '/work' },
        { '@type': 'ListItem', position: 3, name: x.title, item: canonical }] },
    ],
  };
  const body = `<p class="eyebrow">Case study · ${esc(x.category)}</p>
<h1>${esc(x.title)}${x.role ? `<br><em>${esc(x.role)}</em>` : ''}</h1>
${x.summary ? `<p class="lede">${esc(x.summary)}</p>` : ''}
${media ? `<div class="media">${media}</div>` : ''}
<div class="grid"><div class="body"><h2>What I did</h2>${paras.map((t) => `<p>${esc(t)}</p>`).join('') || `<p>${esc(x.summary)}</p>`}
${x.tags && x.tags.length ? `<h2>Skills used</h2><div class="tags">${x.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}</div>
<aside><dl>${x.role ? `<div><dt>Role</dt><dd>${esc(x.role)}</dd></div>` : ''}${x.year ? `<div><dt>Period</dt><dd>${esc(x.year)}</dd></div>` : ''}<div><dt>Area</dt><dd>${esc(x.category)}</dd></div><div><dt>Location</dt><dd>${esc(p.location || 'Lahore, Pakistan')}</dd></div></dl>
${okUrl(x.url) && /^https:/.test(x.url) ? `<div class="row"><a class="btn" href="${esc(x.url)}" target="_blank" rel="noopener noreferrer">Visit website ↗</a></div>` : ''}</aside></div>
<h2>Working on something similar?</h2><p class="lede" style="color:var(--muted)">${esc(p.contactText || "Let's discuss how I can help.")}</p>${contactRow(p)}
<div class="next"><a href="/work">← All case studies</a>${nx && nx !== x ? `<a href="/work/${slugify(nx.title)}">Next: ${esc(nx.title)} →</a>` : ''}</div>`;
  return shell({ title, desc, canonical, image: cover, ld, body });
}

function indexPage(s, list) {
  const p = s.profile || {};
  const canonical = SITE + '/work';
  const title = 'Case studies · Operations, Digital Marketing and AI Video | Kashan Murtaza';
  const desc = 'Case studies by Kashan Murtaza: e-commerce operations, digital marketing, product research and AI video production for brands in Pakistan.';
  const ld = { '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url: canonical, description: desc,
    hasPart: list.map((x) => ({ '@type': 'CreativeWork', name: x.title, url: `${SITE}/work/${slugify(x.title)}` })) };
  const body = `<p class="eyebrow">Case studies</p><h1>Selected <em>work</em></h1>
<p class="lede">${esc(p.intro || '')}</p>
<div class="cards">${list.map((x) => `<a class="card" href="/work/${slugify(x.title)}">${okUrl(x.cover) ? `<img src="${esc(x.cover)}" alt="${esc(x.title)}" loading="lazy" width="800" height="600">` : ''}<div><h3>${esc(x.title)}</h3><p>${esc([x.role || x.category, x.year].filter(Boolean).join(' · '))}</p></div></a>`).join('')}</div>`;
  return shell({ title, desc, canonical, image: '', ld, body });
}

export default async function handler(req, res) {
  try {
    const s = await loadState(req);
    const list = ((s && s.projects) || []).filter((x) => x.status === 'published');
    const slug = String((req.query && req.query.slug) || '').toLowerCase();
    let html, status = 200;
    if (!slug) html = indexPage(s || {}, list);
    else {
      const x = list.find((y) => slugify(y.title) === slug);
      if (x) html = projectPage(s, x, list);
      else { status = 404; html = shell({ title: 'Not found | Kashan Murtaza', desc: '', canonical: SITE + '/work', image: '', ld: {}, body: '<h1>Not found</h1><p><a href="/work">See all case studies</a></p>' }); }
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    if (status === 404) res.setHeader('X-Robots-Tag', 'noindex');
    res.end(html);
  } catch (e) {
    console.error('work page error', e && e.message);
    res.statusCode = 500; res.setHeader('Content-Type', 'text/plain'); res.end('Server error');
  }
}
