# Test report

Version: matches the live claude.ai site (v42): video links instead of uploads, and dashboard tabs for Projects, Task bar, Hero,
What I do, About me and Let's work together. Content = your current live content (8 projects; no videos set, because they were
cleared on the live site before switching to links).

## PASS (run on this exact code)
- `npm run build`: asset check ok, every referenced file exists.
- `vercel build` (Vercel's own CLI, on a clean copy): produces `index.html` and 4 functions (`api/content`, `api/auth/login`, `logout`, `me`), Node 22.
- API tests (`npm test`, real Postgres 16), 15/15, both on a seeded database and on an empty one (table auto-created):
  anonymous cannot save (401), wrong password rejected, login from another site rejected (403), HttpOnly SameSite=Strict cookie,
  tampered cookie rejected, save + version bump, stale save rejected (409), non-https video link and unknown category rejected (422), logout.
- Browser tests (Chromium, local server + Postgres), 26/26: public page with no JS errors or failed requests, `/admin` login,
  wrong-password message, all six tabs, YouTube page link rejected for the hero, edits in every tab published and shown on the public
  site after reload (task bar link, What I do heading and area, hero video link, About heading, contact heading and button, project
  title and video link), anonymous visitors get no Dashboard button and cannot save, logout, phone-width layout.

## NOT TESTED
- A real deployment on your Vercel account, and a hosted Neon database (tested with local Postgres 16, same SQL).
- Actual video playback from an external link (the test server has no internet; the link is placed correctly in the video element).
- Real phones (tested at 390 px width in Chromium).
