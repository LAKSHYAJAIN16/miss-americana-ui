# Miss Americana

> A music player that logs into Spotify, reads your library, and plays it back by matching each track to YouTube audio.

I built it because I wanted Spotify-library playback without Spotify's own player restrictions — matching tracks to YouTube turned out to be a workable way around that. It's a personal monorepo that's grown into a desktop app, a parallel Electron build, a mobile app, a few CLI helpers the apps shell out to, and a pile of experiments.

> I'm not distributing this directly (US copyright law) — clone it and run it yourself.

- Spotify OAuth (implicit grant or PKCE) reads your liked songs and playlists
- Each track resolves to a YouTube video via `youtubei.js` / `yt-search` and streams from there
- Full player UI: library browser, liked songs, playlists, now-playing bar
- Lyrics via `lrclib-api`
- Desktop app on Tauri, plus a parallel Electron build
- Mobile app (Expo / React Native) with its own Spotify auth flow
- Bundled CLI executables (`ytsearch`, `ytdownload`, `inner-search`) the apps call out to, plus a `gun-node` P2P sync experiment

## What's in here

```
miss-americana-app/        Tauri desktop app (main client)
miss-americana-electron/   Electron build of the same app
miss-americana-mobile/     Expo/React Native mobile app
executable-src/            source for the CLI helpers
  ytsearch/                  text query -> YouTube video ID
  ytdownload/                batch YouTube -> audio, via yt-dlp
  inner-search/              YouTube search -> direct stream URL (Innertube)
  gun-node/                  GunDB peer-sync experiment
  initial-payload/           earliest prototype (ffmpeg, Spotify CSV export)
binaries/                  prebuilt CLI executables the apps invoke directly
legacy/                    earlier prototypes (browser download test, Deno server, ESP32/MIDI experiment)
experiments/               spikes I didn't clean up (torrent reseeding, IPFS, puppeteer control, etc.)
```

## Running it

Each app is its own npm project:

```bash
# Desktop (Tauri)
cd miss-americana-app && npm install
npm run tauri dev  # native window
npm run build      # production web build

# Desktop (Electron)
cd miss-americana-electron && npm install
npm start        # electron-forge start
npm run make     # platform installers

# Mobile (Expo)
cd miss-americana-mobile && npm install
npm start        # Expo dev server
```

The CLI helpers under `executable-src/` are standalone Node scripts (also packaged to `.exe` via `pkg`):

```bash
node executable-src/ytsearch/index.js "<query>"       # -> matched video ID
node executable-src/ytdownload/index.js <youtube-url>  # -> downloads audio
node executable-src/inner-search/index.js "<query>"    # -> direct streaming URL
```

## Spotify setup

You'll need your own Spotify Developer app (client ID + redirect URI) — see `react-spotify-auth` usage in the desktop apps, and `SPOTIFY_CLIENT_ID` / `SPOTIFY_REDIRECT_URI` in `miss-americana-mobile/lib/spotifyAuth.ts`.
