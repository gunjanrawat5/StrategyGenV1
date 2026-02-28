from __future__ import annotations

from pathlib import Path

from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.models import CreateJobRequest, CreateJobResponse, JobResponse
from app.settings import Settings
from app.services.jobs import JobService
from app.services.llm import DeterministicPlanGenerator, GeminiPlanGenerator

BASE_DIR = Path(__file__).resolve().parent
ARTIFACTS_DIR = BASE_DIR / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)
(ARTIFACTS_DIR / "games").mkdir(parents=True, exist_ok=True)

app = FastAPI(title="GGen Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/games", StaticFiles(directory=ARTIFACTS_DIR / "games", html=True), name="games")

settings = Settings.from_env()
if settings.gemini_api_key:
    plan_generator = GeminiPlanGenerator(
        api_key=settings.gemini_api_key,
        model=settings.gemini_model,
        max_retries=settings.gemini_max_retries,
        timeout_seconds=settings.gemini_timeout_seconds,
        http_retries=settings.gemini_http_retries,
    )
else:
    plan_generator = DeterministicPlanGenerator()

job_service = JobService(artifacts_root=ARTIFACTS_DIR, plan_generator=plan_generator)


@app.get("/")
def read_root() -> dict[str, str]:
    mode = "gemini" if settings.gemini_api_key else "deterministic"
    return {"message": "GGen backend is running.", "plan_generator": mode}


@app.post("/jobs", response_model=CreateJobResponse)
def create_job(payload: CreateJobRequest, background_tasks: BackgroundTasks) -> CreateJobResponse:
    try:
        job = job_service.create_job(payload.prompt, mode=payload.mode, base_game_id=payload.base_game_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    background_tasks.add_task(job_service.process_job, job.job_id)
    return CreateJobResponse(job_id=job.job_id, status=job.status, mode=job.mode)


@app.get("/jobs/{job_id}", response_model=JobResponse)
def get_job(job_id: str) -> JobResponse:
    job = job_service.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobResponse(
        job_id=job.job_id,
        status=job.status,
        mode=job.mode,
        base_game_id=job.base_game_id,
        prompt=job.prompt,
        error=job.error,
        game_url=job.game_url,
        plan=job.plan,
    )
