// Case study pages: /work (all projects) and /work/<slug> (one project), plus /sitemap.xml.
// The pages are the normal site (index.html + app.js, so same nav, cursor, theme and GSAP motion); this function
// only fills in the page title, description, social preview and crawler-readable text for that page, from the live content.
import { readContent, dbConfigured } from '../lib/db.js';
import { slugify } from '../lib/slug.js';

const SITE = 'https://kashanemurtaza-portfolio.vercel.app';
const AUTO_COVERS = { klarity: '/media/img/klarity-cover.webp' }; // keep in sync with AUTO_COVERS in public/app.js
const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const okUrl = (u) => /^https:\/\/[^\s"'<>]+$/.test(u || '') || /^\/media\/[\w./-]+$/.test(u || '');
const abs = (u) => (u && u.startsWith('/') ? SITE + u : u);
const coverOf = (x) => (okUrl(x.cover) ? x.cover : AUTO_COVERS[slugify(x.title)] || '');

function origin(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return (/^(localhost|127\.0\.0\.1)(:|$)/.test(host || '') ? 'http' : 'https') + '://' + host;
}

async function loadState(req) {
  if (dbConfigured()) {
    try { const r = await readContent(); if (r && r.state) return r.state; } catch (e) { console.error('work: read failed', e && e.message); }
  }
  const r = await fetch(origin(req) + '/seed-content.json');
  return r.ok ? r.json() : null;
}

function swap(html, start, end, content) {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) return html;
  return html.slice(0, a + start.length) + '\n' + content + '\n' + html.slice(b);
}

function setMeta(html, { title, desc, url, image }) {
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`);
  html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
  html = html.replace(/(<meta property="og:type" content=")[^"]*(")/, '$1article$2');
  html = html.replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  html = html.replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  html = html.replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${esc(url)}$2`);
  html = html.replace(/(<meta name="twitter:title" content=")[^"]*(")/, `$1${esc(title)}$2`);
  html = html.replace(/(<meta name="twitter:description" content=")[^"]*(")/, `$1${esc(desc)}$2`);
  if (image) {
    html = html.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
    html = html.replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${esc(image)}$2`);
    html = html.replace(/\s*<meta property="og:image:(width|height)" content="[^"]*">/g, '');
  }
  return html;
}

function sitemap(list) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/work', ...list.map((x) => '/work/' + slugify(x.title))];
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map((u, i) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod><priority>${i === 0 ? '1.0' : i === 1 ? '0.8' : '0.7'}</priority></url>`).join('\n') + '\n</urlset>\n';
}

export default async function handler(req, res) {
  try {
    const s = (await loadState(req)) || { profile: {}, projects: [] };
    const p = s.profile || {};
    const name = p.fullName || p.name || 'Kashan Murtaza';
    const list = (s.projects || []).filter((x) => x.status === 'published');

    if (req.query && req.query.sitemap) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
      return res.end(sitemap(list));
    }

    const r = await fetch(origin(req) + '/index.html');
    let html = await r.text();
    const slug = String((req.query && req.query.slug) || '').toLowerCase();
    let status = 200;

    if (!slug) {
      const url = SITE + '/work';
      const title = `${p.workEyebrow || 'Case studies'} · Operations, Digital Marketing and AI Video | ${name}`;
      const desc = `Case studies by ${name}: e-commerce operations, digital marketing, product research and AI video production.`;
      html = setMeta(html, { title, desc, url });
      html = swap(html, '<!--seo:content-->', '<!--/seo:content-->', ['<main class="seo-static">',
        `<h1>${esc(p.workEyebrow || 'Case studies')}: ${esc(name)}</h1>`, p.workIntro ? `<p>${esc(p.workIntro)}</p>` : '', '<ul>',
        ...list.map((x) => `<li><a href="/work/${slugify(x.title)}">${esc(x.title)}</a>${x.role ? ', ' + esc(x.role) : ''}${x.year ? ' (' + esc(x.year) + ')' : ''}: ${esc(x.summary)}</li>`),
        '</ul>', '<p><a href="/">Home</a></p>', '</main>'].join('\n'));
      html = swap(html, '<!--seo:ld-->', '<!--/seo:ld-->', '<script type="application/ld+json">' + JSON.stringify({
        '@context': 'https://schema.org', '@type': 'CollectionPage', name: title, url, description: desc,
        hasPart: list.map((x) => ({ '@type': 'CreativeWork', name: x.title, url: `${SITE}/work/${slugify(x.title)}` })),
      }).replace(/</g, '\\u003c') + '</script>');
    } else {
      const x = list.find((y) => slugify(y.title) === slug);
      if (!x) {
        status = 404;
        html = setMeta(html, { title: 'Not found | ' + name, desc: '', url: SITE + '/work' });
        html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex">');
      } else {
        const url = `${SITE}/work/${slugify(x.title)}`;
        const title = `${x.title}${x.role ? ' · ' + x.role : ''} | ${name}`;
        const desc = String(x.summary || x.details || '').slice(0, 300);
        const image = coverOf(x) ? abs(coverOf(x)) : '';
        html = setMeta(html, { title, desc, url, image });
        const paras = String(x.details || '').split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
        html = swap(html, '<!--seo:content-->', '<!--/seo:content-->', ['<main class="seo-static">',
          `<p><a href="/work">${esc(p.workEyebrow || 'Case studies')}</a> / ${esc(x.category)}</p>`,
          `<h1>${esc(x.title)}${x.role ? ': ' + esc(x.role) : ''}</h1>`,
          x.summary ? `<p>${esc(x.summary)}</p>` : '', ...paras.map((t) => `<p>${esc(t)}</p>`),
          x.year ? `<p>Period: ${esc(x.year)}</p>` : '', x.tags && x.tags.length ? `<p>Skills: ${x.tags.map(esc).join(', ')}</p>` : '',
          okUrl(x.url) && /^https:/.test(x.url) ? `<p><a href="${esc(x.url)}">${esc(x.title)} website</a></p>` : '',
          `<p>By <a href="/">${esc(name)}</a>, ${esc(p.location || 'Lahore, Pakistan')}</p>`, '</main>'].join('\n'));
        html = swap(html, '<!--seo:ld-->', '<!--/seo:ld-->', '<script type="application/ld+json">' + JSON.stringify({
          '@context': 'https://schema.org', '@graph': [
            { '@type': 'CreativeWork', name: x.title, description: desc, url, image: image || undefined, genre: x.category,
              keywords: (x.tags || []).join(', '), author: { '@type': 'Person', name, url: SITE + '/' } },
            { '@type': 'BreadcrumbList', itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
              { '@type': 'ListItem', position: 2, name: p.workEyebrow || 'Case studies', item: SITE + '/work' },
              { '@type': 'ListItem', position: 3, name: x.title, item: url }] },
          ],
        }).replace(/</g, '\\u003c') + '</script>');
      }
    }
    res.statusCode = status;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    res.end(html);
  } catch (e) {
    console.error('work page error', e && e.message);
    res.statusCode = 500; res.setHeader('Content-Type', 'text/plain'); res.end('Server error');
  }
}
