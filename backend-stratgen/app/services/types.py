from dataclasses import dataclass
from typing import Literal

JobStatus = Literal["designing", "building", "testing", "ready", "failed"]


@dataclass
class BuildResult:
    status: JobStatus
    game_url: str | None = None
    error: str | None = None
