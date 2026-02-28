# backend-stratgen/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import router as api_router

app = FastAPI(
    title="StrategyGen API",
    description="AI-powered strategy generation engine.",
    version="1.0.0"
)

# Crucial for local development with React/Vite
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "[http://127.0.0.1:5173](http://127.0.0.1:5173)"], # Vite default ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the routes
app.include_router(api_router, prefix="/api")

@app.get("/")
async def health_check():
    return {"status": "Backend is running flawlessly"}