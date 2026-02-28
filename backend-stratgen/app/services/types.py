from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from app.models import GamePlan


@dataclass(slots=True)
class BuildArtifact:
    game_dir: Path
    game_url: str
    plan: GamePlan
