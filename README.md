# ismaelbarajas.dev

Personal portfolio website built with Next.js, TypeScript, and Tailwind CSS. Features a Spotify integration showing real-time listening activity, a password-protected admin panel for managing content, and a PostgreSQL database via Prisma.

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** Iron-session (cookie-based sessions)
- **Animations:** Motion, Typed.js
- **Data Fetching:** SWR
- **Theming:** next-themes (dark/light mode)
- **File Storage:** Vercel Blob
- **Testing:** Vitest
- **Integrations:** Spotify Web API (access token cached server-side for its full lifetime to reduce refresh calls)

## Features

- Real-time Spotify "Now Playing" widget with animated equalizer bars, album art color extraction, and palette-driven accent colors (bars and artist text adopt colors derived from the current album art)
- Top tracks page showing listening history
- Dark/light theme with system preference detection
- Responsive portfolio sections: Hero, About, Experience, Projects, Contact
- CV page with calculated age
- Smooth scroll with active section tracking and scroll progress bar
- Custom cursor follower and magnetic button hover effects
- Password-protected admin panel for CRUD management of experiences and projects with image uploads via Vercel Blob
- Automated Claude Code PR reviews via GitHub Actions

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Create a `.env.local` file with the following:

```
# Spotify — create an app at https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=

# Database — PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Admin panel
ADMIN_PASSWORD=

# Session encryption — any random 32+ character string
IRON_SESSION_SECRET=

# Vercel Blob — create a store at vercel.com/storage/blob
BLOB_READ_WRITE_TOKEN=
```

After setting `DATABASE_URL`, generate the Prisma client and seed the database:

```bash
npx prisma generate
npm run seed
```

## Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm test           # Run tests
npm run test:watch # Run tests in watch mode
npm run seed       # Seed database with initial experience and project data
```

## Project Structure

```
├── pages/
│   ├── index.tsx          # Home page
│   ├── cv.tsx             # CV page
│   ├── listen.tsx         # Spotify listening page
│   ├── admin/             # Password-protected admin panel
│   └── api/               # API routes (Spotify, experience, projects, admin)
├── components/
│   ├── admin/             # Admin panel UI components
│   ├── layouts/           # Page section components (Hero, About, Experience, etc.)
│   └── library/           # Reusable UI components (NavBar, NowPlaying, etc.)
├── lib/                   # Spotify API, Prisma client, session config, security utilities
├── hooks/                 # Custom React hooks
├── __tests__/             # Vitest test suites
├── prisma/
│   ├── schema.prisma      # Database schema (Experience, Project models)
│   └── seed.ts            # Initial data seed script
└── public/                # Static assets
```

## Admin Panel

The admin panel at `/admin` allows creating, editing, and deleting experience and project entries stored in the database. Images are uploaded directly to Vercel Blob storage. Access requires the `ADMIN_PASSWORD` set in your environment. Sessions are managed with Iron-session.

## Security

- **CSRF protection:** Origin/referer validation on all state-changing admin endpoints
- **Rate limiting:** Login endpoint is limited to 5 attempts per IP per 15-minute window
- **Input validation:** Server-side validation on all admin POST/PUT routes (type checks, URL format, string length limits)
- **Session cookies:** `httpOnly`, `secure` (production), `sameSite: lax`
- **Security headers:** HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Upload restrictions:** Only JPEG, PNG, GIF, and WebP images allowed (max 5 MB)

## Testing

Tests use [Vitest](https://vitest.dev/) and cover security utilities, API routes, authentication, input validation, and Spotify integration.

```bash
npm test           # Run all tests once
npm run test:watch # Run in watch mode during development
```

## Deployment

Deployed on [Vercel](https://vercel.com). Add all environment variables in Vercel project settings. Ensure your PostgreSQL database is accessible from Vercel's network (e.g., via [Neon](https://neon.tech) or [Supabase](https://supabase.com)). Create a Blob store under Vercel Storage and connect it to your project to enable image uploads.
