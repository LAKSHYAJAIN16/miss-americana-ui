const Gun = require('gun');

const g = Gun({ peers: ['http://localhost:8765/gun'], radisk: false });

setTimeout(() => {
  g.get('songs').put({
    test: 'Hello from client'
  });
  console.log('✅ Data sent to server');
}, 2000);
