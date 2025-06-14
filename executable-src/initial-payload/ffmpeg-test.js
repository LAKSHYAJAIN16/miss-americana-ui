#!/usr/bin/env node

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const ffmpegPath = require('ffmpeg-static')
const zlib = require('zlib')

const VIDEO_URL = process.argv[2]
const OUTPUT_FILE = process.argv[3] || 'audio_base64.txt'

if (!VIDEO_URL) {
  console.error('Usage: ./ffmpeg-test.js <direct_video_url> [output_file.txt]')
  process.exit(1)
}

;(async () => {
  try {
    console.log('⚡ Downloading video and extracting compressed audio...')

    const videoStream = await axios({
      url: VIDEO_URL,
      method: 'GET',
      responseType: 'stream'
    })

    const ffmpeg = spawn(ffmpegPath, [
      '-i',
      'pipe:0',
      '-ss',
      '0',
      '-t',
      '10', // longer duration (20s)
      '-vn',
      '-map_metadata',
      '-1', // strip metadata for cleaner output
      '-c:a',
      'libopus',
      '-b:a',
      '24k', // higher bitrate for better quality
      '-ac',
      '2', // stereo audio (use 2 channels)
      '-f',
      'opus', // raw opus container for minimal overhead
      'pipe:1'
    ])

    videoStream.data.on('error', err => {
      console.error('❌ Video stream error:', err.message)
      ffmpeg.stdin.end()
    })

    ffmpeg.stdin.on('error', err => {
      if (err.code !== 'EPIPE') {
        console.error('❌ ffmpeg.stdin error:', err)
      }
    })

    videoStream.data.pipe(ffmpeg.stdin)

    const chunks = []
    ffmpeg.stdout.on('data', chunk => chunks.push(chunk))

    let ffmpegStderr = ''
    ffmpeg.stderr.on('data', data => {
      ffmpegStderr += data.toString()
    })

    ffmpeg.on('close', code => {
      if (code !== 0) {
        console.error(`❌ ffmpeg exited with code ${code}`)
        console.error('ffmpeg stderr:', ffmpegStderr.trim())
        return
      }

      const audioBuffer = Buffer.concat(chunks)

      // Compress audio buffer using gzip before base64 encoding
      const compressedBuffer = zlib.gzipSync(audioBuffer)

      //   const base64Audio = compressedBuffer.toString('base64')
      const base64Audio = audioBuffer.toString('base64')
      console.log(base64Audio.length)
      fs.writeFileSync(path.resolve(OUTPUT_FILE), base64Audio)
      console.log(`✅ Compressed Base64 audio written to: ${OUTPUT_FILE}`)
      console.log(
        `ℹ️ Note: The output is gzip compressed, decompress before decoding base64 to get the raw opus audio.`
      )
    })
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
})()
