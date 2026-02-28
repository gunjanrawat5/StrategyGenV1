from app.services.types import BuildResult


def build_game(job_id: str) -> BuildResult:
    # Stubbed build flow.
    return BuildResult(status="ready", game_url=f"/artifacts/{job_id}/index.html")
