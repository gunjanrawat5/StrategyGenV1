# GGen Monorepo

GGen is a local game generation studio with:
- a `Next.js` frontend (`frontend-overlord`)
- a `FastAPI` backend (`backend-stratgen`)
- preset game templates (currently `2dShooter` and `2dSpace`)

The backend creates playable game artifacts under `/games/<job_id>/index.html`, and the frontend serves the studio UI plus a websocket relay for 2-player sessions.

## Repository Layout

```text
Ggen/
├─ frontend-overlord/        # Next.js app + custom node server + WS relay
├─ backend-stratgen/         # FastAPI job pipeline + artifact builder + presets
├─ temp-2dShooter/           # scratch/prototype files
├─ temp-2dSpace/             # scratch/prototype files
└─ LICENSE
```

## Architecture

1. User submits prompt in frontend studio.
2. Frontend calls backend jobs API.
3. Backend generates a `GamePlan` and builds an artifact from preset pipelines.
4. Artifact is available at backend `/games/<job_id>/index.html`.
5. Frontend proxies `/games/*` to backend and embeds the game in `iframe`.
6. Multiplayer state is relayed through frontend websocket endpoint `/ws`.

## Tech Stack

- Frontend: `Next.js 16`, `React 19`, `TypeScript`, Tailwind, custom `server.js` websocket relay
- Backend: `FastAPI`, `Pydantic v2`, `uvicorn`, optional Featherless LLM provider
- Runtime: Preset games are HTML5 canvas/WebGL style JS artifacts

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.11+ (3.10 should also work in most cases)
- Windows/macOS/Linux shell

## Local Setup

### 1. Frontend

```bash
cd frontend-overlord
npm install
```

Create `frontend-overlord/.env.local`:

```env
# required for proxying generated game artifacts
BACKEND_BASE_URL=http://127.0.0.1:8000

# optional
HOST=0.0.0.0
PORT=3000
```

Start frontend:

```bash
npm run dev
```

### 2. Backend

```bash
cd backend-stratgen
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend-stratgen/.env` (minimal + optional):

```env
# optional: enables Featherless planner mode
LLM_API_KEY=
LLM_BASE_URL=https://api.featherless.ai/v1
LLM_MODEL=Qwen/Qwen2.5-Coder-32B-Instruct

# optional websocket overrides injected into artifacts
SHOOTER_WS_URL=
SPACE_WS_URL=
```

Start backend:

```bash
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

## Run the Full App

With both servers running:
- Frontend studio: `http://localhost:3000`
- Backend API root: `http://127.0.0.1:8000`

## API Quick Reference

### Create job

`POST /jobs`

Body:

```json
{
  "prompt": "Create a 2d shooter with duck players",
  "mode": "new"
}
```

For modifications:

```json
{
  "prompt": "Increase player speed",
  "mode": "modify",
  "base_game_id": "existing_job_id"
}
```

### Get job status

`GET /jobs/{job_id}`

Possible statuses:
- `designing`
- `building`
- `testing`
- `ready`
- `failed`

When `ready`, use `game_url` from response (typically `/games/<job_id>/index.html`).

## Preset Pipelines

- `backend-stratgen/presets/2dShooter`
- `backend-stratgen/presets/2dSpace`

Build logic lives in:
- `backend-stratgen/app/services/jobs.py`
- `backend-stratgen/app/services/builder.py`

Preset detection currently routes shooter/space prompts into dedicated artifact builders.

## Multiplayer Notes

Frontend `server.js` hosts websocket relay at `/ws`:
- max 2 players
- slot assignment (`1` / `2`)
- relays movement and additional state (`score`, `level`, `hp`, `shield`, enemies/asteroids/bullets snapshots)

For remote play, expose frontend port (typically `3000`) via tunnel (for example ngrok) and use the same public URL for both players.

## Useful Paths

- Frontend entry: `frontend-overlord/src/app/page.tsx`
- Frontend preview panel: `frontend-overlord/src/components/CentralPreview.tsx`
- Frontend settings panel: `frontend-overlord/src/components/RightSettings.tsx`
- Frontend relay/proxy: `frontend-overlord/server.js`
- Backend app: `backend-stratgen/main.py`
- Job orchestration: `backend-stratgen/app/services/jobs.py`
- LLM integration: `backend-stratgen/app/services/llm.py`

## Troubleshooting

- `Cannot GET /`:
  - You are likely hitting backend directly on wrong route/port.
  - Use frontend URL (`localhost:3000`) for studio.
- `ERR_NGROK_3200`:
  - Tunnel is offline; restart ngrok on the correct port.
- Both players stuck on connecting:
  - Confirm both are on same frontend URL and `/ws` is reachable.
- Game generated but unchanged:
  - Verify prompt routes to expected preset and check backend logs for plan/build errors.

## License

See [LICENSE](./LICENSE).

