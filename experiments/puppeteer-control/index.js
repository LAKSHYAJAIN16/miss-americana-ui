const puppeteer = require("puppeteer");
const fs = require("fs");
const https = require("https");
const path = require("path");

function extractSpotifyID(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split("/");
    let id = parts[parts.length - 1];
    id = id.split("?")[0]; // remove query if present
    return id;
  } catch {
    return null;
  }
}

async function downloadSpotifyMP3(spotifyUrl) {
  const spotifyID = extractSpotifyID(spotifyUrl);
  if (!spotifyID) {
    console.error("❌ Invalid Spotify URL");
    return;
  }

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log("[1] Navigating to Spotidown...");
    await page.goto("https://spotidown.app/", { waitUntil: "networkidle2" });

    console.log("[2] Typing Spotify URL...");
    await page.waitForSelector("input#url");
    await page.type("input#url", spotifyUrl);

    console.log('[3] Clicking first "Download" button...');
    await page.click("button#send");

    console.log('[4] Waiting for intermediate "Download MP3" button...');
    await page.waitForSelector("button.abutton.is-success.is-fullwidth", {
      visible: true,
      timeout: 60000,
    });

    console.log('[5] Clicking intermediate "Download MP3"...');
    await page.click("button.abutton.is-success.is-fullwidth");

    console.log("[6] Waiting for final download link...");
    await page.waitForSelector(
      "div.abuttons a.abutton.is-success.is-fullwidth",
      {
        visible: true,
        timeout: 60000,
      }
    );

    const finalLink = await page.$(
      "div.abuttons a.abutton.is-success.is-fullwidth"
    );
    const href = await page.evaluate((el) => el.href, finalLink);
    console.log(`[7] Final download link: ${href}`);

    // Prepare downloads folder
    const downloadsDir = path.join(__dirname, "downloads");
    if (!fs.existsSync(downloadsDir)) fs.mkdirSync(downloadsDir);

    // Filename is just the spotify ID + .mp3
    const filename = `${spotifyID}.mp3`;
    const filePath = path.join(downloadsDir, filename);

    console.log(`[8] Downloading MP3 to ${filePath}...`);

    const file = fs.createWriteStream(filePath);
    https
      .get(href, (response) => {
        if (response.statusCode !== 200) {
          console.error(`❌ HTTP error: ${response.statusCode}`);
          browser.close();
          return;
        }

        response.pipe(file);
        file.on("finish", () => {
          file.close();
          console.log("✅ Download complete!");
          browser.close();
        });
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        console.error("❌ Download error:", err.message);
        browser.close();
      });
  } catch (err) {
    console.error("❌ Script error:", err.message);
    await browser.close();
  }
}

async function downloadTracks(tracks) {
  tracks.forEach(async (track) => {
    await downloadSpotifyMP3(track);
  });
}

function addToTorrent(filePath) {
  const client = new WebTorrent();

  client.on("error", (err) => {
    console.error("❌ WebTorrent error:", err);
  });

  client.on("warning", (warning) => {
    console.warn("⚠️ WebTorrent warning:", warning);
  });

  client.add(filePath, (torrent) => {
    console.log("✅ Seeding:", torrent.infoHash);
    console.log("Magnet URI:", torrent.magnetURI);
    console.log("Files:", torrent.files.map((f) => f.name).join(", "));

    // Optionally, you can keep the torrent alive indefinitely or stop it after some time
    // For example, stop seeding after 1 hour:
    /*
    setTimeout(() => {
      torrent.destroy(() => {
        console.log('Stopped seeding torrent.');
        client.destroy();
      });
    }, 3600 * 1000);
    */
  });

  // Return client instance in case caller wants to manage it (optional)
  return client;
}

// Example usage
const tracks = [
  "https://open.spotify.com/track/3p6xT3Nw30yeAxjggwz5Tt?si=c6ae8f0d9c5b461d",
];
downloadTracks(tracks);
