# Kashan: portfolio website + admin dashboard (Vercel)

Plain static site (no framework) + Vercel serverless API routes + Postgres.

| Part | Where | What it does |
|---|---|---|
| Public site | `public/index.html`, `styles.css`, `app.js` | Same design and GSAP animations as the claude.ai version. Loads its content from `/api/content`. |
| Admin dashboard | route **`/admin`** | Password login, then tabs: **Projects**, **Task bar**, **Hero**, **What I do**, **About me**, **Let's work together**. **Publish changes** saves to the database. |
| API | `api/content.js`, `api/auth/login.js`, `logout.js`, `me.js` | Read content (public), save content (admin only), login/logout/session. |
| Database | Postgres, table `site_content` (`db/001_init.sql`) | One JSONB document with all content, versioned so two tabs cannot overwrite each other silently. |
| Seed content | `public/seed-content.json` | Your current live content. Shown until the database has content. |

**Videos are links.** In the dashboard you paste a direct video link (ending in `.mp4` or `.webm`, starting with `https://`) for each
project and for the hero. YouTube, Vimeo, Instagram, TikTok, Facebook, X and Google Drive *page* links are rejected because a
browser cannot play them as a video file. Good places to host a direct `.mp4`: Cloudinary, Bunny.net, a Vercel Blob public store, or
an S3/R2 bucket. Cover images and the About photo are still chosen as files in the dashboard (resized in the browser and stored in the database).

## Deploy to Vercel (step by step)
1. **Put the files on GitHub.** Unzip. Create an empty GitHub repository and upload the *contents* of the `kashan-portfolio` folder
   so the repository's top level shows `package.json`, `vercel.json`, `public`, `api`, `lib`, `scripts`, `db`.
   (GitHub website: **Add file, Upload files**, drag everything *inside* the folder. Or with git:
   `git init && git add . && git commit -m "portfolio" && git branch -M main && git remote add origin <repo-url> && git push -u origin main`.)
2. **Vercel, Add New, Project**, import the repository. Framework Preset: **Other**. Leave Build/Output settings empty
   (`vercel.json` sets Build `npm run build`, Output `public`). Root Directory: leave as `./`.
3. Before or after the first deploy, open the project's **Storage** tab, **Create Database**, choose **Neon (Postgres)**, and connect it to
   the project (all environments). This adds `DATABASE_URL` automatically.
4. **Settings, Environment Variables**: add `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` (values given to you, or make your own with
   `npm run hash-password`). Tick Production, Preview and Development.
5. **Deployments**, latest deployment, **Redeploy** (environment variables only apply to new deployments).
6. Open `https://YOUR-PROJECT.vercel.app/admin`, log in, edit, press **Publish changes**. The first publish creates the database row
   (the table is created automatically). Reload the public site to see the change.
7. If the site asks visitors to log in to Vercel: **Settings, Deployment Protection**, turn **Vercel Authentication** off.

When you are logged in, a **Dashboard** button also appears on the public site (bottom right). Visitors never see it.

## Change the admin password
Run `npm install` then `npm run hash-password` on your computer, type a new password (12+ characters), paste the two printed values
into Vercel's environment variables (replacing the old ones), and redeploy. Changing `SESSION_SECRET` logs out every open session.

## Troubleshooting
- **`404: NOT_FOUND` on every page**: Vercel built the wrong folder. The GitHub repository's top level must show `package.json` and
  `vercel.json`. If it shows one `kashan-portfolio` folder instead, set **Settings, General, Root Directory** to `kashan-portfolio`, or
  move the files up a level. The build log should end with `asset check ok`, and the deployment should list 4 functions under `api/`.
- **Login says "not set up on the server"**: `ADMIN_PASSWORD_HASH` or `SESSION_SECRET` is missing, or you did not redeploy after adding them.
- **Publish says "The database is not connected yet"**: connect the Neon/Postgres database (step 3) and redeploy.
- **A video does not play**: open the link in a new browser tab. It must play there as a bare video. If it opens a web page, it is not a direct link.

## Local development
```
npm install
cp .env.example .env.local     # fill in DATABASE_URL, ADMIN_PASSWORD_HASH, SESSION_SECRET
npm run db:setup               # optional: creates the table and loads seed-content.json
npm run build                  # checks every referenced file exists
npm run dev                    # http://localhost:3000 , admin at /admin
npm test                       # API tests; needs DATABASE_URL (use a throwaway database)
```

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| `DATABASE_URL` (or `POSTGRES_URL`) | yes, to save | Postgres connection string. Added automatically by Vercel's Neon integration. |
| `ADMIN_PASSWORD_HASH` | yes | scrypt hash of the admin password (`npm run hash-password`) |
| `SESSION_SECRET` | yes | 32+ character random string that signs the login cookie |

## Honest limits
- One admin, one password. Login throttling is a small per-instance counter (8 tries / 15 min); for stronger protection turn on
  Vercel Firewall rate limiting for `/api/auth/login`.
- Fiverr, LinkedIn and the Zlenso website link are empty in your content. Fill them in under Dashboard, Let's work together / Projects.
- `public/vendor/gsap.min.js` and `ScrollTrigger.min.js` are GSAP 3.12.5 (GreenSock standard license). Inter is self-hosted (SIL OFL).

See `REPORT.md` for what was tested.
