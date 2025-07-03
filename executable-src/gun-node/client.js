const Gun = require('gun')
const fs = require('fs')

const g = Gun({
  peers: [
    "http://localhost:1001/gun"
  ],
  radisk: false,
  retry: Infinity,
  userAgent: 'MyCustomAgent/1.0'
})

setTimeout(() => {
  fs.readFile('j.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err)
      return
    }
    const song_reg = JSON.parse(data)
    for (let index = 0; index < song_reg.length; index++) {
      const song = song_reg[index]
      console.log(song[0])
      g.get(song[0]).put({ id: song[0], ytID: song[1], base64: song[3] })
    }

    console.log('✅ Data sent to server')
  })
}, 2000)
