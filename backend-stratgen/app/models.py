from pydantic import BaseModel
from typing import Literal

JobStatus = Literal["designing", "building", "testing", "ready", "failed"]
GenerationMode = Literal["new", "modify"]


class GamePlan(BaseModel):
    title: str


class JobCreateRequest(BaseModel):
    prompt: str
    mode: GenerationMode = "new"
    base_game_id: str | None = None


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    plan: GamePlan | None = None
    game_url: str | None = None
    error: str | None = None
