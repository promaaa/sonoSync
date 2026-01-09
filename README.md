<div align="center">
  <img src="public/logo.png" alt="SonoSync Logo" width="200">
  <h1>SonoSync (Soundiiz, but open)</h1>
</div>

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-blueviolet.svg)](https://github.com/promaaa/sonosync/pulls)

SonoSync is a privacy-first, open-source music transfer tool. Move playlists between Spotify, Deezer, YouTube Music, and (soon) Apple Music without handing your credentials to a third-party service.

## Quick links
- Project board / issues: `https://github.com/promaaa/sonosync/issues`
- Local app URL: `http://127.0.0.1:3000`
- Auth callbacks: `http://127.0.0.1:3000/api/auth/callback/*`

## Table of contents
- Features
- Architecture
- Supported platforms
- Requirements
- Setup (local)
- Provider configuration
- Usage
- Development
- Project structure
- Troubleshooting
- Contributing
- License

## Features
- Accurate matching: ISRC-first matching with artist/title fallback and fuzzy search when needed.
- Two-layer auth: NextAuth for providers plus client-side PKCE for Spotify so you never ship a secret.
- Local-first privacy: tokens, ARL cookies, and secrets stay on your machine/server.
- Modern UX: animated, responsive Next.js 16 + Tailwind UI with a guided setup wizard.
- Replayable transfers: clone playlists inside Spotify or send them to Deezer/YouTube Music with per-track matching feedback.

## Architecture
- Framework: Next.js 16 App Router with server actions for transfers and provider config.
- Auth: Auth.js (NextAuth v5) providers for Spotify, Google/YouTube, Deezer, and Apple; PKCE flow for Spotify on the client.
- Data/matching: Zustand for client state; `matchTracks` resolves ISRC > artist/title; provider adapters in `src/lib/providers`.
- UI: Platform cards, playlist picker, and transfer flow components rendered server-side with progressive enhancement.

## Supported platforms
- Spotify: read/write via official API (PKCE for source auth, NextAuth for general login).
- Deezer: read/write via ARL cookie (API keys optional/legacy). Write operations can fail if Deezer enforces CSRF—see Troubleshooting.
- YouTube Music: read/write via YouTube Data API v3 through Google OAuth.
- Apple Music: planned (scaffolding exists in auth, UI marked "coming soon").

## Requirements
- Node.js 20+ and npm
- Accounts on the target providers
- For Google OAuth: a published or testable OAuth consent screen with your user added

## Setup (local)
1) Clone and install
```bash
git clone https://github.com/promaaa/sonosync.git
cd sonosync
npm install
```

2) Create `.env.local`
```env
AUTH_SECRET=replace-with-random-string
NEXTAUTH_URL=http://127.0.0.1:3000

# Spotify (required for source playlists and cloning)
SPOTIFY_CLIENT_ID=your_spotify_id
SPOTIFY_CLIENT_SECRET=your_spotify_secret
NEXT_PUBLIC_REDIRECT_URI=http://127.0.0.1:3000/callback

# Google / YouTube Music
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret

# Deezer (optional; ARL cookie still needed for writes)
DEEZER_CLIENT_ID=mock_deezer_id
DEEZER_CLIENT_SECRET=mock_deezer_secret

# Apple Music (planned)
APPLE_ID=mock_apple_id
APPLE_SECRET=mock_apple_secret
```

3) Run the app
```bash
npm run dev
```

4) Open `http://127.0.0.1:3000` and follow the in-app setup wizard.

## Provider configuration

### Spotify
1. Create an app in the [Spotify Dashboard](https://developer.spotify.com/dashboard).
2. Add redirect URIs: `http://127.0.0.1:3000/callback` (PKCE) and `http://127.0.0.1:3000/api/auth/callback/spotify` (NextAuth).
3. Copy the client ID/secret into `.env.local` or enter them in the wizard.

### Deezer
1. Log in to Deezer and open DevTools → Application → Cookies.
2. Copy the value of the `arl` cookie.
3. Paste the ARL into the Deezer step of the wizard. (API keys in `.env.local` stay optional.)
4. Note: playlist creation can fail if Deezer rejects the request; reading playlists is reliable.

### YouTube Music (Google OAuth)
1. In [Google Cloud Console](https://console.cloud.google.com/), enable **YouTube Data API v3**.
2. Create OAuth credentials (Web app) and add redirect URI `http://127.0.0.1:3000/api/auth/callback/google`.
3. Add yourself as a Test User or publish the app to avoid "access blocked".
4. Copy client ID/secret into `.env.local` or the wizard.

### Apple Music (preview)
Apple provider fields exist in `.env.local` but end-to-end transfer is not yet implemented.

## Usage
- Source playlists: currently Spotify is the source when using the PKCE flow. You can also clone playlists inside Spotify.
- Destination options: Spotify (clone), Deezer, YouTube Music; Apple Music planned.
- Flow:
  1. Authenticate the providers you need.
  2. Pick a source playlist in "Your Playlists".
  3. Choose a destination platform and start transfer. The matcher will prefer ISRC and fall back to artist/title search.

## Development
- `npm run dev` — start the local dev server.
- `npm run build` — production build.
- `npm run start` — run the built app.
- `npm run lint` — lint with ESLint.

## Project structure (high level)
- `src/app` — Next.js routes, layout, and main page.
- `src/components` — UI: header, platform cards, playlist selector, transfer flow.
- `src/actions` — server actions for provider config and playlist transfers.
- `src/lib` — auth setup, matching logic, provider adapters, Spotify PKCE helpers.
- `src/store` — Zustand store for music state.
- `public` — static assets and icons.

## Troubleshooting
- Spotify redirect errors: ensure you use `127.0.0.1` (not `localhost`) and that the redirect URIs match exactly.
- Google "access blocked": add yourself as a Test User or publish the OAuth app.
- Deezer write failures: ARL cookies can expire or be rejected; refresh the ARL and retry.
- Mixed-provider tokens: if you logged in with Spotify and need YouTube, also sign in with Google so NextAuth holds a Google token.

## Contributing
- Issues and PRs are welcome. Please open an issue for major changes first.
- Keep changes small, add notes about platform testing, and prefer TypeScript types where possible.

## License
MIT. See `LICENSE`.
