const WebSocket = require("ws");
const fs = require("fs");

const PORT = 5002;
const wss = new WebSocket.Server({ port: PORT });

const peers = new Map(); // infoHash => Set of ws clients
const cached = new Map(); // infoHash => Set of ws clients

function log(...args) {
  console.log(`[${new Date().toLocaleTimeString()}]`, ...args);
}

wss.on("connection", (ws) => {
  ws.infoHashes = new Set();

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      const { type, infoHash } = data;

      if (!infoHash) return;

      if (type === "announce-seed") {
        if (!peers.has(infoHash)) peers.set(infoHash, new Set());
        peers.get(infoHash).add(ws);
        ws.infoHashes.add(infoHash);
        log("Seeder announced:", infoHash);

        // Broadcast to others for caching
        wss.clients.forEach((client) => {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: "new-seed", infoHash }));
          }
        });
      }

      else if (type === "stop-seed") {
        peers.get(infoHash)?.delete(ws);
        log("Seeder stopped:", infoHash);
        maybeTriggerReseed(infoHash);
      }

      else if (type === "announce-cache") {
        if (!cached.has(infoHash)) cached.set(infoHash, new Set());
        cached.get(infoHash).add(ws);
      }

      else if (type === "stop-cache") {
        cached.get(infoHash)?.delete(ws);
      }

    } catch (err) {
      log("Message error:", err.message);
    }
  });

  ws.on("close", () => {
    for (const infoHash of ws.infoHashes) {
      peers.get(infoHash)?.delete(ws);
      cached.get(infoHash)?.delete(ws);
      maybeTriggerReseed(infoHash);
    }
  });
});

function maybeTriggerReseed(infoHash) {
  const activeSeeders = peers.get(infoHash) || new Set();
  if (activeSeeders.size === 0) {
    const candidates = cached.get(infoHash) || new Set();
    for (const client of candidates) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: "start-seeding", infoHash }));
        log("Requested reseed from cache:", infoHash);
        break;
      }
    }
  }
}

log(`Coordinator server running at ws://localhost:${PORT}`);
