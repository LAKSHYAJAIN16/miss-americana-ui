import React, { useState, useEffect } from 'react'
import Shuffle from '../assets/shuffle.png'
import Download from '../assets/download.svg'
import axios from 'axios'
import Cookies from 'js-cookie'
import { fetch } from '@tauri-apps/plugin-http'
import { Innertube } from 'youtubei.js'
import { fetchBackend } from '../lib/functions'
import { open, BaseDirectory } from '@tauri-apps/plugin-fs'

export function assembleArtistString (artists) {
  let str = ''
  for (const artist in artists) {
    if (Object.prototype.hasOwnProperty.call(artists, artist)) {
      const element = artists[artist]
      str += element.name + ', '
    }
  }
  str = str.slice(0, -2) // Remove the last comma and space
  return str
}

export default function LikedSongs ({
  token,
  playTrack,
  currentlyPlaying,
  setTracksSuper,
  trackidx
}) {
  const [tracks, setTracks] = useState([])
  const [currentSong, setCurrentSong] = useState(null)

  useEffect(() => {
    const fn = async () => {
      // console.log(token)
      const res = await axios.get(
        'https://api.spotify.com/v1/me/tracks?limit=50',
        {
          headers: {
            Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken')
          }
        }
      )
      // console.log(res.data)
      setTracks(res.data.items)
      setTracksSuper(res.data.items)
    }
    fn()
  }, [token])

  useEffect(() => {
    if (trackidx != currentSong) {
      setCurrentSong(trackidx)
    }
  }, [trackidx])

  return (
    <div
      className={
        'ml-2 flex-col flex overflow-y-scroll rounded-xl max-w-screen-xl w-full mx-auto' +
        (currentlyPlaying ? ' h-[75vh]' : ' h-[85vh]')
      }
    >
      <div className='bg-gradient-to-b from-pink-900 to-[#0d020c] text-white p-8 rounded-xl max-w-screen-xl w-full mx-auto'>
        <div className='flex items-end gap-6'>
          <div className='w-44 h-44 rounded shadow-lg bg-gradient-to-br from-pink-600 to-cyan-200 flex items-center justify-center'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='w-12 h-12 text-white'
              viewBox='0 0 24 24'
              fill='currentColor'
            >
              <path
                d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
                     2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
                     C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 
                     22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
              />
            </svg>
          </div>
          <div>
            <p className='text-sm font-medium'>Playlist</p>
            <p className='text-8xl font-extrabold ml-0'>Liked Songs</p>
            <p className='text-sm mt-2 text-gray-300'>
              <span className='font-semibold text-white'>Lakshya Jain</span> •
              2,576 songs
            </p>
          </div>
        </div>

        <div className='flex items-center gap-6 mt-10'>
          <button className='cursor-pointer w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-black text-2xl font-bold hover:scale-105 transition-transform'>
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
                  <div className='col-span-1 text-gray-400'>{index + 1}</div>
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
                    setCurrentSong(index)
                    console.log(index)
                    playTrack(track, index)
                  }}
                  className='grid grid-cols-22 items-center px-3 py-2 hover:bg-gray-800 rounded-lg transition-all cursor-pointer  '
                >
                  <div className='col-span-1 text-gray-400'>{index + 1}</div>
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
  )
}
