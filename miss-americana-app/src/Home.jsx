import React, { useEffect, useState } from 'react'
import Cookies from 'js-cookie'
import Nav from './components/Nav'
import Library from './components/Library'
import LikedSongs, { assembleArtistString } from './components/LikedSongs2'
import Innertube from 'youtubei.js'
import { fetchBackend } from './lib/functions'
import axios from 'axios'
import Player from './components/Player'
import StandardPlaylist from './components/StandardPlaylist'

export default function Home () {
  const [token, setToken] = useState('')
  const [state, setState] = useState(0)
  const [track, setTrack] = useState(null)
  const [currentlyPlaying, setCurrentlyPlaying] = useState(false)
  const [playlist, setPlaylist] = useState({})
  const [tracks, setTracks] = useState([])
  const [trackIdx, setTrackIdx] = useState()

  useEffect(() => {
    const res = getAuthResponse()
    if (res.type === 'success') {
      Cookies.set('spotifyAuthToken', res.access_token)
      setToken(res.access_token)
      console.log(res)
    } else if (res.type === 'error') {
      window.location.replace('/')
    }
  }, [token])

  function getAuthResponse () {
    const hash = window.location.hash.substring(1)
    const query = window.location.search.substring(1)

    // Try hash-based (Implicit Grant)
    if (hash) {
      const params = new URLSearchParams(hash)
      return {
        access_token: params.get('access_token'),
        token_type: params.get('token_type'),
        expires_in: params.get('expires_in'),
        error: params.get('error'),
        type: 'success'
      }
    }

    // Try query string (Error case or Auth Code Flow)
    if (query) {
      const params = new URLSearchParams(query)
      return {
        error: params.get('error'),
        state: params.get('state'),
        code: params.get('code'),
        type: 'error'
      }
    }

    return { type: 'error' }
  }

  async function superFunction (payload) {
    console.log(payload)
    if (payload == 'prev') {
      if (trackIdx != 0) {
        console.log(tracks)
        playTrack(tracks[trackIdx - 1], trackIdx - 1)
        
      }
    }
    if (payload == 'next') {
      if (trackIdx+ 1 != tracks.length) {
        playTrack(tracks[trackIdx + 1], trackIdx + 1)
      }
    }
  }
  /*
  https://rr2---sn-jvbxjv-tihz.googlevideo.com/videoplayback
  ?expire=1748812241
  &ei=cW08aPIk-v7b-A_kjY2ZAw
  &ip=2001%3A1970%3A535e%3Acd00%3A1920%3A2acd%3A3165%3A40d9
  &id=o-AF9hYRf6Qf8X7WhAWD44mDK2JTCf0BbyGHKrFLnr3303
  &itag=18
  &source=youtube
  &requiressl=yes
  &xpc=EgVo2aDSNQ%3D%3D
  &met=1748790641%2C
  &mh=Pr
  &mm=31%2C29
  &mn=sn-jvbxjv-tihz%2Csn-tt1elnel
  &ms=au%2Crdu
  &mv=m
  &mvi=2
  &pcm2cms=yes
  &pl=47
  &rms=au%2Cau
  &gcr=ca
  &initcwndbps=3718750
  &bui=AY1jyLMvHPst0W4DMAgvLXnkks8mQI2P52-w7zDtHUd-qsHExQyCwddVygpot_X6GtXqG05d9jpKB6Mm
  &spc=l3OVKUac0uTjbz_QtpypyoEdybfDk7JGfEMfFhx9bScYkktVNJ1K5ehYSAjaGudRGQPKPwKoIlDhcD3oUSDlUIQV
  &vprv=1
  &svpuc=1
  &xtags=heaudio%3Dtrue
  &mime=video%2Fmp4
  &ns=SnXZshDhVJy_X35oKR_R8CUQ
  &rqh=1
  &cnr=14
  &ratebypass=yes
  &dur=189.428
  &lmt=1705979749164833
  &mt=1748790306
  &fvip=2
  &fexp=51355912
  &c=WEB
  &sefc=1
  &txp=4538434
  &n=OTE1Q6QlKX3TZw
  &sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cgcr%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cxtags%2Cmime%2Cns%2Crqh%2Ccnr%2Cratebypass%2Cdur%2Clmt
  &lsparams=met%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpcm2cms%2Cpl%2Crms%2Cinitcwndbps
  &lsig=APaTxxMwRQIgUrM595YwaU2jrPgw-oZRcwGYiSl0Mshgz8_C795h-yYCIQDDvclERNyS3GGng5hv5PXa_UuNKfLeSmtySnXkUgszmw%3D%3D
  &sig=AJfQdSswRQIgOx9yV6sSvoea41D9gfYt75oQ77HODNmhPNjIaFUF748CIQD5shnJZ2F__wAh_Jgj0xJO-05QWy-x2tMOKaeGL2eqdA%3D%3D
  */

  /*
  https://rr2---sn-jvbxjv-tihz.googlevideo.com/videoplayback
  ?expire=1748812241
  &ei=cW08aPIk-v7b-A_kjY2ZAw
  &ip=2001%3A1970%3A535e%3Acd00%3A1920%3A2acd%3A3165%3A40d9
  &id=o-AF9hYRf6Qf8X7WhAWD44mDK2JTCf0BbyGHKrFLnr3303
  &itag=18
  &source=youtube
  &requiressl=yes
  &xpc=EgVo2aDSNQ%3D%3D
  &met=1748790641%2C
  &mh=Pr
  &mm=31%2C29
  &mn=sn-jvbxjv-tihz%2Csn-tt1elnel
  &ms=au%2Crdu
  &mv=m
  &mvi=2
  &pcm2cms=yes
  &pl=47
  &rms=au%2Cau
  &gcr=ca
  &initcwndbps=3718750
  &bui=AY1jyLMvHPst0W4DMAgvLXnkks8mQI2P52-w7zDtHUd-qsHExQyCwddVygpot_X6GtXqG05d9jpKB6Mm
  &spc=l3OVKUac0uTjbz_QtpypyoEdybfDk7JGfEMfFhx9bScYkktVNJ1K5ehYSAjaGudRGQPKPwKoIlDhcD3oUSDlUIQV
  &vprv=1
  &svpuc=1
  &xtags=heaudio%3Dtrue
  &mime=video%2Fmp4
  &ns=SnXZshDhVJy_X35oKR_R8CUQ
  &rqh=1
  &cnr=14
  &dur=189.428
  &lmt=1705979749164833
  &mt=1748790306
  &fvip=2
  &fexp=51355912
  &c=WEB
  &sefc=1
  &txp=4538434
  &n=OTE1Q6QlKX3TZw
  &sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cgcr%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cxtags%2Cmime%2Cns%2Crqh%2Ccnr%2Cratebypass%2Cdur%2Clmt
  &lsparams=met%2Cmh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpcm2cms%2Cpl%2Crms%2Cinitcwndbps
  &lsig=APaTxxMwRQIgUrM595YwaU2jrPgw-oZRcwGYiSl0Mshgz8_C795h-yYCIQDDvclERNyS3GGng5hv5PXa_UuNKfLeSmtySnXkUgszmw%3D%3D
  &sig=AJfQdSswRQIgOx9yV6sSvoea41D9gfYt75oQ77HODNmhPNjIaFUF748CIQD5shnJZ2F__wAh_Jgj0xJO-05QWy-x2tMOKaeGL2eqdA%3D%3D
  */

  function openLikedSongs () {
    setState(1)
  }

  function playTrack (track_sup, index) {
    setTrack(track_sup)
    setTrackIdx(index)
    setCurrentlyPlaying(true)
  }

  function selectPlaylistCallback (playlist_sup) {
    setState(2)
    setPlaylist(playlist_sup)
  }

  return (
    <>
      <div className='overflow-hidden text-white pl-3'>
        <Nav />
        <br />
        <div className='flex'>
          <Library
            token={token}
            likedSongsCallback={openLikedSongs}
            playing={currentlyPlaying}
            selectPlaylistCallback={selectPlaylistCallback}
          />
          {state === 1 && (
            <LikedSongs
              token={token}
              playTrack={playTrack}
              currentlyPlaying={currentlyPlaying}
              setTracksSuper={setTracks}
              trackidx={trackIdx}
            />
          )}
          {state === 2 && (
            <StandardPlaylist
              token={token}
              playTrack={playTrack}
              currentlyPlaying={currentlyPlaying}
              playlist={playlist}
            />
          )}
        </div>
        <Player track={track} playing={currentlyPlaying} superCallback={superFunction}/>
      </div>
    </>
  )
}
