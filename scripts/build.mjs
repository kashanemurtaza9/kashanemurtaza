// Build step run by Vercel (`npm run build`).
// The site is plain static files in /public; this only verifies that every file the site references exists.
import { execFileSync } from 'node:child_process';
execFileSync(process.execPath, ['scripts/seo.mjs'], { stdio: 'inherit' });
execFileSync(process.execPath, ['scripts/check-assets.mjs'], { stdio: 'inherit' });
