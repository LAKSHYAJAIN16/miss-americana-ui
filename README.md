# Miss Americana

Miss Americana is a music player that logs into your Spotify account, reads your library (liked songs, playlists), and then plays it back by matching each track to a YouTube video and streaming the audio from there — so you get your actual Spotify library without going through Spotify's playback API.

I built it because I wanted Spotify-library playback that isn't locked behind Spotify's own player restrictions, and matching tracks to YouTube turned out to be a workable way around that. This is a personal project and a monorepo — it's grown into a desktop app, a parallel Electron build, a mobile app, a handful of CLI helper tools the apps shell out to, and a pile of experiments I didn't want to throw away.

> Per the note at the top: I'm not distributing this directly, since that would run into US copyright law. Clone it and run it yourself.

## How it works

- Spotify OAuth (implicit grant or PKCE depending on the client) reads your liked songs and playlists
- Every track gets resolved to a YouTube video via `youtubei.js` / `yt-search` and streamed from there
- Full player UI — library browser, liked songs, playlists, a now-playing bar with prev/next
- Lyrics via `lrclib-api`
- A desktop app built on Tauri (Rust-backed, lighter weight) plus a parallel Electron build of the same idea
- A mobile app (Expo / React Native) with its own Spotify auth flow and dashboard
- Bundled CLI executables (`ytsearch`, `ytdownload`, `inner-search`) that the apps call out to for search/download, plus a `gun-node` experiment for P2P data sync via GunDB

## What's in here

```
miss-americana-app/        Tauri desktop app (the main client)
miss-americana-electron/   Electron build of the same app
miss-americana-mobile/     Expo/React Native mobile app
executable-src/            source for the CLI helpers
  ytsearch/                 text query -> YouTube video ID
  ytdownload/                batch YouTube -> audio, via yt-dlp
  inner-search/               YouTube search -> direct stream URL (Innertube)
  gun-node/                  GunDB peer-sync experiment
  initial-payload/           earliest prototype (ffmpeg, Spotify CSV export)
binaries/                  prebuilt CLI executables the apps invoke directly
legacy/                    earlier prototypes (browser download test, Deno server, an ESP32/MIDI hardware experiment)
experiments/               spikes I didn't clean up: torrent reseeding, IPFS upload, a lyric API, a Tauri proxy, a Python proxy, puppeteer-based control, torrent tests
```

## Running it

Each app is its own npm project — pick one and install:

```bash
# Desktop (Tauri)
cd miss-americana-app && npm install
npm run dev        # Vite dev server
npm run tauri dev  # native Tauri window
npm run build      # production web build

# Desktop (Electron)
cd miss-americana-electron && npm install
npm run dev      # renderer + main via scripts/dev.js
npm start        # electron-forge start
npm run package  # package the app
npm run make     # platform installers

# Mobile (Expo)
cd miss-americana-mobile && npm install
npm start        # Expo dev server
npm run android
npm run ios
npm run web
```

The CLI helpers under `executable-src/` are standalone Node scripts (also packaged to `.exe` via `pkg`):

```bash
cd executable-src/ytsearch && node index.js "<search query>"     # -> JSON array with a matched video ID
cd executable-src/ytdownload && node index.js <youtube-url> ...  # -> downloads up to 10 URLs as audio
cd executable-src/inner-search && node index.js "<search query>" # -> prints a direct streaming URL
```

Prebuilt copies of `inner-search` and `ytsearch` live in `binaries/` for the apps to call directly.

## Spotify setup

You'll need your own Spotify Developer app with a client ID and matching redirect URI — see `react-spotify-auth` usage in the desktop apps, and `SPOTIFY_CLIENT_ID` / `SPOTIFY_REDIRECT_URI` in `miss-americana-mobile/lib/spotifyAuth.ts`.
