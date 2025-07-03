import React, { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import Cookies from 'js-cookie'
import { VariableSizeList as List } from 'react-window'
import Download from '../assets/download.svg'

export function assembleArtistString(artists) {
  return artists.map((a) => a.name).join(', ')
}

const LIMIT = 50
const MAX_OFFSET = 10000
const ROW_HEIGHT = 72
const MAIN_HEADER_HEIGHT = 340
const GRID_HEADER_HEIGHT = 48
const BUFFER_SIZE = 500

export default function LikedSongs({
  token,
  playTrack,
  currentlyPlaying,
  setTracksSuper,
  trackidx
}) {
  const [tracks, setTracks] = useState([])
  const [total, setTotal] = useState(0)
  const [loadingOffsets, setLoadingOffsets] = useState(new Set())
  const [currentSong, setCurrentSong] = useState(null)

  useEffect(() => {
    setTracks([])
    setTotal(0)
    setLoadingOffsets(new Set())
    fetchChunk(0)
  }, [token])

  useEffect(() => {
    if (trackidx !== currentSong) {
      setCurrentSong(trackidx)
    }
  }, [trackidx])

  const fetchChunk = useCallback(
    async (offset) => {
      if (loadingOffsets.has(offset) || offset > MAX_OFFSET) return
      setLoadingOffsets((prev) => new Set(prev).add(offset))

      try {
        const res = await axios.get(
          `https://api.spotify.com/v1/me/tracks?limit=${LIMIT}&offset=${offset}`,
          {
            headers: {
              Authorization: 'Bearer ' + Cookies.get('spotifyAuthToken')
            }
          }
        )

        const cappedTotal = Math.min(res.data.total, MAX_OFFSET + LIMIT)
        setTotal(cappedTotal)

        setTracks((prev) => {
          const newTracks = [...prev]
          res.data.items.forEach((item, i) => {
            newTracks[offset + i] = item
          })
          return newTracks
        })

        setTracksSuper((prev) => {
          const newTracks = [...prev]
          res.data.items.forEach((item, i) => {
            newTracks[offset + i] = item
          })
          return newTracks
        })
      } catch (error) {
        console.error('Failed to fetch chunk:', error)
      } finally {
        setLoadingOffsets((prev) => {
          const newSet = new Set(prev)
          newSet.delete(offset)
          return newSet
        })
      }
    },
    [loadingOffsets, setTracksSuper]
  )

  const purgeMemory = useCallback((start, stop) => {
    setTracks((prev) => {
      const newTracks = [...prev]
      for (let i = 0; i < newTracks.length; i++) {
        if (i < start - BUFFER_SIZE || i > stop + BUFFER_SIZE) {
          newTracks[i] = undefined
        }
      }
      return newTracks
    })
  }, [])

  const getItemSize = (index) => {
    if (index === 0) return MAIN_HEADER_HEIGHT
    if (index === 1) return GRID_HEADER_HEIGHT
    return ROW_HEIGHT
  }

  const Row = ({ index, style }) => {
    if (index === 0) {
      return (
        <div style={style} className="p-8 bg-gradient-to-b from-pink-900 to-[#0d020c] text-white rounded-xl">
          <div className="flex items-end gap-6">
            <div className="w-44 h-44 rounded shadow-lg bg-gradient-to-br from-pink-600 to-cyan-200 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5
                         2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09
                         C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42
                         22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium">Playlist</p>
              <p className="text-8xl font-extrabold ml-0">Liked Songs</p>
              <p className="text-sm mt-2 text-gray-300">
                <span className="font-semibold text-white">Lakshya Jain</span> • {total} songs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 mt-10">
            <button className="cursor-pointer w-14 h-14 bg-pink-500 rounded-full flex items-center justify-center text-black text-2xl font-bold hover:scale-105 transition-transform">
              &#10073;&#10073;
            </button>
            <button className="cursor-pointer text-gray-300 text-2xl hover:scale-110 transition-transform">
              <img src={Download} alt="Download" className="w-8 h-8" />
            </button>
          </div>
        </div>
      )
    }

    if (index === 1) {
      return (
        <div style={style} className="grid grid-cols-22 gap-4 text-sm border-b border-gray-700 pb-2 mb-2 px-4 bg-[#0d020c] sticky top-0 z-10">
          <div className="col-span-1">#</div>
          <div className="col-span-11">Title</div>
          <div className="col-span-6">Album</div>
          <div className="col-span-4">Date added</div>
        </div>
      )
    }

    const trackIndex = index - 2
    const offset = Math.floor(trackIndex / LIMIT) * LIMIT

    if (!tracks[trackIndex] && !loadingOffsets.has(offset)) {
      fetchChunk(offset)
    }

    const track = tracks[trackIndex]
    const isCurrent = trackIndex === currentSong

    if (!track) {
      return (
        <div
          style={style}
          key={`placeholder-${trackIndex}`}
          className="grid grid-cols-22 items-center px-3 py-2 rounded-lg animate-pulse bg-gray-800 opacity-70"
        >
          <div className="col-span-1 text-gray-600">{trackIndex + 1}</div>
          <div className="col-span-11 flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-700 rounded" />
            <div>
              <div className="h-4 w-32 bg-gray-700 rounded mb-1" />
              <div className="h-3 w-20 bg-gray-600 rounded" />
            </div>
          </div>
          <div className="col-span-6 h-3 w-24 bg-gray-700 rounded" />
          <div className="col-span-4 h-3 w-20 bg-gray-600 rounded" />
        </div>
      )
    }

    return (
      <div
        style={style}
        key={track.track.id + '_' + trackIndex}
        onClick={() => {
          setCurrentSong(trackIndex)
          playTrack(track, trackIndex)
        }}
        className={`grid grid-cols-22 items-center px-3 py-2 rounded-lg transition-all cursor-pointer ${
          isCurrent ? 'bg-gray-900' : 'hover:bg-gray-800'
        }`}
      >
        <div className="col-span-1 text-gray-400">{trackIndex + 1}</div>
        <div className="col-span-11 flex items-center space-x-3">
          <img
            src={track.track.album.images[0].url}
            alt={track.track.name}
            className="w-12 h-12 rounded object-cover"
          />
          <div>
            <div className={`font-semibold truncate ${isCurrent ? 'text-pink-600' : ''}`}>
              {track.track.name}
            </div>
            <div className="text-gray-400 text-xs">
              {assembleArtistString(track.track.artists)}
            </div>
          </div>
        </div>
        <div className="col-span-6 ml-2 text-sm text-gray-300 truncate">
          {track.track.album.name}
        </div>
        <div className="col-span-4 text-sm text-gray-400">
          {new Date(track.added_at).toDateString()}
        </div>
      </div>
    )
  }

  return (
    <div className="ml-2 flex-col flex rounded-xl max-w-screen-xl w-full mx-auto">
      <List
        height={currentlyPlaying ? window.innerHeight * 0.75 : window.innerHeight * 0.85}
        itemCount={Math.min(total, MAX_OFFSET + LIMIT) + 2}
        itemSize={getItemSize}
        width="100%"
        overscanCount={5}
        onItemsRendered={({ visibleStartIndex, visibleStopIndex }) => {
          const start = Math.max(visibleStartIndex - 2, 0)
          const stop = Math.max(visibleStopIndex - 2, 0)
          purgeMemory(start, stop)
        }}
      >
        {Row}
      </List>
    </div>
  )
}
