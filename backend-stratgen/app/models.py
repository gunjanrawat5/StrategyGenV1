from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class JobStatus(str, Enum):
    DESIGNING = "designing"
    BUILDING = "building"
    TESTING = "testing"
    READY = "ready"
    FAILED = "failed"


class GenerationMode(str, Enum):
    NEW = "new"
    MODIFY = "modify"


class EntitySpec(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=60)
    behavior: str = Field(min_length=1, max_length=240)


class PhysicsRules(BaseModel):
    model_config = ConfigDict(extra="forbid")

    gravity: float = Field(ge=0, le=40)
    max_speed: float = Field(gt=0, le=1000)
    friction: float = Field(ge=0, le=1)


class DifficultyParams(BaseModel):
    model_config = ConfigDict(extra="forbid")

    enemy_spawn_interval_ms: int = Field(ge=100, le=10000)
    enemy_speed: float = Field(gt=0, le=1000)
    score_per_enemy: int = Field(ge=1, le=100000)
    target_score: int = Field(ge=5, le=100000)


class PlayerConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")

    speed: float = Field(gt=50, le=800)
    radius: int = Field(ge=6, le=48)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    health: int = Field(ge=1, le=20)


class EnemyArchetype(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    movement: Literal["fall", "zigzag", "chase"]
    speed: float = Field(gt=20, le=700)
    radius: int = Field(ge=6, le=42)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    count: int = Field(ge=1, le=25)


class SceneObject(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    kind: Literal["player", "enemy", "projectile", "pickup", "decoration"]


class GamePlan(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=120)
    genre: str = Field(min_length=1, max_length=80)
    core_loop: str = Field(min_length=1, max_length=500)
    controls: list[str] = Field(min_length=1, max_length=20)
    mechanics: list[Literal["dodge", "shoot", "collect", "survive"]] = Field(min_length=1, max_length=3)
    player: PlayerConfig
    enemy_archetypes: list[EnemyArchetype] = Field(min_length=1, max_length=8)
    player_rules: list[str] = Field(min_length=1, max_length=20)
    enemy_rules: list[str] = Field(min_length=1, max_length=20)
    physics_rules: PhysicsRules
    win_condition: str = Field(min_length=1, max_length=200)
    lose_condition: str = Field(min_length=1, max_length=200)
    ui_text: dict[str, str] = Field(default_factory=dict)
    difficulty: DifficultyParams
    scene_graph_objects: list[SceneObject] = Field(min_length=1, max_length=100)


class CreateJobRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1, max_length=3000)
    mode: GenerationMode = GenerationMode.NEW
    base_game_id: str | None = Field(default=None, min_length=6, max_length=128)


class CreateJobResponse(BaseModel):
    job_id: str
    status: JobStatus
    mode: GenerationMode


class JobResponse(BaseModel):
    job_id: str
    status: JobStatus
    mode: GenerationMode
    base_game_id: str | None = None
    prompt: str
    error: str | None = None
    game_url: str | None = None
    plan: GamePlan | None = None
