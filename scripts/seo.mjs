// Build step: writes search-engine content into public/index.html from public/seed-content.json,
// plus robots.txt and sitemap.xml. The app replaces the #app content as soon as it starts,
// so visitors see the normal site; crawlers and link previews see real text.
import { readFileSync, writeFileSync } from 'node:fs';
import { slugify } from '../lib/slug.js';

const SITE = 'https://kashanemurtaza-portfolio.vercel.app';
const s = JSON.parse(readFileSync('public/seed-content.json', 'utf8'));
const p = s.profile;
const esc = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const projects = s.projects.filter((x) => x.status === 'published');

const body = [
  '<main class="seo-static">',
  `<h1>${esc(p.fullName || p.name)} · ${esc(p.title)}</h1>`,
  `<p>${esc(p.intro)}</p>`,
  `<p>${esc(p.location)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>`,
  `<h2>${esc(p.aboutHeading || 'About me')}</h2>`,
  ...String(p.about || '').split(/\n\s*\n/).map((t) => `<p>${esc(t.trim())}</p>`),
  p.skills ? `<p><strong>Skills:</strong> ${esc(p.skills)}</p>` : '',
  '<h2>Experience</h2><ul>',
  ...(p.experience || []).map((e) => `<li>${esc(e.role)}, ${esc(e.org)} (${esc(e.period)})</li>`),
  '</ul><h2>Projects</h2>',
  `<p><a href="/work">All case studies</a></p>`,
  ...projects.map((x) => `<article><h3><a href="/work/${slugify(x.title)}">${esc(x.title)}</a></h3><p>${esc(x.category)}${x.year ? ' · ' + esc(x.year) : ''}${x.role ? ' · ' + esc(x.role) : ''}</p><p>${esc(x.summary)}</p></article>`),
  p.resumeUrl ? `<p><a href="${esc(p.resumeUrl)}">${esc(p.resumeLabel || 'Download resume')}</a></p>` : '',
  '</main>',
].join('\n');

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person', '@id': SITE + '/#person', name: p.fullName || p.name, jobTitle: p.title,
      description: p.intro, email: 'mailto:' + p.email, url: SITE,
      image: SITE + '/media/og.jpg',
      address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressCountry: 'PK' },
      knowsAbout: String(p.skills || '').split(',').map((t) => t.trim()).filter(Boolean),
      sameAs: [p.linkedin, p.fiverr].filter((u) => /^https:\/\//.test(u || '')),
    },
    { '@type': 'WebSite', '@id': SITE + '/#website', url: SITE, name: (p.fullName || p.name) + ' Portfolio', publisher: { '@id': SITE + '/#person' } },
  ],
};

let html = readFileSync('public/index.html', 'utf8');
const swap = (start, end, content) => {
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < a) throw new Error('marker missing: ' + start);
  html = html.slice(0, a + start.length) + '\n' + content + '\n' + html.slice(b);
};
swap('<!--seo:content-->', '<!--/seo:content-->', body);
swap('<!--seo:ld-->', '<!--/seo:ld-->', '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>');
writeFileSync('public/index.html', html);

writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/auth/\n\nSitemap: ${SITE}/sitemap.xml\n`);
const today = new Date().toISOString().slice(0, 10);
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>\n  <url><loc>${SITE}/work</loc><lastmod>${today}</lastmod><priority>0.8</priority></url>\n${projects.map((x) => `  <url><loc>${SITE}/work/${slugify(x.title)}</loc><lastmod>${today}</lastmod><priority>0.7</priority></url>\n`).join('')}</urlset>\n`);
console.log('seo: index.html content, JSON-LD, robots.txt, sitemap.xml written');
