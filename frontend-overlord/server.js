/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("http");
const https = require("https");
const next = require("next");
const { WebSocketServer, WebSocket } = require("ws");

const dev = process.env.NODE_ENV !== "production";
const host = process.env.HOST || "0.0.0.0";
const port = Number(process.env.PORT || 3000);
const backendBaseUrl = (process.env.BACKEND_BASE_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const app = next({ dev, hostname: host, port });
const handle = app.getRequestHandler();

const MAX_HEALTH = 100;
const DAMAGE_PER_HIT = 12;

const slotClients = {
  1: null,
  2: null,
};

const players = {
  1: { x: 384, y: 576, flipX: false, moving: false, connected: false },
  2: { x: 504, y: 456, flipX: false, moving: false, connected: false },
};

const health = {
  1: MAX_HEALTH,
  2: MAX_HEALTH,
};

function spawnFor(slot) {
  return slot === 1 ? { x: 384, y: 576 } : { x: 504, y: 456 };
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcast(wss, payload, exceptWs) {
  for (const client of wss.clients) {
    if (client === exceptWs) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload));
    }
  }
}

function nextFreeSlot() {
  if (!slotClients[1]) return 1;
  if (!slotClients[2]) return 2;
  return null;
}

function broadcastPresence(wss) {
  broadcast(wss, {
    type: "presence",
    players: {
      1: { connected: players[1].connected },
      2: { connected: players[2].connected },
    },
  });
}

function broadcastHealth(wss) {
  broadcast(wss, {
    type: "health",
    values: {
      1: health[1],
      2: health[2],
    },
  });
}

function resetSlotHealth(slot) {
  health[slot] = MAX_HEALTH;
}

function resetSlotState(slot) {
  const spawn = spawnFor(slot);
  players[slot].x = spawn.x;
  players[slot].y = spawn.y;
  players[slot].flipX = false;
  players[slot].moving = false;
}

app
  .prepare()
  .then(() => {
    const nextUpgradeHandler = app.getUpgradeHandler();
    const backendUrl = new URL(backendBaseUrl);
    const backendTransport = backendUrl.protocol === "https:" ? https : http;

    function proxyToBackend(req, res) {
      const targetPath = req.url || "/";
      const targetOptions = {
        protocol: backendUrl.protocol,
        hostname: backendUrl.hostname,
        port: backendUrl.port || (backendUrl.protocol === "https:" ? 443 : 80),
        method: req.method,
        path: targetPath,
        headers: { ...req.headers, host: backendUrl.host },
      };
      const proxyReq = backendTransport.request(targetOptions, (proxyRes) => {
        res.writeHead(proxyRes.statusCode || 502, proxyRes.headers);
        proxyRes.pipe(res);
      });
      proxyReq.on("error", (err) => {
        res.statusCode = 502;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ error: "backend_proxy_failed", detail: String(err) }));
      });
      req.pipe(proxyReq);
    }

    const server = http.createServer((req, res) => {
      if ((req.url || "").startsWith("/games/")) {
        proxyToBackend(req, res);
        return;
      }
      handle(req, res);
    });

    const wss = new WebSocketServer({ noServer: true });

    server.on("upgrade", (request, socket, head) => {
      const requestUrl = new URL(request.url || "/", `http://${request.headers.host}`);
      if (requestUrl.pathname !== "/ws") {
        nextUpgradeHandler(request, socket, head);
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    });

    wss.on("connection", (ws) => {
      const slot = nextFreeSlot();
      if (!slot) {
        send(ws, { type: "full", message: "Room full (2 players max)." });
        ws.close();
        return;
      }

      slotClients[slot] = ws;
      players[slot].connected = true;
      ws.slot = slot;

      send(ws, {
        type: "welcome",
        slot,
        players,
        health: { ...health },
      });

      broadcast(
        wss,
        {
          type: "player_joined",
          slot,
          state: players[slot],
        },
        ws
      );

      broadcastPresence(wss);
      broadcastHealth(wss);

      ws.on("message", (raw) => {
        let msg;
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          return;
        }

        const fromSlot = ws.slot;
        if (fromSlot !== 1 && fromSlot !== 2) return;

        if (msg.type === "state") {
          players[fromSlot].x = Number(msg.x) || players[fromSlot].x;
          players[fromSlot].y = Number(msg.y) || players[fromSlot].y;
          players[fromSlot].flipX = Boolean(msg.flipX);
          players[fromSlot].moving = Boolean(msg.moving);
          broadcast(
            wss,
            {
              type: "state",
              slot: fromSlot,
              x: players[fromSlot].x,
              y: players[fromSlot].y,
              flipX: players[fromSlot].flipX,
              moving: players[fromSlot].moving,
            },
            ws
          );
          return;
        }

        if (msg.type === "shoot") {
          broadcast(
            wss,
            {
              type: "shoot",
              slot: fromSlot,
              x: Number(msg.x) || players[fromSlot].x,
              y: Number(msg.y) || players[fromSlot].y,
              dx: Number(msg.dx) || 0,
              dy: Number(msg.dy) || 0,
            },
            ws
          );
          return;
        }

        if (msg.type === "hit") {
          const targetSlot = Number(msg.targetSlot);
          if (targetSlot !== 1 && targetSlot !== 2) return;
          if (targetSlot === fromSlot) return;

          health[targetSlot] = Math.max(0, health[targetSlot] - DAMAGE_PER_HIT);
          if (health[targetSlot] <= 0) {
            resetSlotHealth(targetSlot);
            resetSlotState(targetSlot);
            broadcast(wss, {
              type: "state",
              slot: targetSlot,
              x: players[targetSlot].x,
              y: players[targetSlot].y,
              flipX: players[targetSlot].flipX,
              moving: players[targetSlot].moving,
            });
          }
          broadcastHealth(wss);
        }
      });

      ws.on("close", () => {
        const closedSlot = ws.slot;
        if (closedSlot !== 1 && closedSlot !== 2) return;
        if (slotClients[closedSlot] === ws) {
          slotClients[closedSlot] = null;
        }
        players[closedSlot].connected = false;
        resetSlotHealth(closedSlot);
        resetSlotState(closedSlot);
        broadcast(wss, { type: "player_left", slot: closedSlot });
        broadcastPresence(wss);
        broadcastHealth(wss);
      });
    });

    server.listen(port, host, () => {
      console.log(`> Ready on http://${host}:${port}`);
      console.log("> WS endpoint on /ws");
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });
