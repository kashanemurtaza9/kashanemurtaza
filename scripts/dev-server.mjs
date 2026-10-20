// Local development server: serves /public and runs the /api functions, mirroring vercel.json.
// (`vercel dev` also works if you have the Vercel CLI; this needs nothing extra.)
import http from 'node:http';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';
import './load-env.mjs';

const PORT = Number(process.env.PORT) || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp4': 'video/mp4', '.webm': 'video/webm', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const ROUTES = { '/api/content': 'api/content.js', '/api/auth/login': 'api/auth/login.js', '/api/auth/logout': 'api/auth/logout.js', '/api/auth/me': 'api/auth/me.js' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const wm = /^\/work(?:\/([\w-]+))?\/?$/.exec(url.pathname);
  if (wm) { const mod = await import(pathToFileURL(join(process.cwd(), 'api/work.js')).href); req.query = { slug: wm[1] || '' }; return mod.default(req, res); }
  if (ROUTES[url.pathname]) {
    const mod = await import(pathToFileURL(join(process.cwd(), ROUTES[url.pathname])).href);
    req.query = Object.fromEntries(url.searchParams);
    return mod.default(req, res);
  }
  let p = decodeURIComponent(url.pathname);
  if (p === '/admin' || p === '/admin/') p = '/index.html';
  if (p === '/') p = '/index.html';
  const file = normalize(join(process.cwd(), 'public', p));
  if (!file.startsWith(join(process.cwd(), 'public')) || !existsSync(file) || !statSync(file).isFile()) { res.statusCode = 404; return res.end('Not found'); }
  const size = statSync(file).size;
  const type = TYPES[extname(file)] || 'application/octet-stream';
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
  if (range) {
    const start = range[1] ? Number(range[1]) : 0, end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    res.writeHead(206, { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${size}`, 'Content-Length': end - start + 1 });
    return createReadStream(file, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
  createReadStream(file).pipe(res);
}).listen(PORT, () => console.log('Dev server: http://localhost:' + PORT + '   (admin: /admin)'));
