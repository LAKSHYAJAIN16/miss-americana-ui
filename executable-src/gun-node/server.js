// gun-server.js
const Gun = require('gun')
const http = require('http')
const server = http.createServer().listen(1001)

const g = new Gun({
  web: server,
  radisk: false,
  peers: ['']
})
console.log('🔫 GunDB peer running at http://localhost:8765/gun')

g.get('5KHbu2Go6NBryS0h0TpTNJ').on((data, key) => {
    console.log(data)
}, {
  change: true
})
