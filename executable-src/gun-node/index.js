const Gun = require('gun');
const http = require('http');

const server = http.createServer().listen(8765);
const g = Gun({ web: server, radisk: false });

console.log('🔫 GunDB server running at http://localhost:8765/gun');

g.get('songs').on((data, key) => {
  console.log('📥 Data received on server:', data);
});
