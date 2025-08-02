const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 5002 });
console.log(`[${new Date().toLocaleTimeString()}] Coordinator server running at ws://localhost:5002`);

// Structure: infoHash => { seeders: Set of clientIds, caches: Set of clientIds, magnetURI }
const torrents = new Map();

// Structure: clientId => ws
const clients = new Map();

function broadcastExcept(senderId, message) {
  for (const [clientId, ws] of clients.entries()) {
    if (clientId !== senderId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

wss.on("connection", (ws) => {
  let clientId = null;

  ws.on("message", (msg) => {
    let data;
    try {
      data = JSON.parse(msg);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      return;
    }

    // Client ID assigned on first message with clientId
    if (!clientId && data.clientId) {
      clientId = data.clientId;
      clients.set(clientId, ws);
      console.log(`[${new Date().toLocaleTimeString()}] Client connected: ${clientId}`);
      return;
    }

    if (!clientId) {
      ws.send(JSON.stringify({ type: "error", message: "clientId required as first message" }));
      return;
    }

    switch (data.type) {
      case "announce-seed": {
        const { infoHash, magnetURI } = data;
        if (!infoHash || !magnetURI) return;

        if (!torrents.has(infoHash)) {
          torrents.set(infoHash, {
            seeders: new Set(),
            caches: new Set(),
            magnetURI,
          });
          console.log(`[${new Date().toLocaleTimeString()}] New torrent tracked: ${infoHash}`);
        }

        const t = torrents.get(infoHash);
        t.seeders.add(clientId);
        t.magnetURI = magnetURI; // Update magnetURI just in case

        console.log(`[${new Date().toLocaleTimeString()}] Seeder announced: ${infoHash} by ${clientId}`);

        // Broadcast new seed info to other clients if needed
        broadcastExcept(clientId, { type: "new-seed", infoHash, magnetURI });
        break;
      }

      case "stop-seed-request": {
        const { infoHash } = data;
        if (!infoHash) return;

        if (!torrents.has(infoHash)) {
          ws.send(JSON.stringify({ type: "stop-denied", infoHash, reason: "Unknown torrent" }));
          return;
        }

        const t = torrents.get(infoHash);

        // Remove the requester from seeders temporarily to avoid false positive
        t.seeders.delete(clientId);

        if (t.seeders.size > 0) {
          // Other seeders still exist: allow stop immediately
          ws.send(JSON.stringify({ type: "stop-approved", infoHash }));
          console.log(`[${new Date().toLocaleTimeString()}] Stop approved immediately for ${infoHash} by ${clientId}`);
          return;
        }

        // No other seeders: must assign a cache client to become seeder first
        if (t.caches.size === 0) {
          // No caches available => deny stop (could extend to ask original client to stay seeded)
          ws.send(JSON.stringify({
            type: "stop-denied",
            infoHash,
            reason: "No cached clients available to reseed, stop denied to prevent data loss.",
          }));
          console.log(`[${new Date().toLocaleTimeString()}] Stop denied for ${infoHash} by ${clientId} - No caches`);
          // Add client back to seeders since they can't stop
          t.seeders.add(clientId);
          return;
        }

        // Choose a cache client randomly to become seeder
        const cachesArray = Array.from(t.caches);
        const newSeederId = cachesArray[Math.floor(Math.random() * cachesArray.length)];

        // Request that client to start seeding
        const newSeederWs = clients.get(newSeederId);
        if (newSeederWs && newSeederWs.readyState === WebSocket.OPEN) {
          newSeederWs.send(JSON.stringify({
            type: "start-seeding",
            infoHash,
            magnetURI: t.magnetURI,
          }));

          console.log(`[${new Date().toLocaleTimeString()}] Requested cache client ${newSeederId} to start seeding ${infoHash}`);

          // Store "pending stop" so we know who requested stop and allow stop after cache client confirms seed
          t.pendingStop = { originalSeeder: clientId };

          // Inform original client to wait for approval
          ws.send(JSON.stringify({
            type: "stop-denied",
            infoHash,
            reason: `Waiting for client ${newSeederId} to start seeding before stopping.`,
          }));
        } else {
          ws.send(JSON.stringify({
            type: "stop-denied",
            infoHash,
            reason: "Cache client to seed is offline, stop denied.",
          }));
          console.log(`[${new Date().toLocaleTimeString()}] Stop denied for ${infoHash} by ${clientId} - cache client offline`);
          // Add client back to seeders since they can't stop
          t.seeders.add(clientId);
        }
        break;
      }

      case "announce-cache": {
        const { infoHash } = data;
        if (!infoHash) return;

        if (!torrents.has(infoHash)) {
          torrents.set(infoHash, {
            seeders: new Set(),
            caches: new Set(),
            magnetURI: null,
          });
          console.log(`[${new Date().toLocaleTimeString()}] New torrent tracked (cache): ${infoHash}`);
        }

        const t = torrents.get(infoHash);
        t.caches.add(clientId);
        console.log(`[${new Date().toLocaleTimeString()}] Cache announced: ${infoHash} by ${clientId}`);

        // Check if this cache client was requested to seed for a pending stop
        if (t.pendingStop && t.pendingStop.originalSeeder !== clientId) {
          // This means cache client started seeding, so approve original seeder to stop
          const originalSeederId = t.pendingStop.originalSeeder;
          const originalSeederWs = clients.get(originalSeederId);

          if (originalSeederWs && originalSeederWs.readyState === WebSocket.OPEN) {
            originalSeederWs.send(JSON.stringify({ type: "stop-approved", infoHash }));
            console.log(`[${new Date().toLocaleTimeString()}] Stop approved for original seeder ${originalSeederId} on ${infoHash}`);
          }

          delete t.pendingStop;
        }

        break;
      }

      case "stop-cache": {
        const { infoHash } = data;
        if (!infoHash) return;
        if (!torrents.has(infoHash)) return;
        const t = torrents.get(infoHash);
        t.caches.delete(clientId);
        console.log(`[${new Date().toLocaleTimeString()}] Cache stopped: ${infoHash} by ${clientId}`);
        break;
      }

      case "stop-seed": {
        const { infoHash } = data;
        if (!infoHash) return;
        if (!torrents.has(infoHash)) return;

        const t = torrents.get(infoHash);
        t.seeders.delete(clientId);
        console.log(`[${new Date().toLocaleTimeString()}] Seeder stopped: ${infoHash} by ${clientId}`);

        // If no seeders left, but cached clients exist, prompt one cache client to seed automatically (optional)
        if (t.seeders.size === 0 && t.caches.size > 0) {
          const cachesArray = Array.from(t.caches);
          const newSeederId = cachesArray[Math.floor(Math.random() * cachesArray.length)];
          const newSeederWs = clients.get(newSeederId);
          if (newSeederWs && newSeederWs.readyState === WebSocket.OPEN) {
            newSeederWs.send(JSON.stringify({
              type: "start-seeding",
              infoHash,
              magnetURI: t.magnetURI,
            }));
            console.log(`[${new Date().toLocaleTimeString()}] Auto-requested cache client ${newSeederId} to start seeding ${infoHash} after seeder stopped.`);
          }
        }

        break;
      }

      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown message type: " + data.type }));
        break;
    }
  });

  ws.on("close", () => {
    if (!clientId) return;
    clients.delete(clientId);
    console.log(`[${new Date().toLocaleTimeString()}] Client disconnected: ${clientId}`);

    // Remove client from all torrents seeders and caches
    for (const [infoHash, t] of torrents.entries()) {
      if (t.seeders.delete(clientId)) {
        console.log(`[${new Date().toLocaleTimeString()}] Removed seeder ${clientId} from ${infoHash}`);
      }
      if (t.caches.delete(clientId)) {
        console.log(`[${new Date().toLocaleTimeString()}] Removed cache ${clientId} from ${infoHash}`);
      }

      // If no seeders left but cached clients exist, prompt a cache client to seed automatically
      if (t.seeders.size === 0 && t.caches.size > 0) {
        const cachesArray = Array.from(t.caches);
        const newSeederId = cachesArray[Math.floor(Math.random() * cachesArray.length)];
        const newSeederWs = clients.get(newSeederId);
        if (newSeederWs && newSeederWs.readyState === WebSocket.OPEN) {
          newSeederWs.send(JSON.stringify({
            type: "start-seeding",
            infoHash,
            magnetURI: t.magnetURI,
          }));
          console.log(`[${new Date().toLocaleTimeString()}] Auto-requested cache client ${newSeederId} to start seeding ${infoHash} on disconnect.`);
        }
      }
    }
  });
});
