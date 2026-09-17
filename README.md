# Miss Americana

Miss Americana is a Spotify-connected music player. It authenticates with a user's Spotify account to read their library (liked songs, playlists), then resolves each track to a YouTube video and streams/downloads the audio from there — giving Spotify-library playback without going through Spotify's own playback API. This is a monorepo containing the desktop app, an Electron variant, a mobile app, the supporting CLI tools the apps shell out to, and a number of experiments.

> This is a personal project. Per the top-level note, the app is not distributed directly since doing so would run against US copyright law — clone the repo and run it yourself.

## Key features

- Spotify OAuth login (implicit grant / PKCE depending on client) to read a user's liked songs and playlists
- Track resolution: each Spotify track is matched to a YouTube video (via `youtubei.js` / `yt-search`) and streamed from there
- Full player UI: library browser, liked songs, playlists, now-playing bar with prev/next
- Lyrics lookup via `lrclib-api`
- Desktop app built with Tauri (Rust-backed, lightweight) and a parallel Electron build
- Mobile app (Expo / React Native) with its own Spotify auth flow and dashboard
- Bundled CLI helper executables (`ytsearch`, `ytdownload`, `inner-search`) that the apps invoke for search/download, plus a `gun-node` P2P/GunDB experiment for peer data sync

## Tech stack

- **Desktop app** (`miss-americana-app`): React 18 + Vite + [Tauri 2](https://tauri.app/), Tailwind CSS 4
- **Electron app** (`miss-americana-electron`): React 18 + Vite/Webpack + Electron Forge, Tailwind CSS
- **Mobile app** (`miss-americana-mobile`): React Native 0.79 + Expo 53 + Expo Router, TypeScript
- **CLI tools** (`executable-src`): Node.js, packaged to standalone `.exe` with `pkg`
  - `ytsearch` — `yt-search`, resolves a text query to a YouTube video ID
  - `ytdownload` — `youtube-dl-exec` (bundled `yt-dlp.exe`), batch-downloads audio from YouTube URLs
  - `inner-search` — `youtubei.js` (Innertube), searches YouTube and resolves a direct streaming URL
  - `gun-node` — [GunDB](https://gun.eco/) + Express, experimental peer-to-peer data sync server/client
- Track/audio resolution across apps: `youtubei.js`, `ytdl-core`, `youtube-search-api`, `dashjs`

## Repository structure

```
miss-americana-app/        Tauri desktop app (primary client)
miss-americana-electron/   Electron desktop app (parallel implementation)
miss-americana-mobile/     Expo/React Native mobile app
executable-src/            Source for the bundled CLI helper executables
  ytsearch/                 YouTube search -> video ID
  ytdownload/                Batch YouTube -> audio download (yt-dlp)
  inner-search/               YouTube search -> direct stream URL
  gun-node/                  GunDB peer-sync experiment
  initial-payload/           Early prototype (ffmpeg, Spotify CSV export)
binaries/                  Prebuilt CLI executables consumed by the apps
legacy/                    Earlier prototypes (browser download test, Deno server, ESP32/MIDI hardware experiment)
experiments/               Standalone spikes: torrent reseeding (browser/cache/dynamic), IPFS upload,
                            lyric API, Tauri proxy, Python proxy, puppeteer-based control, torrent test
```

## Setup

Each app is an independent npm project. Pick the client you want to run and install its dependencies:

```bash
# Desktop (Tauri)
cd miss-americana-app
npm install

# Desktop (Electron)
cd miss-americana-electron
npm install

# Mobile (Expo)
cd miss-americana-mobile
npm install
```

## Usage

### Desktop (Tauri) — `miss-americana-app`

```bash
npm run dev       # Vite dev server
npm run tauri dev # Run as a native Tauri window
npm run build      # Production web build
```

### Desktop (Electron) — `miss-americana-electron`

```bash
npm run dev      # Dev mode (renderer + main, via scripts/dev.js)
npm start        # electron-forge start
npm run package  # Package the app
npm run make     # Build platform installers
```

### Mobile (Expo) — `miss-americana-mobile`

```bash
npm start        # Start the Expo dev server
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web       # Run in a browser
```

### CLI helper tools — `executable-src/*`

Each tool is a standalone Node script (also packaged to a `.exe` via `pkg`):

```bash
cd executable-src/ytsearch
node index.js "<search query>"      # -> JSON array with a matched YouTube video ID

cd executable-src/ytdownload
node index.js <youtube-url> [...]   # -> downloads up to 10 URLs as audio

cd executable-src/inner-search
node index.js "<search query>"      # -> prints a direct streaming URL
```

Prebuilt copies of `inner-search` and `ytsearch` live in `binaries/` for the apps to invoke directly.

## Configuration

Spotify OAuth requires a client ID and redirect URI configured per app (see `react-spotify-auth` usage in the desktop apps and `SPOTIFY_CLIENT_ID` / `SPOTIFY_REDIRECT_URI` in `miss-americana-mobile/lib/spotifyAuth.ts`). You'll need your own Spotify Developer app registered with matching redirect URIs to authenticate.
