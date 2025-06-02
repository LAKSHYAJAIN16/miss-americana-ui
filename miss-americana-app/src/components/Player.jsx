import React, { useEffect, useRef, useState } from 'react'
import { assembleArtistString } from './LikedSongs2'
import Innertube from 'youtubei.js'
import { fetchBackend } from '../lib/functions'
import Clapperboard from '../assets/clapperboard2.png'

export default function Player ({ track, playing }) {
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
  const [loadingMV, setloadingMV] = useState(false)
  const [displayMV, setDisplayMV] = useState(false)

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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (disabled) return

    const updateTime = () => setCurrentTime(video.currentTime)
    video.addEventListener('timeupdate', updateTime)

    return () => {
      video.removeEventListener('timeupdate', updateTime)
    }
  }, [])

  useEffect(() => {
    setCurrentTime(0)
    if (track) {
      playSong(track)
    }
  }, [track])

  // When we have the song
  function callback_end () {
    console.log('Video started')

    setCurrentTime(0)
    setDisabled(false)
    setIsPlaying(true)
    sessionStorage.setItem('achieved', 'true')
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
    videoRef.current?.pause()
    setDisabled(true)
    setDuration(track.track.duration_ms / 1000)
    const tube = await Innertube.create({
      fetch: fetchBackend
    })

    // Get the name
    const sr = await tube.search(
      track.track.name +
        ' by ' +
        assembleArtistString(track.track.artists) +
        ' Official Audio'
    )
    const id = sr.results[0]['video_id']
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
    if (!video) return
    if (disabled) return

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
    const vid = getVid(tube, id)

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

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return
    if (disabled) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
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
                <button>{'<<'}</button>
                <button
                  onClick={togglePlay}
                  disabled={disabled}
                  className='w-10 h-10 bg-white text-xl cursor-pointer text-black rounded-full flex items-center justify-center shadow'
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>
                <button>{'>>'}</button>
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
              <img src='/queue.svg' className='w-4 h-4' />
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
          />
        </div>
      )}

      {displayMV && (
        <div className='z-[200] bg-white absolute inset-0 m-auto w-[60%] h-[70%] flex flex-col items-center justify-center shadow-lg rounded-lg shadow-lg'>
          {loadingMV && (
            <h1 className='text-black noto text-4xl text-center '>
              Loading Music Video........
            </h1>
          )}
          {!loadingMV && (
            <div className='flex  w-full p-2 text-black'>
              <p
                className='w-[50%] transitions-all text-left cursor-pointer hover:text-red-500 '
                onClick={() => {
                  setDisplayMV(false)
                  setloadingMV(false)
                  setMvURL('')
                }}
              >
                X
              </p>
              <p
                className='w-[50%] transitions-all text-right cursor-pointer hover:text-green-500'
                onClick={() => {
                  if (mvRef.current) {
                    mvRef.current.requestFullscreen()
                  }
                }}
              >
                Full Screen
              </p>
            </div>
          )}
          <video
            src={mvURL}
            autoPlay
            onLoadedData={() => mv_callback_end()}
            ref={mvRef}
            muted
            className={
              loadingMV
                ? 'w-ful h-full scale-90'
                : 'w-full h-full scale-90 rounded-lg cursor-pointer'
            }
          />
        </div>
      )}
    </>
  )
}
