const WebSocket = require('ws')
const fetch = require('node-fetch') // install with `npm i node-fetch`

const coordinator = new WebSocket.Server({ port: 5002 })

// Map: infoHash → array of peer sockets
const peersByHash = {}

coordinator.on('connection', socket => {
  let peerId = Math.random().toString(36).slice(2)
  socket.peerId = peerId
  console.log(`[WS] New peer connected: ${peerId}`)

  socket.on('message', msg => {
    try {
      const data = JSON.parse(msg)
      if (data.type === 'announce') {
        if (!peersByHash[data.infoHash]) peersByHash[data.infoHash] = []
        if (!peersByHash[data.infoHash].includes(socket)) {
          peersByHash[data.infoHash].push(socket)
          console.log(`[WS] ${peerId} announced for ${data.infoHash}`)
        }
      } else if (data.type === 'stop') {
        if (peersByHash[data.infoHash]) {
          peersByHash[data.infoHash] = peersByHash[data.infoHash].filter(s => s !== socket)
        }
      }
    } catch (e) { console.error("[WS] Error parsing message", e) }
  })

  socket.on('close', () => {
    console.log(`[WS] Peer disconnected: ${peerId}`)
    for (const hash in peersByHash) {
      peersByHash[hash] = peersByHash[hash].filter(s => s !== socket)
      if (peersByHash[hash].length === 0) {
        // No peers left seeding this infoHash, ask seeder to start
        console.log(`[WS] No peers left for ${hash}, requesting fallback seeder`)
        fetch(`http://localhost:5001/seed/${hash}`, { method: 'POST' })
          .catch(e => console.error('[WS] Error requesting seeder', e))
      } else {
        // Ask another peer to reseed
        const nextPeer = peersByHash[hash][0]
        nextPeer.send(JSON.stringify({ type: 'seed-request', infoHash: hash }))
      }
    }
  })
})

console.log("Coordinator WebSocket server running on ws://localhost:5002")
