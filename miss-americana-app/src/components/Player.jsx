import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { assembleArtistString } from './LikedSongs2'
import Innertube from 'youtubei.js'
import { fetchBackend } from '../lib/functions'
import { Client } from 'lrclib-api'

import Clapperboard from '../assets/clapperboard2.png'
import Microphone from '../assets/microphone.png'
import NextImage from '../assets/next.png'
import OutImage from '../assets/out.png'
import RemoveImage from '../assets/remove.png'
import MaximizeImage from '../assets/maximize.png'
import MinimizeImage from '../assets/minimize.png'
import { searchYouTube } from '../lib/searchYt'

export default function Player ({ track, playing, superCallback }) {
  const [url, setUrl] = useState('')
  const [mvURL, setMvURL] = useState('')

  const videoRef = useRef(null)
  const mvRef = useRef(null)
  const progressRef = useRef(null)

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isPlaying, setIsPlaying] = useState(true)
  const [volume, setVolume] = useState(1)
  const [disabled, setDisabled] = useState(true)

  const [mvYoutubeURL, setmvYoutubeURL] = useState('')
  const [loadingMV, setloadingMV] = useState(false)
  const [displayMV, setDisplayMV] = useState(false)

  const [displayLyrics, setDisplayLyrics] = useState(false)
  const [lyrics, setLyrics] = useState([])
  const [loadingLyrics, setLoadingLyrics] = useState(false)
  const lyricsModalRef = useRef(null)
  const [currentLyric, setCurrentLyric] = useState({ idx: -1 })
  const [lyricsPosition, setLyricsPosition] = useState({ x: 0, y: 0 })
  const [lyricsSize, setLyricsSize] = useState({ width: 500, height: 600 })
  const [lyricsIsDragging, setLyricsIsDragging] = useState(false)
  const [lyricsOffset, setLyricsOffset] = useState({ x: 0, y: 0 })
  const [lyricsLastFullScreenVariables, setLyricsLastFullScreenVariables] =
    useState([{}, {}])

  const mvModalRef = useRef(null)
  const [mvPosition, setMvPosition] = useState({ x: 0, y: 0 })
  const [mvSize, setLyricSize] = useState({ width: 800, height: 500 })
  const [mvIsDragging, setMvIsDragging] = useState(false)
  const [mvOffset, setMvOffset] = useState({ x: 0, y: 0 })
  const [maximizedState, setMaximizedState] = useState(0)
  const [lastFullScreenVariables, setLastFullScreenVariables] = useState([
    {},
    {}
  ])

  // Handle Dragging
  const handleMvMouseDown = e => {
    setMvIsDragging(true)
    setMvOffset({
      x: e.clientX - mvPosition.x,
      y: e.clientY - mvPosition.y
    })
  }

  const handleLyricMouseDown = e => {
    setLyricsIsDragging(true)
    setLyricsOffset({
      x: e.clientX - lyricsPosition.x,
      y: e.clientY - lyricsPosition.y
    })
  }

  const handleLyricResizeMouseDown = e => {
    e.preventDefault()
    setMaximizedState(0)
    const lyricStartX = e.clientX
    const lyricStartWidth = lyricsModalRef.current.offsetWidth

    const doLyricResize = e => {
      const deltaX = e.clientX - lyricStartX

      // Calculate new width and height based on locked ratio
      const newWidth = Math.max(300, lyricStartWidth + deltaX)
      const newHeight =
        newWidth /
        (lyricsModalRef.current.offsetWidth /
          lyricsModalRef.current.offsetHeight)

      setLyricsSize({ width: newWidth, height: newHeight })
    }

    const stopLyricResize = () => {
      document.removeEventListener('mousemove', doLyricResize)
      document.removeEventListener('mouseup', stopLyricResize)
    }

    document.addEventListener('mousemove', doLyricResize)
    document.addEventListener('mouseup', stopLyricResize)
  }

  // Handle Fullscreen
  const handleLyricFullScreen = () => {
    if (maximizedState == 0) {
      setLyricsLastFullScreenVariables([lyricsPosition, lyricsSize])
      setLyricsSize({
        width:
          (mvModalRef.current.offsetWidth / mvModalRef.current.offsetHeight) *
          window.innerHeight *
          0.98,
        height: window.innerHeight * 0.98
      })
      setLyricsPosition({ x: 0, y: 0 })
      setMaximizedState(1)
    }

    if (maximizedState == 1) {
      setLyricsSize(lyricsLastFullScreenVariables[1])
      setLyricsPosition(lyricsLastFullScreenVariables[0])
      setMaximizedState(0)
    }
  }

  useEffect(() => {
    const handleMvMouseMove = e => {
      if (!mvIsDragging) return
      setMvPosition({
        x: e.clientX - mvOffset.x,
        y: e.clientY - mvOffset.y
      })
    }

    const handleMvMouseUp = () => setMvIsDragging(false)

    document.addEventListener('mousemove', handleMvMouseMove)
    document.addEventListener('mouseup', handleMvMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMvMouseMove)
      document.removeEventListener('mouseup', handleMvMouseUp)
    }
  }, [mvIsDragging, mvOffset])

  useEffect(() => {
    const handleLyricsMouseMove = e => {
      if (!lyricsIsDragging) return
      setLyricsPosition({
        x: e.clientX - lyricsOffset.x,
        y: e.clientY - lyricsOffset.y
      })
    }

    const handleLyricsMouseUp = () => setLyricsIsDragging(false)

    document.addEventListener('mousemove', handleLyricsMouseMove)
    document.addEventListener('mouseup', handleLyricsMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleLyricsMouseMove)
      document.removeEventListener('mouseup', handleLyricsMouseUp)
    }
  }, [lyricsIsDragging, lyricsOffset])

  // Handle Resizing
  const handleMvResizeMouseDown = e => {
    e.preventDefault()
    setMaximizedState(0)
    const mvStartX = e.clientX
    const mvStartWidth = mvModalRef.current.offsetWidth

    const doMvResize = e => {
      const deltaX = e.clientX - mvStartX

      // Calculate new width and height based on locked ratio
      const newWidth = Math.max(550, mvStartWidth + deltaX)
      const newHeight =
        newWidth /
        (mvModalRef.current.offsetWidth / mvModalRef.current.offsetHeight)

      setLyricSize({ width: newWidth, height: newHeight })
    }

    const stopMvResize = () => {
      document.removeEventListener('mousemove', doMvResize)
      document.removeEventListener('mouseup', stopMvResize)
    }

    document.addEventListener('mousemove', doMvResize)
    document.addEventListener('mouseup', stopMvResize)
  }

  // Handle Fullscreen
  const handleMvFullScreen = () => {
    if (maximizedState == 0) {
      setLastFullScreenVariables([mvPosition, mvSize])
      setLyricSize({
        width:
          (mvModalRef.current.offsetWidth / mvModalRef.current.offsetHeight) *
          window.innerHeight *
          0.98,
        height: window.innerHeight * 0.98
      })
      setMvPosition({ x: 0, y: 0 })
      setMaximizedState(1)
    }

    if (maximizedState == 1) {
      setLyricSize(lastFullScreenVariables[1])
      setMvPosition(lastFullScreenVariables[0])
      setMaximizedState(0)
    }
  }

  // Format seconds as mm:ss
  const formatTime = time => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, '0')
    return `${mins}:${secs}`
  }

  const handleVolumeChange = e => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    if (videoRef.current) {
      videoRef.current.volume = vol
    }
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (disabled) return

    const updateTime = () => {
      if (!isDragging) setCurrentTime(video.currentTime)
    }

    video.addEventListener('timeupdate', updateTime)
    return () => video.removeEventListener('timeupdate', updateTime)
  }, [isDragging, disabled])

  const handleSeek = e => {
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.min(
      Math.max((e.clientX - rect.left) / rect.width, 0),
      1
    )
    const newTime = percent * duration
    videoRef.current.currentTime = newTime

    if (mvRef.current) mvRef.current.currentTime = newTime

    setCurrentTime(newTime)
  }

  const startDrag = () => {
    if (disabled) return
    setIsDragging(true)
  }
  const stopDrag = e => {
    if (disabled) return
    setIsDragging(false)
    handleSeek(e)
  }

  const handleDrag = e => {
    if (!isDragging) return
    handleSeek(e)
  }

  useEffect(() => {
    if (!isDragging) return
    if (disabled) return
    window.addEventListener('mousemove', handleDrag)
    window.addEventListener('mouseup', stopDrag)
    return () => {
      window.removeEventListener('mousemove', handleDrag)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [isDragging])

  // useLayoutEffect(() => {
  //   const video = videoRef.current
  //   if (disabled) return

  //   const updateTime = () => {
  //     console.log(video.currentTime)
  //     console.log(lyrics[currentLyric.idx + 1]['startTime'])
  //     setCurrentTime(video.currentTime)
  //     if (currentLyric.idx == lyrics.length - 1) return

  //     const lTime = lyrics[currentLyric.idx + 1]['startTime']
  //     if (video.currentTime > lTime) {
  //       console.log('YES')
  //       document
  //         .getElementById('lyric:' + (currentLyric.idx + 1).toString())
  //         .scrollIntoView({ behavior: 'smooth', block: 'center' })

  //       setCurrentLyric({
  //         ...lyrics[currentLyric.idx + 1],
  //         idx: currentLyric.idx + 1
  //       })
  //     }
  //   }
  //   document.getElementById('vid').addEventListener('timeupdate', updateTime)

  //   return () => {
  //     document
  //       .getElementById('vid')
  //       .removeEventListener('timeupdate', updateTime)
  //   }
  // }, [])

  useEffect(() => {
    setCurrentTime(0)
    if (track) {
      playSong(track)
    }
  }, [track])

  // When we have the song
  async function callback_end () {
    console.log('Video started')

    setCurrentTime(0)
    setDisabled(false)
    setIsPlaying(true)
    sessionStorage.setItem('achieved', 'true')

    if (displayMV == true) {
      musicvideocallback()
    }
  }

  //   When we have the MV
  function mv_callback_end () {
    console.log('MV started')
    mvRef.current.currentTime = videoRef.current.currentTime
    sessionStorage.setItem('achievedMV', 'true')
    setDisplayMV(true)
    setloadingMV(false)
  }

  async function getVid (tube, id) {
    for (let i = 0; i < 100000; i++) {
      try {
        const video = await tube.getStreamingData(id)
        console.log(video.url)
        return video
      } catch (e) {
        console.log(e)
        console.log('fail!')
      }
    }
  }

  async function playSong (track) {
    if (displayMV) {
      setloadingMV(true)
    }
    videoRef.current?.pause()
    setDisabled(true)
    setDuration(track.track.duration_ms / 1000)
    const tube = await Innertube.create({
      fetch: fetchBackend
    })

    // Get the name
    console.log("yeah. we're here")
    const sr = await searchYouTube(
      track.track.name +
        ' by ' +
        assembleArtistString(track.track.artists) +
        ' Official Audio'
    )
    const id = sr[0]
    console.log(id)

    const video = await getVid(tube, id)
    sessionStorage.setItem('achieved', 'false')
    setUrl("''")

    async function reopenTab () {
      setUrl('')
      await new Promise(resolve => setTimeout(resolve, 100))
      setUrl(video.url)
    }

    // Reopen every 10 seconds (be careful — this is annoying!)
    for (let i = 0; i < 100000; i++) {
      if (sessionStorage.getItem('achieved') === 'true') {
        console.log('Achieved, stopping reopening')
        break
      }

      console.log('Reopening tab...')
      await reopenTab()
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  async function musicvideocallback () {
    const video = videoRef.current
    if (!video && !displayMV) return
    if (disabled && !displayMV) return
    console.log('made it to here')
    setDisplayMV(true)
    setloadingMV(true)
    // Open the music video in a new tab
    const tube = await Innertube.create({
      fetch: fetchBackend
    })

    // Get the name
    const sr = await tube.search(
      track.track.name +
        ' by ' +
        assembleArtistString(track.track.artists) +
        ' Official Music Video'
    )
    const id = sr.results[0]['video_id']
    setmvYoutubeURL('https://www.youtube.com/watch?v=' + id)
    const vid = await getVid(tube, id)

    sessionStorage.setItem('achievedMV', 'false')
    setMvURL("''")

    async function reopenTab () {
      setMvURL('')
      await new Promise(resolve => setTimeout(resolve, 100))
      setMvURL(vid.url)
    }

    // Reopen every 10 seconds (be careful — this is annoying!)
    for (let i = 0; i < 100000; i++) {
      if (sessionStorage.getItem('achievedMV') === 'true') {
        console.log('Achieved, stopping reopening')
        break
      }

      console.log('Reopening tab...')
      await reopenTab()
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  async function lyricCallback () {
    if (displayLyrics == true) {
      setDisplayLyrics(false)
    } else {
      setDisplayLyrics(true)
      setLoadingLyrics(true)
      setCurrentLyric({ idx: -1 })
      const client = new Client()
      const query = {
        track_name: track.track.name,
        artist_name: assembleArtistString(track.track.artists)
      }

      const syncedLyrics = await client.getSynced(query)
      if (syncedLyrics == null) {
        setLoadingLyrics(false)
      } else {
        setLyrics(syncedLyrics)
        setLoadingLyrics(false)
      }
    }
  }

  const updateTime = () => {
    const video = videoRef.current
    if (currentLyric.idx == lyrics.length - 1) return
    if (lyrics.length <= 0) return
    console.log(
      video.currentTime + ' : ' + lyrics[currentLyric.idx + 1]['startTime']
    )
    setCurrentTime(video.currentTime)
    const lTime = lyrics[currentLyric.idx + 1]['startTime']
    if (video.currentTime > lTime) {
      console.log('YES')
      document
        .getElementById('lyric:' + (currentLyric.idx + 1).toString())
        .scrollIntoView({ behavior: 'smooth', block: 'center' })

      setCurrentLyric({
        ...lyrics[currentLyric.idx + 1],
        idx: currentLyric.idx + 1
      })
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (disabled) return

    if (video.paused) {
      video.play()
      mvRef.current?.play()
      setIsPlaying(true)
    } else {
      video.pause()
      mvRef.current?.pause()
      setIsPlaying(false)
    }
  }

  // Play-Pause
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [disabled])

  return (
    <>
      {playing && (
        <div
          className={
            'noto bottom-0 left-1/2 transform -translate-x-1/2 fixed w-[90%]  shadow-md p-4 h-20 z-50 rounded-lg ml-auto mr-auto ' +
            (disabled ? 'bg-gray-500' : 'bg-gray-900')
          }
        >
          <div className='flex items-center justify-between h-full w-full'>
            {/* Left: Song Info */}
            <div className='flex items-center gap-4 w-[30%]'>
              <img
                src={track.track.album.images[0].url}
                alt={track.track.name}
                className='w-14 h-14 rounded'
              />
              <div className='flex flex-col'>
                <span className='text-sm font-bold'>{track.track.name}</span>
                <span className='text-xs font-semibold text-gray-600'>
                  {assembleArtistString(track.track.artists)}
                </span>
              </div>
            </div>

            {/* Center: Controls */}
            <div className='flex flex-col items-center w-[40%]'>
              <div className='flex items-center gap-4 mb-2'>
                {/* <img src='/shuffle.svg' className='w-4 h-4 text-green-500' /> */}
                <button
                  className='cursor-pointer'
                  onClick={() => superCallback('prev')}
                  disabled={disabled}
                >
                  <img
                    src={NextImage}
                    width={17}
                    height={17}
                    className='rotate-180 hover:scale-105 transition-all'
                  />
                </button>
                <button
                  onClick={togglePlay}
                  disabled={disabled}
                  className='w-10 h-10 bg-white text-xl cursor-pointer text-black rounded-full flex items-center justify-center shadow'
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>
                <button
                  className='cursor-pointer'
                  onClick={() => superCallback('next')}
                  disabled={disabled}
                >
                  <img
                    src={NextImage}
                    width={17}
                    height={17}
                    className='hover:scale-105 transition-all'
                  />
                </button>
                {/* <img src='/queue.svg' className='w-4 h-4 text-green-500' /> */}
              </div>
              <div className='flex items-center gap-2 w-full'>
                <span className='text-xs text-white'>
                  {formatTime(currentTime)}
                </span>
                <div
                  className='relative w-full h-2 bg-gray-300 rounded cursor-pointer'
                  ref={progressRef}
                  onMouseDown={handleSeek}
                >
                  <div
                    className='h-full bg-pink-500 rounded'
                    style={{
                      width: disabled
                        ? '0%'
                        : duration
                        ? `${(currentTime / duration) * 100}%`
                        : '0%'
                    }}
                  ></div>

                  {/* Knob */}
                  <div
                    className='absolute top-1/2 -translate-y-1/2 mt-[0.25em] w-2 h-2 bg-white border border-black rounded-full shadow'
                    style={{
                      left: duration
                        ? `${(currentTime / duration) * 100}%`
                        : '0%',
                      transform: 'translate(-50%, -50%)'
                    }}
                    onMouseDown={startDrag}
                  ></div>
                </div>
                <span className='text-xs text-white'>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Right: Volume & Controls */}
            <div className='flex items-center gap-4 w-[30%] justify-end'>
              <img src='/device.svg' className='w-4 h-4 text-green-500' />
              <img src='/lyrics.svg' className='w-4 h-4' />
              <div>
                <img
                  src={Microphone}
                  className='w-4 h-4 cursor-pointer hover:scale-110 transition-transform'
                  onClick={() => lyricCallback()}
                />
              </div>
              <div>
                <img
                  src={Clapperboard}
                  className='w-4 h-4 cursor-pointer hover:scale-110 transition-transform'
                  onClick={() => musicvideocallback()}
                />
              </div>
              <label
                htmlFor='volume'
                className='text-lg cursor-pointer'
                onClick={() => {
                  if (disabled) return
                  setVolume(0)
                }}
              >
                🔊
              </label>
              <input
                id='volume'
                type='range'
                min='0'
                max='1'
                step='0.01'
                value={volume}
                onChange={handleVolumeChange}
                className='w-[30%] accent-pink-500 -ml-2 cursor-pointer'
                disabled={disabled}
              />
              {/* <img src='/fullscreen.svg' className='w-4 h-4' /> */}
            </div>
          </div>
          <video
            src={url}
            className='hidden'
            autoPlay
            onLoadedMetadata={() => callback_end()}
            ref={videoRef}
            id='vid'
            onTimeUpdate={() => updateTime()}
          />
        </div>
      )}

      {/* MV */}
      {displayMV && (
        <div
          className='z-[200] bg-gradient-to-b from-pink-900 to-pink-700 text-white absolute inset-0 m-auto w-[55%] h-[65%] flex flex-col items-center justify-center shadow-lg rounded-lg shadow-lg'
          ref={mvModalRef}
          style={{
            left: mvPosition.x,
            top: mvPosition.y,
            width: mvSize.width,
            height: mvSize.height
          }}
        >
          <div className='w-full'>
            {loadingMV && (
              <>
                <div
                  className='absolute top-3 h-full w-full cursor-grab'
                  onMouseDown={handleMvMouseDown}
                >
                  <button
                    className='w-[100%] ml-3 text-xl transitions-all text-left cursor-pointer hover:text-red-500 '
                    onClick={() => {
                      setDisplayMV(false)
                      setloadingMV(false)
                      setMvURL('')
                    }}
                  >
                    <img src={RemoveImage} width={30} height={30} alt='Close' />
                  </button>
                  <h1
                    className='noto text-4xl text-center mt-[20%]'
                    onMouseDown={handleMvMouseDown}
                  >
                    Loading Music Video....
                  </h1>
                </div>
              </>
            )}
            {!loadingMV && (
              <div
                className='unselectable mt-3 mb-1 flex w-full cursor-grab'
                onMouseDown={handleMvMouseDown}
              >
                <button
                  className='w-[50%] ml-3 text-xl transitions-all text-left cursor-grab hover:text-red-500 '
                  onClick={() => {
                    setDisplayMV(false)
                    setloadingMV(false)
                    setMvURL('')
                  }}
                >
                  <img
                    src={RemoveImage}
                    width={30}
                    height={30}
                    alt='Close'
                    className='cursor-pointer'
                  />
                </button>
                <p className='w-[50%] transitions-all flex justify-end mr-3'>
                  <img
                    src={OutImage}
                    width={30}
                    height={30}
                    alt='Exit'
                    className='mr-3 cursor-pointer'
                    onClick={() => window.open(mvYoutubeURL)}
                  />
                  <img
                    src={maximizedState == 0 ? MaximizeImage : MinimizeImage}
                    width={30}
                    height={30}
                    alt={maximizedState == 0 ? 'Full Screen' : 'Minimize'}
                    onClick={() => handleMvFullScreen()}
                    className='cursor-pointer'
                  />
                </p>
                <h1 className='absolute font-bold text-md ml-[50px] truncate'>
                  Music Video
                </h1>
              </div>
            )}
          </div>

          <video
            src={mvURL}
            autoPlay
            onLoadedMetadata={() => mv_callback_end()}
            ref={mvRef}
            muted
            className={
              loadingMV
                ? 'hidden'
                : 'w-full h-full rounded-b-xl cursor-grab object-cover'
            }
            onMouseDown={handleMvMouseDown}
          />

          <div
            className='absolute bottom-0 right-0 w-4 h-4 bg-white cursor-nw-resize'
            onMouseDown={handleMvResizeMouseDown}
          />
        </div>
      )}

      {/* Lyrics */}
      {displayLyrics && (
        <div
          className='z-[200] bg-gradient-to-b from-gray-900 to-gray-800 text-white absolute inset-0 m-auto w-[55%] h-[90%] flex flex-col items-center justify-center shadow-lg rounded-lg shadow-lg'
          ref={lyricsModalRef}
          style={{
            left: lyricsPosition.x,
            top: lyricsPosition.y,
            width: lyricsSize.width,
            height: lyricsSize.height
          }}
        >
          <div className='w-full'>
            {loadingLyrics && (
              <>
                <div className='absolute top-3 h-full w-full cursor-grab'>
                  <button
                    className='w-[100%] ml-3 text-xl transitions-all text-left cursor-pointer hover:text-red-500 '
                    onClick={() => {
                      setDisplayLyrics(false)
                      setLoadingLyrics(false)
                      setLyrics([])
                    }}
                  >
                    <img src={RemoveImage} width={30} height={30} alt='Close' />
                  </button>
                  <h1 className='noto text-4xl text-center mt-[20%]'>
                    Loading Lyrics........
                  </h1>
                </div>
              </>
            )}
            {!loadingLyrics && (
              <div
                className='justify-center flex flex-col cursor-grab unselectable'
                onMouseDown={handleLyricMouseDown}
              >
                <div className=' mt-2 mb-1  flex w-full'>
                  <button
                    className='w-[50%] ml-3 text-xl transitions-all text-left  cursor-grab hover:text-red-500 '
                    onClick={() => {
                      setDisplayLyrics(false)
                      setLoadingLyrics(false)
                      setLyrics([])
                    }}
                  >
                    <img
                      src={RemoveImage}
                      width={30}
                      height={30}
                      alt='Close'
                      className='cursor-pointer'
                    />
                  </button>

                  <p className='w-[50%] transitions-all flex justify-end mr-3 cursor-grab'>
                    <img
                      src={maximizedState == 0 ? MaximizeImage : MinimizeImage}
                      width={30}
                      height={30}
                      alt={maximizedState == 0 ? 'Full Screen' : 'Minimize'}
                      onClick={() => handleLyricFullScreen()}
                      className='cursor-pointer'
                    />
                  </p>
                  <h1 className='absolute font-bold text-md ml-[50px] truncate'>
                    Lyrics
                  </h1>
                </div>
                <div
                  className={'overflow-y-scroll ml-6 pr-6 mb-2 mt-2'}
                  style={{ height: lyricsSize.height - 60 }}
                >
                  {lyrics.length > 0 ? (
                    <>
                      {lyrics.map((e, idx) => (
                        <div
                          key={idx}
                          onMouseDown={handleLyricMouseDown}
                          className={
                            maximizedState == 0 ? 'text-3xl' : 'text-4xl'
                          }
                        >
                          {idx == currentLyric.idx ? (
                            <h2
                              id={'lyric:' + idx.toString()}
                              className='unselectable  cursor-pointer font-bold mb-4 text-white'
                            >
                              {e.text}
                            </h2>
                          ) : (
                            <h2
                              id={'lyric:' + idx.toString()}
                              className='unselectable  cursor-pointer font-bold mb-4 hover:text-white text-gray-300 opacity-85'
                            >
                              {e.text}
                            </h2>
                          )}
                        </div>
                      ))}
                    </>
                  ) : (
                    <h1>Couldn't find any lyrics.</h1>
                  )}
                </div>
              </div>
            )}
          </div>

          <div
            className='absolute bottom-0 right-0 w-4 h-4 bg-white cursor-nw-resize'
            onMouseDown={handleLyricResizeMouseDown}
          />
        </div>
      )}
    </>
  )
}
