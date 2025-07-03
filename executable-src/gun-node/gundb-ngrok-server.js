// gundb-ngrok-server.js

const Gun = require('gun')
const http = require('http')
const { exec } = require('child_process')
const fs = require('fs')
const axios = require('axios')

// Step 1: Start GunDB HTTP server
const server = http.createServer()
server.listen(8765, '0.0.0.0', () => {
  console.log('🔫 GunDB running locally on port 8765')
})

const g = Gun({ web: server, radisk: false })

g.get('2EDHz4tC3pZDkxAJln2sB3').on(
  (data, key) => {
    console.log(data)
  },
  {
    change: true
  }
)

const ngrokProcess = exec(
  'ngrok http 8765 --log=stdout',
  (err, stdout, stderr) => {
    if (err) {
      console.error('Ngrok failed to start:', err)
    }
  }
)

// Step 3: Poll ngrok API for the public URL
async function getNgrokUrl () {
  try {
    const res = await axios.get('http://127.0.0.1:4040/api/tunnels')
    const tunnel = res.data.tunnels.find(t => t.proto === 'https')
    if (tunnel && tunnel.public_url) {
      const url = tunnel.public_url
      console.log('🌍 Public GunDB URL via ngrok:', url)
    } else {
      console.warn('Waiting for ngrok tunnel to be ready...')
      setTimeout(getNgrokUrl, 1000)
    }
  } catch (e) {
    console.log(e.cause.errno)
    console.warn('Ngrok not yet available, retrying...')
    setTimeout(getNgrokUrl, 1000)
  }
}

// Wait a bit for ngrok to spin up
setTimeout(getNgrokUrl, 2000)
