const WebTorrent = require('webtorrent-hybrid')
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const PORT = 5001

const client = new WebTorrent()
const activeTorrents = new Map()

const magnetsFile = path.resolve(__dirname, 'magnets.json')

// Load knownMagnets at startup (create empty if file missing)
let knownMagnets = []
if (fs.existsSync(magnetsFile)) {
  knownMagnets = JSON.parse(fs.readFileSync(magnetsFile, 'utf-8'))
} else {
  fs.writeFileSync(magnetsFile, JSON.stringify([]))
}

function saveMagnets() {
  fs.writeFileSync(magnetsFile, JSON.stringify(knownMagnets, null, 2))
}

function seedOnDemand(infoHash) {
  const entry = knownMagnets.find(t => t.infoHash === infoHash)
  if (!entry) {
    console.log("[Seeder] Unknown infoHash", infoHash)
    return
  }
  if (activeTorrents.has(infoHash)) {
    console.log("[Seeder] Already seeding", infoHash)
    return
  }

  console.log("[Seeder] Seeding on demand:", infoHash)
  const torrent = client.add(entry.magnetURI, t => {
    activeTorrents.set(infoHash, t)

    // Auto-unseed after 10 minutes to save RAM
    setTimeout(() => {
      console.log("[Seeder] Unseeding:", infoHash)
      torrent.destroy()
      activeTorrents.delete(infoHash)
    }, 10 * 60 * 1000)
  })
}

app.use(express.json())

// Seed on demand endpoint
app.post('/seed/:infoHash', (req, res) => {
  seedOnDemand(req.params.infoHash)
  res.sendStatus(200)
})

// New API: Add a magnet to persistent storage
app.post('/add-magnet', (req, res) => {
  const { infoHash, magnetURI } = req.body
  if (!infoHash || !magnetURI) {
    return res.status(400).json({ error: 'Missing infoHash or magnetURI' })
  }

  if (knownMagnets.find(t => t.infoHash === infoHash)) {
    return res.status(409).json({ error: 'Magnet already exists' })
  }

  knownMagnets.push({ infoHash, magnetURI })
  saveMagnets()
  console.log(`[Seeder] Added new magnet: ${infoHash}`)
  res.json({ success: true })
})

app.listen(PORT, () => console.log(`Seeder listening on http://localhost:${PORT}`))
