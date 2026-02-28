# StrategyGenV1

Monorepo with a FastAPI backend and a Vite + React frontend.

## Project Structure

- backend-stratgen: API, services, AI engine integration
- frontend-stratgen: UI client application

## Quick Start

### Backend

1. Create and activate a virtual environment
2. Install dependencies:
   pip install -r backend-stratgen/requirements.txt
3. Run API:
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

### Frontend

1. Install dependencies:
   npm install --prefix frontend-stratgen
2. Run dev server:
   npm run dev --prefix frontend-stratgen

### Docker Compose (optional)

Run both services together:

docker compose up
