# Miss Americana

> A music player that logs into Spotify, reads your library, and plays it back by matching each track to YouTube audio.

Because of US copyright law this isn't something I can hand you as a hosted app — clone it and run it yourself. Under the hood, each Spotify track resolves to a YouTube video via `youtubei.js`/`yt-search` and streams from there, which sidesteps the playback restrictions of Spotify's own player.

It started as a single desktop client and grew into a personal monorepo: a Tauri app, a parallel Electron build, a mobile app, a handful of CLI helpers the apps shell out to, and a pile of experiments.

## What's in here

```
miss-americana-app/        Tauri desktop app (main client)
miss-americana-electron/   Electron build of the same app
miss-americana-mobile/     Expo/React Native mobile app
executable-src/            CLI helpers (ytsearch, ytdownload, inner-search, gun-node, initial-payload)
binaries/                  prebuilt CLI executables the apps invoke directly
legacy/, experiments/      earlier prototypes and spikes I didn't clean up
```

## Running it

Each app is its own npm project:

```bash
# Desktop (Tauri)
cd miss-americana-app && npm install && npm run tauri dev

# Desktop (Electron)
cd miss-americana-electron && npm install && npm start

# Mobile (Expo)
cd miss-americana-mobile && npm install && npm start
```

The CLI helpers under `executable-src/` are standalone Node scripts (also packaged to `.exe` via `pkg`):

```bash
node executable-src/ytsearch/index.js "<query>"        # -> matched video ID
node executable-src/ytdownload/index.js <youtube-url>  # -> downloads audio
```

## Spotify setup

You'll need your own Spotify Developer app (client ID + redirect URI) — see `react-spotify-auth` usage in the desktop apps, and `SPOTIFY_CLIENT_ID`/`SPOTIFY_REDIRECT_URI` in `miss-americana-mobile/lib/spotifyAuth.ts`.
