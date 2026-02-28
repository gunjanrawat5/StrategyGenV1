from uuid import uuid4

from app.models.schemas import GamePlan, JobCreateRequest, JobResponse
from app.services.builder import build_game
from app.services.llm import generate_title

_jobs: dict[str, JobResponse] = {}


def create_job_record(payload: JobCreateRequest) -> JobResponse:
    job_id = str(uuid4())
    title = generate_title(payload.prompt)
    build = build_game(job_id)

    job = JobResponse(
        job_id=job_id,
        status=build.status,
        plan=GamePlan(title=title),
        game_url=build.game_url,
        error=build.error,
    )
    _jobs[job_id] = job
    return job


def get_job_record(job_id: str) -> JobResponse | None:
    return _jobs.get(job_id)
