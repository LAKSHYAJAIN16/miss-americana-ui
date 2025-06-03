import React, { useState, useEffect, useRef } from 'react'
import Shuffle from '../assets/shuffle.png'
import Download from '../assets/download.svg'
import axios from 'axios'
import Cookies from 'js-cookie'
import { fetch } from '@tauri-apps/plugin-http'
import { Innertube } from 'youtubei.js'
import {
  fetchBackend,
  getImageColor,
  getNearestTailwindFromClass
} from '../lib/functions'
import { open, BaseDirectory } from '@tauri-apps/plugin-fs'
import { assembleArtistString } from './LikedSongs2'

export default function StandardPlaylist ({
  token,
  playlist,
  playTrack,
  currentlyPlaying
}) {
  const [tracks, setTracks] = useState([])
  const [color, setColor] = useState(['#FFC0CB', '#FFC0CB', '#FFC0CB'])
  const [render, setRender] = useState(true)
  const [currentSong, setCurrentSong] = useState(null)
  useEffect(() => {
    const fn = async () => {
      console.log(token)
      const res = await axios.get(
        'https://api.spotify.com/v1/playlists/' +
          playlist.id +
          '/tracks?limit=50',
        {
          headers: {
            Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken')
          }
        }
      )
      console.log(res.data)
      console.log(playlist)
      setTracks(res.data.items)
    }
    fn()
  }, [playlist])

  useEffect(() => {
    const fn = async () => {
      try {
        const color_sup = await getImageColor(
          document.getElementById('playlist-image')
        )
        console.log(color_sup)
        setRender(false)
        setColor(color_sup)
        setRender(true)
      } catch {
        setRender(false)
        setColor(['#FFC0CB', '#FFC0CB', '#FFC0CB'])
        setRender(true)
      }
    }
    fn()
  }, [playlist])

  // async function downloadTracks () {
  //   const tube = await Innertube.create({
  //     fetch: fetchBackend
  //   })
  //   console.log('Created Innertube instance!')
  //   // Go one by one and download the tracks
  //   for (let index = 3; index < 9; index++) {
  //     const track = tracks[index]

  //     // Get the name
  //     const sr = await tube.search(
  //       track.track.name +
  //         ' by ' +
  //         assembleArtistString(track.track.artists) +
  //         ' Official Audio'
  //     )
  //     const id = sr.results[0]['video_id']

  //     const video = await tube.getStreamingData(id)
  //     console.log(video.url)
  //     // const savedPath = await invoke('download_video', {
  //     //   url: video.url,
  //     //   filename: 'video.mp4'
  //     // })
  //     // console.log('Video saved at:', savedPath)
  //     const file = await open(track.track.name + '.mp4', {
  //       create: true,
  //       write: true,
  //       baseDir: BaseDirectory.AppLocalData
  //     })
  //     const res = await fetch(video.url)
  //     console.log(res)
  //     await file.write(data)
  //     await file.close()
  //   }
  // }

  return (
    <>
      {render && (
        <div className='ml-2 flex-col flex h-[85vh] overflow-y-scroll rounded-xl max-w-screen-xl w-full mx-auto'>
          <div
            className={
              'bg-gradient-to-b text-white p-8 rounded-xl max-w-screen-xl w-full mx-auto ' +
              getNearestTailwindFromClass('from', color[2]) +
              ' to-[#0d020c] '
            }
          >
            <div className='flex items-end gap-6'>
              <div className='w-44 h-44 rounded shadow-lg bg-gradient-to-brflex items-center justify-center'>
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className='rounded-md w-full h-full object-cover'
                  id='playlist-image'
                />
              </div>
              <div>
                <p className='text-sm font-medium'>Playlist</p>
                <p
                  className={
                    'font-extrabold ml-0 ' +
                    (playlist.name.length < 40 ? 'text-6xl' : 'text-4xl')
                  }
                >
                  {playlist.name}
                </p>
                <p className='text-sm mt-2 text-gray-300'>
                  <span className='font-semibold text-white'>
                    {playlist.owner.display_name}
                  </span>{' '}
                  •{playlist.tracks.total} songs
                </p>
              </div>
            </div>

            <div className='flex items-center gap-6 mt-10'>
              <button
                className={
                  'cursor-pointer w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl font-bold hover:scale-105 transition-transform ' +
                  getNearestTailwindFromClass('bg', color[2])
                }
              >
                &#10073;&#10073;
              </button>
              <button
                className='cursor-pointer text-gray-300 text-2xl hover:scale-110 transition-transform'
                // onClick={() => downloadTracks()}
              >
                <img src={Download} alt='Download' className='w-8 h-8' />
              </button>
            </div>
          </div>
          <div className=''>
            <div className='grid grid-cols-22 gap-4 text-sm border-b border-gray-700 pb-2 mb-2 px-4 '>
              <div className='col-span-1'>#</div>
              <div className='col-span-11'>Title</div>
              <div className='col-span-6'>Album</div>
              <div className='col-span-4'>Date added</div>
            </div>
            {tracks.map((track, index) => (
              <>
                {currentSong == index ? (
                  <>
                    <div
                      key={track.track.name}
                      className='grid grid-cols-22 items-center px-3 py-2 bg-gray-900 rounded-lg transition-all cursor-pointer  '
                    >
                      <div className='col-span-1 text-gray-400'>
                        {index + 1}
                      </div>
                      <div className='col-span-11 flex items-center space-x-3'>
                        <img
                          src={track.track.album.images[0].url}
                          alt={track.track.name}
                          className='w-12 h-12 rounded object-cover'
                        />
                        <div>
                          <div className='font-semibold text-pink-600 truncate'>
                            {track.track.name}
                          </div>
                          <div className='text-gray-300 text-xs'>
                            {assembleArtistString(track.track.artists)}
                          </div>
                        </div>
                      </div>
                      <div className='col-span-6 ml-2 text-sm text-gray-300 truncate'>
                        {track.track.album.name}
                      </div>
                      <div className='col-span-4 text-sm text-gray-400'>
                        {new Date(track.added_at).toDateString()}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      key={track.track.name}
                      onClick={() => {
                        console.log(index);
                        setCurrentSong(index)
                        playTrack(track, index)
                        console.log(currentSong)
                      }}
                      className='grid grid-cols-22 items-center px-3 py-2 hover:bg-gray-800 rounded-lg transition-all cursor-pointer  '
                    >
                      <div className='col-span-1 text-gray-400'>
                        {index + 1}
                      </div>
                      <div className='col-span-11 flex items-center space-x-3'>
                        <img
                          src={track.track.album.images[0].url}
                          alt={track.track.name}
                          className='w-12 h-12 rounded object-cover'
                        />
                        <div>
                          <div className='font-semibold truncate'>
                            {track.track.name}
                          </div>
                          <div className='text-gray-400 text-xs'>
                            {assembleArtistString(track.track.artists)}
                          </div>
                        </div>
                      </div>
                      <div className='col-span-6 ml-2 text-sm text-gray-300 truncate'>
                        {track.track.album.name}
                      </div>
                      <div className='col-span-4 text-sm text-gray-400'>
                        {new Date(track.added_at).toDateString()}
                      </div>
                    </div>
                  </>
                )}
              </>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
