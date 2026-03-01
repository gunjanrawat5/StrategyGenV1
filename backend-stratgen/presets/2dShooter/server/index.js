const WebSocket = require('ws')

const PORT = 8081
const MAX_HEALTH = 100
const DAMAGE_PER_HIT = 12

const wss = new WebSocket.Server({ port: PORT }, () => console.log(`WS server listening on ${PORT}`))

const slotClients = {
  1: null,
  2: null
}

const players = {
  1: { x: 384, y: 576, flipX: false, moving: false, connected: false },
  2: { x: 504, y: 456, flipX: false, moving: false, connected: false }
}

const health = {
  1: MAX_HEALTH,
  2: MAX_HEALTH
}

function spawnFor(slot) {
  if (slot === 1) {
    return { x: 384, y: 576 }
  }
  return { x: 504, y: 456 }
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

function broadcast(payload, exceptWs) {
  for (const client of wss.clients) {
    if (client === exceptWs) {
      continue
    }
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(payload))
    }
  }
}

function nextFreeSlot() {
  if (!slotClients[1]) {
    return 1
  }
  if (!slotClients[2]) {
    return 2
  }
  return null
}

function broadcastPresence() {
  broadcast({
    type: 'presence',
    players: {
      1: { connected: players[1].connected },
      2: { connected: players[2].connected }
    }
  })
}

function broadcastHealth() {
  broadcast({
    type: 'health',
    values: {
      1: health[1],
      2: health[2]
    }
  })
}

function resetSlotHealth(slot) {
  health[slot] = MAX_HEALTH
}

function resetSlotState(slot) {
  const spawn = spawnFor(slot)
  players[slot].x = spawn.x
  players[slot].y = spawn.y
  players[slot].flipX = false
  players[slot].moving = false
}

wss.on('connection', (ws) => {
  const slot = nextFreeSlot()
  if (!slot) {
    send(ws, { type: 'full', message: 'Room full (2 players max).' })
    ws.close()
    return
  }

  slotClients[slot] = ws
  players[slot].connected = true
  ws.slot = slot

  send(ws, {
    type: 'welcome',
    slot,
    players,
    health: { ...health }
  })

  broadcast(
    {
      type: 'player_joined',
      slot,
      state: players[slot]
    },
    ws
  )
  broadcastPresence()
  broadcastHealth()

  ws.on('message', (raw) => {
    let msg
    try {
      msg = JSON.parse(raw)
    } catch (e) {
      return
    }

    const fromSlot = ws.slot
    if (fromSlot !== 1 && fromSlot !== 2) {
      return
    }

    if (msg.type === 'state') {
      players[fromSlot].x = Number(msg.x) || players[fromSlot].x
      players[fromSlot].y = Number(msg.y) || players[fromSlot].y
      players[fromSlot].flipX = Boolean(msg.flipX)
      players[fromSlot].moving = Boolean(msg.moving)
      broadcast(
        {
          type: 'state',
          slot: fromSlot,
          x: players[fromSlot].x,
          y: players[fromSlot].y,
          flipX: players[fromSlot].flipX,
          moving: players[fromSlot].moving
        },
        ws
      )
      return
    }

    if (msg.type === 'shoot') {
      broadcast(
        {
          type: 'shoot',
          slot: fromSlot,
          x: Number(msg.x) || players[fromSlot].x,
          y: Number(msg.y) || players[fromSlot].y,
          dx: Number(msg.dx) || 0,
          dy: Number(msg.dy) || 0
        },
        ws
      )
      return
    }

    if (msg.type === 'hit') {
      const targetSlot = Number(msg.targetSlot)
      if (targetSlot !== 1 && targetSlot !== 2) {
        return
      }
      if (targetSlot === fromSlot) {
        return
      }

      health[targetSlot] = Math.max(0, health[targetSlot] - DAMAGE_PER_HIT)

      if (health[targetSlot] <= 0) {
        resetSlotHealth(targetSlot)
        resetSlotState(targetSlot)
        broadcast({
          type: 'state',
          slot: targetSlot,
          x: players[targetSlot].x,
          y: players[targetSlot].y,
          flipX: players[targetSlot].flipX,
          moving: players[targetSlot].moving
        })
      }
      broadcastHealth()
    }
  })

  ws.on('close', () => {
    const closedSlot = ws.slot
    if (closedSlot === 1 || closedSlot === 2) {
      slotClients[closedSlot] = null
      players[closedSlot].connected = false
      resetSlotHealth(closedSlot)
      resetSlotState(closedSlot)
      broadcast({ type: 'player_left', slot: closedSlot })
      broadcastPresence()
      broadcastHealth()
    }
  })
})
