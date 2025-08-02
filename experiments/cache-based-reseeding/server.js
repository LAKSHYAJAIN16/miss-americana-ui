const WebSocket = require('ws');

const PORT = 5002;
const wss = new WebSocket.Server({ port: PORT });

/**
 * Structure to hold info about files:
 * {
 *   filename: {
 *     magnetURI: string,
 *     seeders: Set of client IDs
 *   }
 * }
 */
const files = new Map();

// Map client ID to client info
const clients = new Map();
let clientIdSeq = 1;

console.log(`WebSocket server listening on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  const clientId = clientIdSeq++;
  clients.set(clientId, { ws, seededFiles: new Set(), downloadedFiles: new Set() });
  console.log(`Client connected: ${clientId}`);

  ws.on('message', (message) => {
    let msg;
    try {
      msg = JSON.parse(message);
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Invalid JSON' }));
      return;
    }

    // Message types: upload, request_magnet, reseeded, downloaded
    switch (msg.type) {
      case 'upload':
        handleUpload(clientId, msg);
        break;

      case 'request_magnet':
        handleRequestMagnet(ws, msg);
        break;

      case 'reseeded':
        handleReseeded(clientId, msg);
        break;

      case 'downloaded':
        handleDownloaded(clientId, msg);
        break;

      default:
        ws.send(JSON.stringify({ error: 'Unknown message type' }));
    }
  });

  ws.on('close', () => {
    console.log(`Client disconnected: ${clientId}`);
    handleClientDisconnect(clientId);
    clients.delete(clientId);
  });
});

function handleUpload(clientId, msg) {
  // msg: { type: 'upload', filename, magnetURI }
  const { filename, magnetURI } = msg;
  if (!filename || !magnetURI) return;

  if (!files.has(filename)) {
    files.set(filename, { magnetURI, seeders: new Set() });
    console.log(`New file registered: ${filename}`);
  }
  // Add seeder
  const file = files.get(filename);
  file.seeders.add(clientId);

  const client = clients.get(clientId);
  client.seededFiles.add(filename);

  broadcastSeedersUpdate(filename);
}

function handleRequestMagnet(ws, msg) {
  // msg: { type: 'request_magnet', filename }
  const { filename } = msg;
  if (!filename) return;

  if (files.has(filename)) {
    ws.send(JSON.stringify({ type: 'magnet_response', filename, magnetURI: files.get(filename).magnetURI }));
  } else {
    ws.send(JSON.stringify({ type: 'magnet_response', filename, magnetURI: null, error: 'File not found' }));
  }
}

function handleReseeded(clientId, msg) {
  // msg: { type: 'reseeded', filename }
  const { filename } = msg;
  if (!filename) return;

  if (!files.has(filename)) {
    console.warn(`Reseeded unknown file: ${filename}`);
    return;
  }

  files.get(filename).seeders.add(clientId);
  const client = clients.get(clientId);
  client.seededFiles.add(filename);

  broadcastSeedersUpdate(filename);
}

function handleDownloaded(clientId, msg) {
  // msg: { type: 'downloaded', filename }
  const { filename } = msg;
  if (!filename) return;

  const client = clients.get(clientId);
  if (client) client.downloadedFiles.add(filename);
}

function handleClientDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove client from all seeders sets
  client.seededFiles.forEach((filename) => {
    if (!files.has(filename)) return;
    const file = files.get(filename);
    file.seeders.delete(clientId);
    // If no seeders left, ask other clients to reseed
    if (file.seeders.size === 0) {
      console.log(`No seeders left for ${filename}. Requesting reseed.`);
      requestReseed(filename);
    }
  });
}

// Ask all clients who downloaded a file but aren't seeding to reseed
function requestReseed(filename) {
  clients.forEach(({ ws, seededFiles, downloadedFiles }, clientId) => {
    if (downloadedFiles.has(filename) && !seededFiles.has(filename)) {
      ws.send(JSON.stringify({ type: 'request_reseed', filename }));
    }
  });
}

function broadcastSeedersUpdate(filename) {
  const seedersCount = files.get(filename)?.seeders.size || 0;
  const message = JSON.stringify({ type: 'seeders_update', filename, seedersCount });

  clients.forEach(({ ws }) => {
    ws.send(message);
  });
}
