const { Innertube } = require('youtubei.js')
const { promises, writeFileSync } = require('fs')
const { parse } = require('csv')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')
const ffmpegPath = require('ffmpeg-static')
const zlib = require('zlib')

async function main () {
  const dat = await promises.readFile('spotify_songs.csv')
  const records = []
  const parser = parse(dat)
  // Use the readable stream api to consume records
  parser.on('readable', function () {
    let record
    while ((record = parser.read()) !== null) {
      records.push(record)
    }
  })
  // Catch any error
  parser.on('error', function (err) {
    console.error(err.message)
  })
  // Test that the parsed records matched the expected records
  parser.on('end', async function () {
    console.log(records.length)
    const innertube = await Innertube.create({})
    let out_fn = [
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]

    async function getYT (name, id) {
      try {
        const res = await innertube.search(name, { type: 'video' })
        const vid_url = res.results[0]['video_id']
          ? res.results[0]['video_id']
          : res.results[1]['video_id']
          ? res.results[1]['video_id']
          : res.results[2]['video_id']
          ? res.results[2]['video_id']
          : res.results[3]['video_id']
          ? res.results[3]['video_id']
          : res.results[4]['video_id']
        try {
          const urlA = await innertube.getStreamingData(vid_url)
          const url = urlA.url
          console.log([id, vid_url, url])

          try {
            console.log('INITIATING FFMPEG')
            console.log(
              '⚡ Downloading video and extracting compressed audio...'
            )

            let videoStream = null
            for (let index = 0; index < 200; index++) {
              try {
                videoStream = await axios({
                  url: url,
                  method: 'GET',
                  responseType: 'stream'
                })
                break
              } catch {
                console.log('try ' + index.toString())
              }
            }
            if (videoStream == null) {
              throw TypeError('tries failed broski')
            }

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
              console.log('FOUND BASE64')

              out_fn.push([id, vid_url, url, base64Audio])

              if (out_fn.length > 10) {
                writeFileSync(
                  './data/' + Date.now() + '.json',
                  JSON.stringify(out_fn)
                )
                console.log('SAVED')
                out_fn = []
              }
            })
          } catch (err) {
            console.error('❌ Error:', err.message)
          }
        } catch {}
      } catch {
        console.log('error!')
      }
    }
    await getYT('Lovers by Anna of the North', '6q8onrzcka32nGVrnWYGBQ')
    for (let index = 1290; index < records.length; index++) {
      await getYT(records[index][1], records[index][0])
      writeFileSync('current.txt', index.toString())
    }
  })
}

main()
