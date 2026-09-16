# ismaelbarajas.dev

Personal portfolio website built with Next.js, TypeScript, and Tailwind CSS. Features a Spotify integration showing real-time listening activity, an interactive navigation terminal that narrates the visit, a password-protected admin panel for managing content, and a PostgreSQL database via Prisma.

## Tech Stack

- **Framework:** Next.js 16 + React 19 (Node 24)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma ORM (`@prisma/adapter-pg`)
- **Auth:** Iron-session (cookie-based sessions), bcrypt password hash
- **Animations:** Motion, GSAP, Typed.js
- **WebGL:** Three.js + React Three Fiber (Dither background), OGL (Plasma background)
- **Data Fetching:** SWR
- **Theming:** Custom useTheme hook (dark by default; light stored in localStorage and applied before first paint)
- **File Storage:** Vercel Blob
- **Rate Limiting:** Upstash Redis
- **Analytics:** Vercel Analytics
- **Testing:** Vitest
- **Integrations:** Spotify Web API (access token cached server-side for its full lifetime to reduce refresh calls)

## Features

- Real-time Spotify "Now Playing" widget with animated equalizer bars, a smoothly interpolating progress bar that resyncs against the server, album art color extraction, and palette-driven accent colors (bars, artist text, and the Listen page's plasma background adopt colors derived from the current album art)
- Listen page (`/listen`) with tabs for top tracks (4 weeks / 6 months / all time), playlists, and liked songs
- Boot intro: on the first page of a session the navigation terminal appears centered, types a boot log, then docks to the bottom-left corner while the site fades in. Skipped for reduced motion, the "Minimal" effects tier, and admin pages.
- Navigation terminal: a fixed panel that logs route changes, hash jumps, outbound links, theme and effects changes, and what Spotify is playing. Under the log is a prompt with tab completion; press `` ` `` (backtick) anywhere to focus it. Commands: `help`, `cd`, `ls`, `pwd`, `theme`, `effects`, `open`, `np`, `whoami`, `date`, `clear`, `exit`. `cd` treats the site as a small filesystem (`cd listen/playlists`, `cd #projects`, `cd ..`, `cd -`). A nav toggle shows or hides the panel.
- Performance tiers for the WebGL and blur-heavy effects: Auto, Full, Reduced, Minimal. Auto classifies the device from WebGL availability, software-renderer strings, reduce-motion, data saver, CPU/memory hints, then measures frame rate and downgrades if needed. The nav's lightning-bolt toggle (or the terminal's `effects` command) overrides it; the choice is stored in localStorage under `perf` and applied before first paint via `data-perf` on `<html>`.
- Dark/light theme toggle with localStorage persistence
- Responsive portfolio sections: Hero, About, Experience, Projects, Contact
- Smooth scroll with active section tracking and scroll progress bar
- Custom target cursor (native cursor on touch devices and the Minimal tier) and magnetic button hover effects
- Compressions landing page (`/compressions`) for the desktop app, with screenshots served from Vercel Blob and the latest release pulled from GitHub
- Password-protected admin panel for CRUD management of experiences and projects with image uploads via Vercel Blob
- Open Graph / social preview images and a generated favicon set
- Claude Code GitHub Action that responds to `@claude` mentions in issues, PR comments, and reviews

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). `npm install` runs `prisma generate` automatically via the `postinstall` hook.

## Environment Variables

Create a `.env.local` file with the following:

```
# Spotify — create an app at https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# Database — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Admin panel — bcrypt hash from `npm run admin:hash` (ADMIN_PASSWORD plaintext is a deprecated fallback)
ADMIN_PASSWORD_HASH=

# Session encryption — any random 32+ character string
IRON_SESSION_SECRET=

# Vercel Blob — create a store at vercel.com/storage/blob
BLOB_READ_WRITE_TOKEN=

# Deployed origin, used by the CSRF origin check (localhost is accepted outside production)
NEXT_PUBLIC_SITE_URL=https://ismaelbarajas.dev

# Optional: Upstash Redis for login rate limiting that survives serverless isolates
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Optional: raises the GitHub API rate limit for the Compressions latest-release fetch
GITHUB_TOKEN=
```

Spotify refresh tokens expire six months after authorization. To mint a new one, register `http://127.0.0.1:8888/callback` as a redirect URI on the Spotify app, then run:

```bash
npm run spotify:token
```

Sign in when the browser opens, then copy the printed `SPOTIFY_REFRESH_TOKEN` into `.env.local` and the Vercel environment.

After setting `DATABASE_URL`, push the schema and seed the database:

```bash
npx prisma db push
npm run seed
```

Prisma reads `DATABASE_URL` through `prisma.config.ts`, which loads `.env.local` via dotenv.

## Scripts

```bash
npm run dev            # Start development server
npm run build          # Build for production
npm run start          # Start production server
npm run lint           # Run ESLint
npm test               # Run tests
npm run test:watch     # Run tests in watch mode
npm run seed           # Seed database with initial experience and project data
npm run admin:hash     # Generate a bcrypt hash for ADMIN_PASSWORD_HASH
npm run spotify:token  # Mint a new Spotify refresh token (opens a browser)
npm run favicon -- <image>  # Regenerate favicon.ico, favicon-32.png, apple-touch-icon.png, icon-192/512.png in public/ (uses sharp, installed with Next)
```

## Project Structure

```
├── pages/
│   ├── index.tsx          # Home page
│   ├── compressions.tsx   # Compressions app landing page
│   ├── listen.tsx         # Spotify listening page (top tracks, playlists, liked songs)
│   ├── _document.tsx      # Pre-paint bootstrap for theme, perf tier, and boot intro; favicons; fonts
│   ├── admin/             # Password-protected admin panel
│   └── api/               # API routes (Spotify, experience, projects, admin)
├── components/
│   ├── admin/             # Admin panel UI components
│   ├── compressions/      # Compressions landing page sections and atoms
│   ├── layouts/           # Page section components (Hero, About, Experience, etc.)
│   └── library/           # Reusable UI components (NavBar, NavTerminal, NowPlaying, EffectsToggle, etc.)
├── lib/
│   ├── spotify.ts         # Spotify Web API client with token caching
│   ├── site.ts            # Site map (sections, pages, listen tabs, contact links) shared by nav and terminal
│   ├── commands.ts        # Pure terminal command interpreter and tab completion
│   ├── navLog.ts          # Terminal log store and describe* helpers
│   ├── intro.ts / introStore.ts  # Boot intro timing and runner
│   ├── perf.ts / perfStore.ts    # Performance tier classification and browser store
│   ├── security.ts        # CSRF origin check and admin input validation
│   ├── rateLimit.ts       # Upstash / in-memory per-IP rate limiter
│   ├── adminPassword.ts   # bcrypt / constant-time password verification
│   ├── session.ts         # Iron-session config
│   └── prisma.ts          # Prisma client
├── hooks/                 # Custom React hooks (useTheme, usePerformanceTier, useNowPlaying, useNavObservers, etc.)
├── scripts/               # admin-hash, spotify-refresh-token, make-favicon
├── __tests__/             # Vitest test suites
├── prisma/
│   ├── schema.prisma      # Database schema (Experience, Project models)
│   └── seed.ts            # Initial data seed script
├── prisma.config.ts       # Prisma config (schema path, DATABASE_URL from dotenv)
├── .github/workflows/     # Claude Code @claude-mention action
└── public/                # Static assets, favicons, OG images
```

## Admin Panel

The admin panel at `/admin` allows creating, editing, and deleting experience and project entries stored in the database. Images are uploaded directly to Vercel Blob storage. Access requires `ADMIN_PASSWORD_HASH`, a bcrypt hash of the admin password. Generate one with:

```bash
npm run admin:hash
```

Plaintext `ADMIN_PASSWORD` still works as a fallback (compared in constant time) but logs a deprecation warning in production. Sessions are managed with Iron-session and expire after one day.

## Security

- **CSRF protection:** Origin/referer validation on all state-changing admin endpoints. `localhost` is only accepted outside production; set `NEXT_PUBLIC_SITE_URL` to the deployed origin.
- **Rate limiting:** Login is limited to 5 attempts per IP per 15 minutes, backed by Upstash Redis when `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set (add the Upstash integration from the Vercel Marketplace). Without them it falls back to a per-instance memory store, which does not hold across serverless isolates. If Upstash errors, requests are allowed through rather than locking out the admin.
- **Password storage:** bcrypt hash in `ADMIN_PASSWORD_HASH`; see Admin Panel above.
- **Input validation:** Server-side validation on all admin POST/PUT routes (type checks, URL format, string length limits). Route ids must be all digits.
- **Session cookies:** `httpOnly`, `secure` (production), `sameSite: lax`, 1-day seal TTL
- **Security headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, and a Content-Security-Policy in report-only mode (check the browser console for violations before switching it to enforcing in `next.config.js`). The CSP allows the inline bootstrap script in `pages/_document.tsx` by sha256 hash; update `THEME_SCRIPT_HASH` in `next.config.js` whenever that script changes.
- **Upload restrictions:** POST only; blob keys must be under `images/`; only JPEG, PNG, GIF, and WebP images allowed (max 5 MB)
- **Album-art fetches:** palette extraction only fetches from Spotify CDN hosts
- **Now Playing caching:** the `/api/now-playing` route sets short CDN `Cache-Control` headers (5 s while a track is loaded, 30 s idle), honors Spotify `Retry-After` on 429s, and serves the last known payload while rate limited, so Spotify quota does not scale with visitor count.

## Testing

Tests use [Vitest](https://vitest.dev/) and cover security utilities, rate limiting, API routes, authentication, input validation, uploads, Spotify integration and now-playing caching, the terminal command interpreter, the navigation log, the boot intro, the typing queue, and performance tier classification.

```bash
npm test           # Run all tests once
npm run test:watch # Run in watch mode during development
```

## Deployment

Deployed on [Vercel](https://vercel.com). Add all environment variables in Vercel project settings, including `NEXT_PUBLIC_SITE_URL` and, ideally, the Upstash Redis pair. Ensure your PostgreSQL database is accessible from Vercel's network (e.g., via [Neon](https://neon.tech) or [Supabase](https://supabase.com)). Create a Blob store under Vercel Storage and connect it to your project to enable image uploads.
