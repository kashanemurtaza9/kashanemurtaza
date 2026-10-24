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

// The FAQ and "What I do" defaults live in public/app.js; read them so crawlers that don't run JavaScript see the same text.
const appSrc = readFileSync('public/app.js', 'utf8');
const literal = (name) => {
  const m = appSrc.match(new RegExp('var ' + name + ' = (\\[[\\s\\S]*?\\n  \\]);'));
  if (!m) throw new Error('could not read ' + name + ' from app.js');
  return Function('"use strict"; return (' + m[1] + ');')();
};
const faq = (Array.isArray(p.faq) && p.faq.length ? p.faq.map((f) => [f.q, f.a]) : literal('FAQ_DEFAULT')).filter((f) => f[0] && f[1]);
const caps = Array.isArray(p.caps) && p.caps.length
  ? p.caps.map((c) => [c.title, c.text, String(c.keywords || '').split(',').map((k) => k.trim()).filter(Boolean)])
  : literal('CAPS');

const body = [
  '<main class="seo-static">',
  `<h1>${esc(p.fullName || p.name)}: Business Manager, E-commerce Operations and Digital Marketing Specialist in Lahore, Pakistan</h1>`,
  `<p>${esc(p.title)}</p>`,
  `<p>${esc(p.intro)}</p>`,
  `<p>${esc(p.location)} · <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></p>`,
  `<h2>${esc(p.aboutHeading || 'About me')}</h2>`,
  ...String(p.about || '').split(/\n\s*\n/).map((t) => `<p>${esc(t.trim())}</p>`),
  p.skills ? `<p><strong>Skills:</strong> ${esc(p.skills)}</p>` : '',
  '<h2>What I do</h2>',
  ...caps.map((c) => `<h3>${esc(c[0])}</h3><p>${esc(c[1])}</p>${c[2] && c[2].length ? `<p>${c[2].map(esc).join(' · ')}</p>` : ''}`),
  '<h2>Experience</h2><ul>',
  ...(p.experience || []).map((e) => `<li>${esc(e.role)}, ${esc(e.org)} (${esc(e.period)})</li>`),
  '</ul><h2>Projects and case studies: e-commerce operations, Meta Ads, AI video ads and product research</h2>',
  `<p><a href="/work">All case studies</a></p>`,
  ...projects.map((x) => `<article>${/^\/media\//.test(x.cover || '') ? `<img src="${esc(x.cover)}" alt="${esc(x.title)}: ${esc(x.role || x.category)} by ${esc(p.fullName || p.name)}" width="1000" height="558" loading="lazy">` : ''}<h3><a href="/work/${slugify(x.title)}">${esc(x.title)}</a></h3><p>${esc(x.category)}${x.year ? ' · ' + esc(x.year) : ''}${x.role ? ' · ' + esc(x.role) : ''}</p><p>${esc(x.summary)}</p></article>`),
  p.resumeUrl ? `<p><a href="${esc(p.resumeUrl)}">${esc(p.resumeLabel || 'Download resume')}</a></p>` : '',
  '<h2>Questions answered</h2>',
  ...faq.map((f) => `<h3>${esc(f[0])}</h3><p>${esc(f[1])}</p>`),
  '</main>',
].join('\n');

const ld = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Person', '@id': SITE + '/#person', name: p.fullName || p.name, jobTitle: ['Business Manager', 'E-commerce Operations Manager', 'Digital Marketing Specialist'],
      description: p.intro, email: 'mailto:' + p.email, url: SITE,
      image: SITE + '/media/og.jpg',
      address: { '@type': 'PostalAddress', addressLocality: 'Lahore', addressCountry: 'PK' },
      knowsAbout: String(p.skills || '').split(',').map((t) => t.trim()).filter(Boolean),
      sameAs: [...new Set([p.linkedin || 'https://www.linkedin.com/in/kashanemurtaza', p.fiverr, 'https://github.com/kashanemurtaza9'].filter((u) => /^https:\/\//.test(u || '')))],
      worksFor: p.experience && p.experience[0] && /current|present|now/i.test(p.experience[0].period || '') ? { '@type': 'Organization', name: p.experience[0].org } : undefined,
      alumniOf: [{ '@type': 'EducationalOrganization', name: 'CGL' }, { '@type': 'EducationalOrganization', name: 'The Country School' }],
      hasOccupation: { '@type': 'Occupation', name: 'Business Manager', occupationLocation: { '@type': 'City', name: 'Lahore' }, skills: String(p.skills || '') },
      nationality: { '@type': 'Country', name: 'Pakistan' },
      ...(p.photo && /^\/media\//.test(p.photo) ? { image: SITE + p.photo } : {}),
    },
    { '@type': 'ProfilePage', '@id': SITE + '/#profile', url: SITE + '/', name: (p.fullName || p.name) + ' Portfolio', dateModified: new Date().toISOString().slice(0, 10), mainEntity: { '@id': SITE + '/#person' } },
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
const faqLd = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map((f) => ({ '@type': 'Question', name: f[0], acceptedAnswer: { '@type': 'Answer', text: f[1] } })) };
swap('<!--seo:ld-->', '<!--/seo:ld-->', '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>'
  // id="faq-ld": the app replaces this with the live FAQ once it runs, so there is never a duplicate.
  + '\n<script type="application/ld+json" id="faq-ld">' + JSON.stringify(faqLd).replace(/</g, '\\u003c') + '</script>');
writeFileSync('public/index.html', html);

// AI search crawlers are named explicitly so it is clear they are welcome (answers in ChatGPT, Claude, Perplexity, Gemini).
const aiBots = ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Applebot-Extended', 'Bingbot'];
writeFileSync('public/robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/auth/\n\n`
  + aiBots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /admin\n`).join('\n')
  + `\nSitemap: ${SITE}/sitemap.xml\n`);
// sitemap.xml is served by api/work.js from the live content (see vercel.json).
console.log('seo: index.html content, JSON-LD, robots.txt, sitemap.xml written');
