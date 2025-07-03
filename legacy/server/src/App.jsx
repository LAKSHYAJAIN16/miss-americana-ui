import React from 'react'
import { Innertube } from 'youtubei.js'
import './App.css'

function App () {
  const [txt, setTxt] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [iterations, setIterations] = React.useState('')
  const videoRef = React.useRef(null)

  async function run () {
    function fetchFn1 (input, init) {
      const url =
        typeof input === 'string'
          ? new URL(input)
          : input instanceof URL
          ? input
          : new URL(input.url)

      url.searchParams.set('__host', url.host)
      url.host = 'localhost:8080'
      url.protocol = 'http'

      let headers
      if (init && init.headers) {
        headers = new Headers(init.headers)
      } else if (input instanceof Request) {
        headers = new Headers(input.headers)
      } else {
        headers = new Headers()
      }

      url.searchParams.set('__headers', JSON.stringify([...headers]))
      headers.delete('user-agent')

      const request = new Request(
        url,
        input instanceof Request ? input : undefined
      )

      return fetch(
        request,
        init
          ? {
              ...init,
              headers
            }
          : {
              headers
            }
      )
    }

    sessionStorage.setItem('achieved', 'false')
    setIterations(0)
    const innertube = await Innertube.create({ fetch: fetchFn1 })
    const res = await innertube.search(txt)
    const vid_url =
      res.results[0]?.video_id ??
      res.results[1]?.video_id ??
      res.results[2]?.video_id ??
      res.results[3]?.video_id ??
      res.results[4]?.video_id

    const urlA = await innertube.getStreamingData(vid_url)

    setUrl(urlA.url)

    async function reopenTab () {
      setUrl('')
      await new Promise(resolve => setTimeout(resolve, 100))
      setUrl(urlA.url)
    }

    for (let i = 0; i < 1000000; i++) {
      if (sessionStorage.getItem('achieved') === 'true') break
      await reopenTab()
      await new Promise(resolve => setTimeout(resolve, 300))
      setIterations(i + 1)
    }
  }

  // Audio capture & download from video element
  async function captureAudio () {
    const video = videoRef.current
    if (!video) return alert('Video element not found')
    if (!video.captureStream)
      return alert('captureStream API not supported in this browser')

    const stream = video.captureStream()
    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0)
      return alert('No audio track found on video')

    const audioStream = new MediaStream(audioTracks)
    const recorder = new MediaRecorder(audioStream, { mimeType: 'audio/webm' })
    const chunks = []

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = 'extracted-audio.webm'
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }, 100)
    }

    recorder.start()
    setTimeout(() => recorder.stop(), 5000)
  }

  function callback_end () {
    sessionStorage.setItem('achieved', 'true')
  }

  return (
    <>
      <h1>Test LOL</h1>
      <div className="card">
        <button onClick={() => run()}>Run Regular</button>
        <h1>{iterations}</h1>
        <br />
        <input onChange={e => setTxt(e.target.value)} />
        <br />
        <br />
        <video
          ref={videoRef}
          src={url}
          autoPlay
          controls
          onEnded={callback_end}
          style={{ maxWidth: '100%' }}
        />
        <br />
        <button onClick={captureAudio}>Extract & Download Audio (5 sec)</button>
        <p>Edit <code>src/App.jsx</code> and save to test HMR</p>
      </div>
    </>
  )
}

export default App
