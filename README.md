# ismaelbarajas.dev

Personal portfolio website built with Next.js, TypeScript, and Tailwind CSS. Features a Spotify integration showing real-time listening activity, animated UI components, and a full CV page.

## Tech Stack

- **Framework:** Next.js 16 + React 19
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4
- **Animations:** Motion
- **Data Fetching:** SWR
- **Theming:** next-themes (dark/light mode)
- **Integrations:** Spotify Web API

## Features

- Real-time Spotify "Now Playing" widget with album art color extraction
- Dark/light theme with system preference detection
- Responsive portfolio sections: Hero, About, Experience, Projects, Contact
- CV page and dedicated Spotify listening history page
- Smooth scroll with active section tracking
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
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
```

To get these values, create a Spotify app at [developer.spotify.com](https://developer.spotify.com/dashboard) and follow the OAuth flow to obtain a refresh token.

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Project Structure

```
├── pages/           # Next.js routes (index, cv, listen, api/)
├── components/
│   ├── layouts/     # Page section components
│   └── library/     # Reusable UI components
├── lib/             # Spotify API, SWR fetcher, utilities
├── hooks/           # Custom React hooks
├── constants/       # Static data (experience, projects)
└── public/          # Static assets and images
```

## Deployment

Deployed on [Vercel](https://vercel.com). Add the environment variables in the Vercel project settings.
