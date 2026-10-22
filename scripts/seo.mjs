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
  `<h1>${esc(p.fullName || p.name)}: Business Manager, E-commerce Operations and Digital Marketing Specialist in Lahore, Pakistan</h1>`,
  `<p>${esc(p.title)}</p>`,
  `<p>${esc(p.intro)}</p>`,
  `<p>${esc(p.location)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>`,
  `<h2>${esc(p.aboutHeading || 'About me')}</h2>`,
  ...String(p.about || '').split(/\n\s*\n/).map((t) => `<p>${esc(t.trim())}</p>`),
  p.skills ? `<p><strong>Skills:</strong> ${esc(p.skills)}</p>` : '',
  '<h2>Experience</h2><ul>',
  ...(p.experience || []).map((e) => `<li>${esc(e.role)}, ${esc(e.org)} (${esc(e.period)})</li>`),
  '</ul><h2>Projects and case studies: e-commerce operations, Meta Ads, AI video ads and product research</h2>',
  `<p><a href="/work">All case studies</a></p>`,
  ...projects.map((x) => `<article>${/^\/media\//.test(x.cover || '') ? `<img src="${esc(x.cover)}" alt="${esc(x.title)}: ${esc(x.role || x.category)} by ${esc(p.fullName || p.name)}" width="1000" height="558" loading="lazy">` : ''}<h3><a href="/work/${slugify(x.title)}">${esc(x.title)}</a></h3><p>${esc(x.category)}${x.year ? ' · ' + esc(x.year) : ''}${x.role ? ' · ' + esc(x.role) : ''}</p><p>${esc(x.summary)}</p></article>`),
  p.resumeUrl ? `<p><a href="${esc(p.resumeUrl)}">${esc(p.resumeLabel || 'Download resume')}</a></p>` : '',
  '</main>',
].join('\n');

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person', '@id': SITE + '/#person', name: p.fullName || p.name, jobTitle: ['Business Manager', p.title].filter(Boolean),
      description: p.intro, email: 'mailto:' + p.email, url: SITE,
      image: SITE + '/media/og.jpg',
      address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressCountry: 'PK' },
      knowsAbout: String(p.skills || '').split(',').map((t) => t.trim()).filter(Boolean),
      sameAs: [...new Set([p.linkedin || 'https://www.linkedin.com/in/kashanemurtaza', p.fiverr, 'https://github.com/kashanemurtaza9'].filter((u) => /^https:\/\//.test(u || '')))],
      worksFor: p.experience && p.experience[0] && /current|present|now/i.test(p.experience[0].period || '') ? { '@type': 'Organization', name: p.experience[0].org } : undefined,
      alumniOf: [{ '@type': 'EducationalOrganization', name: 'CGL' }, { '@type': 'EducationalOrganization', name: 'The Country School' }],
      hasOccupation: { '@type': 'Occupation', name: p.title, occupationLocation: { '@type': 'City', name: 'Lahore' } },
      ...(p.photo && /^\/media\//.test(p.photo) ? { image: SITE + p.photo } : {}),
    },
    { '@type': 'ProfilePage', '@id': SITE + '/#profile', url: SITE + '/', name: (p.fullName || p.name) + ' Portfolio', mainEntity: { '@id': SITE + '/#person' } },
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
// sitemap.xml is served by api/work.js from the live content (see vercel.json).
console.log('seo: index.html content, JSON-LD, robots.txt, sitemap.xml written');
