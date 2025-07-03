#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');
const youtubedl = require('youtube-dl-exec'); // we'll call this with bin option

const appName = 'YoutubeBatchDownloader';

// Temp folder for extracted binary
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), appName + '-'));
const isPkg = typeof process.pkg !== 'undefined';

// Function to extract bundled binary to tmp folder
function extractYtDlp() {
  // When running inside pkg, __dirname points inside snapshot - readFileSync works fine on assets
  // Outside pkg, just return normal path

  const localBinaryPath = path.join(__dirname, 'bin', 'yt-dlp.exe');
  const targetBinaryPath = path.join(tmpDir, 'yt-dlp.exe');

  if (fs.existsSync(targetBinaryPath)) {
    return targetBinaryPath; // Already extracted
  }

  let binaryData;

  if (isPkg) {
    // inside pkg, read the bundled binary as buffer
    binaryData = fs.readFileSync(path.join(process.execPath, '..', 'bin', 'yt-dlp.exe'));
  } else {
    // running normally from source
    binaryData = fs.readFileSync(localBinaryPath);
  }

  fs.writeFileSync(targetBinaryPath, binaryData);
  fs.chmodSync(targetBinaryPath, 0o755);

  return targetBinaryPath;
}

async function main() {
  // Determine output folders under LOCALAPPDATA or ~/.appname
  const localAppData =
    process.platform === 'win32'
      ? process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local')
      : path.join(os.homedir(), `.${appName.toLowerCase()}`);

  const outputDir = path.join(localAppData, appName, 'downloads');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const inputs = process.argv.slice(2);

  if (inputs.length === 0) {
    console.log(
      '❌ No YouTube URLs provided.\nUsage:\n  program.exe <url1> <url2> ... (up to 10)'
    );
    process.exit(1);
  }

  if (inputs.length > 10) {
    console.log('❌ Please provide 10 or fewer videos per batch.');
    process.exit(1);
  }

  // Extract yt-dlp.exe from bundle to tmp folder
  const ytDlpPath = extractYtDlp();

  console.log(`🎧 Starting download of ${inputs.length} video(s)...\n`);

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const filename = `song_${i + 1}.%(ext)s`;
    const outputPath = path.join(outputDir, filename);

    try {
      console.log(`➡️  [${i + 1}] Downloading: ${input}`);

      await youtubedl(input, {
        bin: ytDlpPath,
        output: outputPath,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot'],
      });

      console.log(`✅  Saved: ${filename.replace('%(ext)s', 'mp3')}\n`);
    } catch (err) {
      console.error(`❌  Failed [${i + 1}]: ${JSON.stringify(err)}\n`);
    }
  }

  console.log('🎉 All downloads complete.');
}

main();
