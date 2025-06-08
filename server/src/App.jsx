import { Innertube } from 'youtubei.js'
import React from 'react'
import './App.css'

function App () {
  const [txt, setTxt] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [iterations, setIterations] = React.useState('')
  async function run () {
    function fetchFn1 (input, init) {
      const url =
        typeof input === 'string'
          ? new URL(input)
          : input instanceof URL
          ? input
          : new URL(input.url)

      // Transform the URL for use with the proxy
      url.searchParams.set('__host', url.host)
      url.host = 'localhost:8080'
      url.protocol = 'http'

      // Handle headers
      let headers
      if (init && init.headers) {
        headers = new Headers(init.headers)
      } else if (input instanceof Request) {
        headers = new Headers(input.headers)
      } else {
        headers = new Headers()
      }

      // Serialize headers
      url.searchParams.set('__headers', JSON.stringify([...headers]))

      // Delete user-agent header (not allowed in browser)
      headers.delete('user-agent')

      // Copy request if input is a Request
      const request = new Request(
        url,
        input instanceof Request ? input : undefined
      )

      // Perform the fetch with updated URL and headers
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
    console.log('Innertube created')
    console.log(txt)
    const res = await innertube.search(txt)
    console.log(res)
    const vid_url = res.results[0]['video_id']
      ? res.results[0]['video_id']
      : res.results[1]['video_id']
      ? res.results[1]['video_id']
      : res.results[2]['video_id']
      ? res.results[2]['video_id']
      : res.results[3]['video_id']
      ? res.results[3]['video_id']
      : res.results[4]['video_id']
    console.log('Video URL:', vid_url)
    console.log(vid_url)
    const urlA = await innertube.getStreamingData(vid_url)
    console.log(urlA)
    let w
    console.log(w)
    setUrl(urlA.url)

    async function reopenTab () {
      setUrl('')
      await new Promise(resolve => setTimeout(resolve, 100))
      setUrl(urlA.url)
    }

    // Reopen every 10 seconds (be careful — this is annoying!)
    for (let i = 0; i < 1000000; i++) {
      if (sessionStorage.getItem('achieved') === 'true') {
        console.log('Achieved, stopping reopening')
        break
      }

      console.log('Reopening tab...')
      await reopenTab()
      await new Promise(resolve => setTimeout(resolve, 300))
      setIterations(i + 1)
    }
  }

  function callback_end () {
    console.log('Video ended')
    sessionStorage.setItem('achieved', 'true')
    // Do something when the video ends, like showing a message
  }
  async function run2 () {
    function fetchFn (input, init = {}) {
      const origUrl =
        typeof input === 'string'
          ? input
          : input instanceof URL
          ? input.href
          : input.url

      const newUrl = origUrl.replace('https://www.youtube.com', '/ytproxy')

      const headers = new Headers(
        init?.headers || (input instanceof Request ? input.headers : {})
      )

      // REQUIRED headers for youtubei.js to work
      headers.set('x-youtube-client-name', '1') // 1 = WEB, 2 = ANDROID
      headers.set('x-youtube-client-version', '2.20230504.01.00')
      headers.set('origin', 'https://www.youtube.com')
      headers.set('referer', 'https://www.youtube.com/')
      headers.set('content-type', 'application/json')

      // Remove user-agent (not allowed by browsers)
      headers.delete('user-agent')

      return fetch(newUrl, {
        ...init,
        headers
      })
    }

    const innertube = await Innertube.create({ fetch: fetchFn })
    console.log('Innertube created')
    const res = await innertube.getBasicInfo('dpvQqmX6SUI')
    console.log(res)
  }

  async function run3 () {
    function fetchFn1 (input, init) {
      const url =
        typeof input === 'string'
          ? new URL(input)
          : input instanceof URL
          ? input
          : new URL(input.url)

      // Transform the URL for use with the proxy
      url.searchParams.set('__host', url.host)
      url.host = 'localhost:8080'
      url.protocol = 'http'

      // Handle headers
      let headers
      if (init && init.headers) {
        headers = new Headers(init.headers)
      } else if (input instanceof Request) {
        headers = new Headers(input.headers)
      } else {
        headers = new Headers()
      }

      // Serialize headers
      url.searchParams.set('__headers', JSON.stringify([...headers]))

      // Delete user-agent header (not allowed in browser)
      headers.delete('user-agent')

      // Copy request if input is a Request
      const request = new Request(
        url,
        input instanceof Request ? input : undefined
      )

      // Perform the fetch with updated URL and headers
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

    const innertube = await Innertube.create({ fetch: fetchFn1 })
    console.log('Innertube created')
    const res = await innertube.search(txt)
    const vid_url = res.results[0]['video_id']
    console.log(vid_url)
    const urlA = await innertube.getStreamingData(vid_url)
    console.log(urlA)
    setUrl(urlA.url)
  }

  return (
    <>
      <h1>Test LOL</h1>
      <div className='card'>
        <button onClick={() => run()}>Run Regular</button>
        <button onClick={() => run2()}>Run Proxy</button>
        <button onClick={() => run3()}>Run CORS Proxy</button>
        <h1>{iterations}</h1>
        <br />
        <br />
        <input onChange={e => setTxt(e.target.value)}></input>
        <br />
        <br />
        <video
          src={url}
          autoPlay
          controls
          onLoadedData={() => callback_end()}
        />
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className='read-the-docs'>
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
