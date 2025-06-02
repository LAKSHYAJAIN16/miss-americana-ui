import React, { useState, useEffect } from 'react'
import collapse from '../assets/hide.svg'
import heart from '../assets/heart.png'
import axios from 'axios'
import Cookies from 'js-cookie'

export default function Library ({
  token,
  likedSongsCallback,
  selectPlaylistCallback,
  playing
}) {
  const [state, setState] = useState(1)
  const [x, setX] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [playlists, setPlaylists] = useState([])
  const [active, setActive] = useState(null)

  useEffect(() => {
    const fn = async () => {
      console.log(token)
      console.log(Cookies.get('spotifyAuthToken'))
      const res = await axios.get(
        'https://api.spotify.com/v1/me/playlists?limit=10',
        {
          headers: {
            Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken')
          }
        }
      )
      console.log(res.data)
      setPlaylists(res.data.items)
    }
    fn()
  }, [])

  function Playlist ({ isLiked,  content }) {
    function NormalPlaylist () {
      return (
        <>
          <div
            className={
              'flex items-center rounded-lg p-3 cursor-pointer' +
              (active == content.name
                ? ' bg-zinc-900 hover:bg-zinc-800'
                : ' hover:bg-zinc-900')
            }
            onClick={() => {
              setActive(content.name)
              selectPlaylistCallback(content)
            }}
          >
            <img
              src={content.images[0].url}
              alt={content.name}
              class='w-14 h-14 rounded-md'
            />
            <div class='ml-4'>
              <p class='font-semibold truncate max-w-[180px]'>{content.name}</p>
              <p class='text-sm text-zinc-400'>
                Playlist • {content.owner.display_name}
              </p>
            </div>
          </div>
        </>
      )
    }
    function LikedPlaylist () {
      return (
        <>
          <div
            className={
              'flex items-center rounded-lg p-3 cursor-pointer' +
              (active == 'Liked Songs'
                ? ' bg-zinc-900 hover:bg-zinc-800'
                : ' hover:bg-zinc-900')
            }
            onClick={() => {
              likedSongsCallback()
              setActive('Liked Songs')
            }}
          >
            <div class='w-14 h-14 flex items-center justify-center rounded-lg bg-gradient-to-br from-pink-600 to-white'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                class='w-6 h-6 text-white'
                fill='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 
             2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
             C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 
             22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'
                />
              </svg>
            </div>
            <div class='ml-4'>
              <p class='font-semibold truncate max-w-[180px]'>Liked Songs</p>
            </div>
          </div>
        </>
      )
    }

    return isLiked ? <LikedPlaylist /> : <NormalPlaylist />
  }

  return (
    <div
      className={
        'text-white bg-gray-900 w-[30%] rounded-lg ' +
        (playing ? 'h-[75vh] ' : '')
      }
    >
      <div
        className='flex items-center noto ml-3 pt-2'
        onMouseEnter={() => setX(true)}
        onMouseLeave={() => setX(false)}
      >
        {x && (
          <button className='cursor-pointer' onClick={() => setState(2)}>
            <img src={collapse} width={25} height={25} />
          </button>
        )}
        <h1 className='font-bold ml-3 cursor-pointer transition-all'>
          Your Library
        </h1>

        <button className='noto ml-auto mr-3 bg-gray-800 rounded-full px-4 py-2 hover:bg-[#d71ece] transition-all cursor-pointer'>
          <p className='noto font-bold'>Create</p>
        </button>
      </div>

      <div class='flex gap-2 justify-center noto p-4 -mt-1'>
        <button class='transition-all bg-gray-800 font-semibold text-white px-2 py-2 rounded-full text-sm hover:bg-gray-500 cursor-pointer'>
          Playlists
        </button>
        <button class='transition-all bg-gray-800 font-semibold text-white px-2 py-2 rounded-full text-sm hover:bg-gray-500 cursor-pointer'>
          Albums
        </button>
        <button class='transition-all bg-gray-800 font-semibold text-white px-2 py-2 rounded-full text-sm hover:bg-gray-500 cursor-pointer'>
          Artists
        </button>
      </div>

      <div>
        <div
          class={
            ' overflow-x-hidden scroll-auto overflow-y-scroll  text-white space-y-1' +
            (playing ? ' h-[57vh] ' : ' h-[70vh]')
          }
        >
          <Playlist isLiked={true}  />

          {playlists.map(playlist => (
            <Playlist content={playlist} isLiked={false}  />
          ))}
        </div>
      </div>
    </div>
  )
}
