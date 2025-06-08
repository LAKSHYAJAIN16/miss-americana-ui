/* eslint-disable no-console */
import React, { useState, useEffect } from 'react'
import logo from '../public/ipfs-logo.svg'
import { createHeliaHTTP } from '@helia/http'
import { trustlessGateway } from '@helia/block-brokers'
import { delegatedHTTPRouting, httpGatewayRouting } from '@helia/routers'
import { unixfs } from '@helia/unixfs'

const Connect = ({ setIpfs }) => {
  const [error, setError] = useState(null)
  const [fileLoc, setFileLoc] = useState(null)
  const [blobURL, setblobURL] = useState('')
  const [txt, settxt] = useState('')

  const get = async cid => {
    const helia = await createHeliaHTTP({
      blockBrokers: [trustlessGateway()],
      routers: [
        delegatedHTTPRouting('https://delegated-ipfs.dev'),
        httpGatewayRouting({
          gateways: ['https://ipfs.io']
        })
      ]
    })
    const fs = unixfs(helia)
    const chunks = []
    for await (const chunk of fs.cat(cid)) {
      chunks.push(chunk)
    }
    const blob = new Blob(chunks)
    const url = URL.createObjectURL(blob)
    console.log(url)
    setblobURL(url)
    await helia.stop()
  }

  const connect = async e => {
    try {
      const helia = await createHeliaHTTP({
        blockBrokers: [trustlessGateway()],
        routers: [
          delegatedHTTPRouting('https://delegated-ipfs.dev'),
          httpGatewayRouting({
            gateways: ['https://ipfs.io']
          })
        ]
      })
      const fs = unixfs(helia)
      const buffer = await fileLoc.arrayBuffer()
      const cid = await fs.addBytes(new Uint8Array(buffer))
      console.log(cid.toString())
      const chunks = []
      for await (const chunk of fs.cat(cid)) {
        chunks.push(chunk)
      }
      const blob = new Blob(chunks)
      const url = URL.createObjectURL(blob)
      console.log(url)
      setblobURL(url)
      await helia.stop()
      await get(cid)
      // const ids = []
      // for (const payloadChunk in list) {
      //   if (Object.prototype.hasOwnProperty.call(object, payloadChunk)) {
      //     const element = object[payloadChunk]
      //     const cid = await str.add(element)
      //     console.log(cid)
      //     ids.push(cid)
      //   }
      // }
      // console.log(ids)
      // setError(JSON.stringify(ids))
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <>
      <form onSubmit={e => e.preventDefault()}>
        <img src={blobURL} />
        <label htmlFor='connect-input' className='f5 ma0 pb2 aqua fw4 db'>
          Address
        </label>
        <input
          className='input-reset bn black-80 bg-white pa3 w-100 mb3 ft'
          id='connect-input'
          name='connect-input'
          type='file'
          onInput={e => setFileLoc(e.target.files[0])}
        />
        <input
          className='input-reset bn black-80 bg-white pa3 w-100 mb3 ft'
          id='connect-input'
          name='connect-input'
          type='text'
          onInput={e => settxt(e.target.innerText)}
        />

        <button
          className='button-reset pv3 tc bn bg-animate bg-black-80 hover-bg-aqua white pointer w-100'
          id='connect-submit'
          type='submit'
          onClick={connect}
        >
          Connect
        </button>

        <button
          className='button-reset pv3 tc bn bg-animate bg-black-80 hover-bg-aqua white pointer w-100'
          id='connect-submit-2'
          type='submit'
          onClick={() => get(txt)}
        >
          Retrieve
        </button>
      </form>

      {error && (
        <div className='bg-red pa3 center mv3 white'>
          Error: {error.message || error}
        </div>
      )}
    </>
  )
}

const App = () => {
  const [ipfs, setIpfs] = useState(null)

  useEffect(() => {
    if (!ipfs) return

    const getVersion = async () => {
      const nodeId = await ipfs.version()
      setVersion(nodeId)
    }

    const getId = async () => {
      const nodeId = await ipfs.id()
      setId(nodeId)
    }

    getVersion()
    getId()
  }, [ipfs])

  return (
    <>
      <header className='flex items-center pa3 bg-navy bb bw3 b--aqua'>
        <a href='https://ipfs.io' title='home'>
          <img
            alt='IPFS logo'
            src={logo}
            style={{ height: '50px' }}
            className='v-top'
          />
        </a>
      </header>

      <main className='pa4-l bg-snow mw7 mv5 center pa4'>
        <h1 className='pa0 f2 ma0 mb4 aqua tc'>HTTP client upload file</h1>

        <Connect setIpfs={setIpfs}></Connect>
      </main>
    </>
  )
}

export default App
