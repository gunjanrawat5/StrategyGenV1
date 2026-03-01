from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass

from fastapi import WebSocket
from starlette.websockets import WebSocketDisconnect, WebSocketState


@dataclass(slots=True)
class PlayerState:
    x: float
    y: float
    flip_x: bool
    moving: bool
    connected: bool


class ShooterRealtimeServer:
    def __init__(self) -> None:
        self.max_health = 100
        self.damage_per_hit = 12
        self._lock = asyncio.Lock()
        self._slot_clients: dict[int, WebSocket | None] = {1: None, 2: None}
        self._players: dict[int, PlayerState] = {
            1: PlayerState(x=384.0, y=576.0, flip_x=False, moving=False, connected=False),
            2: PlayerState(x=504.0, y=456.0, flip_x=False, moving=False, connected=False),
        }
        self._health: dict[int, int] = {1: self.max_health, 2: self.max_health}
        self._ws_slots: dict[WebSocket, int] = {}

    @staticmethod
    def _spawn_for(slot: int) -> tuple[float, float]:
        if slot == 1:
            return 384.0, 576.0
        return 504.0, 456.0

    async def _send(self, ws: WebSocket | None, payload: dict) -> None:
        if ws is None:
            return
        try:
            if ws.application_state == WebSocketState.CONNECTED:
                await ws.send_text(json.dumps(payload))
        except Exception:
            # Best-effort messaging: ignore broken sockets and let disconnect cleanup handle state.
            pass

    async def _broadcast(self, payload: dict, except_ws: WebSocket | None = None) -> None:
        for ws in self._slot_clients.values():
            if ws is None or ws is except_ws:
                continue
            await self._send(ws, payload)

    async def _broadcast_presence(self) -> None:
        payload = {
            "type": "presence",
            "players": {
                "1": {"connected": self._players[1].connected},
                "2": {"connected": self._players[2].connected},
            },
        }
        await self._broadcast(payload)

    async def _broadcast_health(self) -> None:
        payload = {
            "type": "health",
            "values": {"1": self._health[1], "2": self._health[2]},
        }
        await self._broadcast(payload)

    async def _process_message(self, ws: WebSocket, slot: int, msg: dict) -> None:
        msg_type = msg.get("type")

        if msg_type == "state":
            player = self._players[slot]
            player.x = float(msg.get("x", player.x))
            player.y = float(msg.get("y", player.y))
            player.flip_x = bool(msg.get("flipX", player.flip_x))
            player.moving = bool(msg.get("moving", player.moving))
            await self._broadcast(
                {
                    "type": "state",
                    "slot": slot,
                    "x": player.x,
                    "y": player.y,
                    "flipX": player.flip_x,
                    "moving": player.moving,
                },
                except_ws=ws,
            )
            return

        if msg_type == "shoot":
            await self._broadcast(
                {
                    "type": "shoot",
                    "slot": slot,
                    "x": float(msg.get("x", self._players[slot].x)),
                    "y": float(msg.get("y", self._players[slot].y)),
                    "dx": float(msg.get("dx", 0)),
                    "dy": float(msg.get("dy", 0)),
                },
                except_ws=ws,
            )
            return

        if msg_type == "hit":
            target_slot = int(msg.get("targetSlot", 0))
            if target_slot not in (1, 2) or target_slot == slot:
                return

            self._health[target_slot] = max(0, self._health[target_slot] - self.damage_per_hit)
            if self._health[target_slot] <= 0:
                self._health[target_slot] = self.max_health
                spawn_x, spawn_y = self._spawn_for(target_slot)
                target = self._players[target_slot]
                target.x = spawn_x
                target.y = spawn_y
                target.flip_x = False
                target.moving = False
                await self._broadcast(
                    {
                        "type": "state",
                        "slot": target_slot,
                        "x": target.x,
                        "y": target.y,
                        "flipX": target.flip_x,
                        "moving": target.moving,
                    }
                )
            await self._broadcast_health()

    async def handle_connection(self, ws: WebSocket) -> None:
        await ws.accept()

        async with self._lock:
            slot = 1 if self._slot_clients[1] is None else 2 if self._slot_clients[2] is None else None
            if slot is None:
                await self._send(ws, {"type": "full", "message": "Room full (2 players max)."})
                await ws.close()
                return

            self._slot_clients[slot] = ws
            self._ws_slots[ws] = slot
            self._players[slot].connected = True

            await self._send(
                ws,
                {
                    "type": "welcome",
                    "slot": slot,
                    "players": {
                        "1": {
                            "x": self._players[1].x,
                            "y": self._players[1].y,
                            "flipX": self._players[1].flip_x,
                            "moving": self._players[1].moving,
                            "connected": self._players[1].connected,
                        },
                        "2": {
                            "x": self._players[2].x,
                            "y": self._players[2].y,
                            "flipX": self._players[2].flip_x,
                            "moving": self._players[2].moving,
                            "connected": self._players[2].connected,
                        },
                    },
                    "health": {"1": self._health[1], "2": self._health[2]},
                },
            )
            await self._broadcast(
                {
                    "type": "player_joined",
                    "slot": slot,
                    "state": {
                        "x": self._players[slot].x,
                        "y": self._players[slot].y,
                        "flipX": self._players[slot].flip_x,
                        "moving": self._players[slot].moving,
                        "connected": self._players[slot].connected,
                    },
                },
                except_ws=ws,
            )
            await self._broadcast_presence()
            await self._broadcast_health()

        try:
            while True:
                raw = await ws.receive_text()
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                async with self._lock:
                    current_slot = self._ws_slots.get(ws)
                    if current_slot in (1, 2):
                        await self._process_message(ws, current_slot, msg)
        except WebSocketDisconnect:
            pass
        finally:
            async with self._lock:
                closed_slot = self._ws_slots.pop(ws, None)
                if closed_slot not in (1, 2):
                    return
                if self._slot_clients[closed_slot] is ws:
                    self._slot_clients[closed_slot] = None
                self._players[closed_slot].connected = False
                self._health[closed_slot] = self.max_health
                spawn_x, spawn_y = self._spawn_for(closed_slot)
                player = self._players[closed_slot]
                player.x = spawn_x
                player.y = spawn_y
                player.flip_x = False
                player.moving = False
                await self._broadcast({"type": "player_left", "slot": closed_slot})
                await self._broadcast_presence()
                await self._broadcast_health()
