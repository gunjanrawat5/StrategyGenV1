from __future__ import annotations

import json
import shutil
import subprocess
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from app.models import DifficultyParams, EnemyArchetype, GamePlan, GenerationMode, JobStatus, PhysicsRules, PlayerConfig, SceneObject
from app.services.builder import build_game_artifact, build_shooter_preset_artifact, extract_scene_module_from_game_js
from app.services.llm import PlanGenerator


@dataclass(slots=True)
class JobRecord:
    job_id: str
    prompt: str
    mode: GenerationMode
    base_game_id: str | None
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    error: str | None = None
    game_url: str | None = None
    plan: GamePlan | None = None


class JobService:
    def __init__(self, artifacts_root: Path, plan_generator: PlanGenerator):
        self.artifacts_root = artifacts_root
        self.plan_generator = plan_generator
        self._jobs: dict[str, JobRecord] = {}

    def create_job(self, prompt: str, mode: GenerationMode, base_game_id: str | None) -> JobRecord:
        if mode == GenerationMode.MODIFY and not base_game_id:
            raise ValueError("base_game_id is required when mode is 'modify'")
        if base_game_id is not None and not self._game_exists(base_game_id):
            raise ValueError(f"Base game '{base_game_id}' does not exist")

        now = datetime.now(timezone.utc)
        job_id = uuid.uuid4().hex
        job = JobRecord(
            job_id=job_id,
            prompt=prompt,
            mode=mode,
            base_game_id=base_game_id,
            status=JobStatus.DESIGNING,
            created_at=now,
            updated_at=now,
        )
        self._jobs[job_id] = job
        return job

    def get_job(self, job_id: str) -> JobRecord | None:
        return self._jobs.get(job_id)

    def process_job(self, job_id: str) -> None:
        job = self._jobs[job_id]
        try:
            self._set_status(job, JobStatus.DESIGNING)
            if self._is_shooter_preset_prompt(job.prompt):
                plan = self._build_shooter_preset_plan(job.prompt)
                self._set_status(job, JobStatus.BUILDING)
                source_game_code = self._load_shooter_preset_source_code()
                artifact = build_shooter_preset_artifact(
                    job_id=job_id,
                    plan=plan,
                    artifacts_root=self.artifacts_root,
                    source_game_code=source_game_code,
                )
                self._set_status(job, JobStatus.TESTING)
                self._run_preset_smoke_checks(artifact.game_dir)

                job.plan = plan
                job.game_url = artifact.game_url
                self._set_status(job, JobStatus.READY)
                return

            previous_plan = self._load_game_plan(job.base_game_id) if job.mode == GenerationMode.MODIFY else None
            plan = self.plan_generator.generate_plan(job.prompt, previous_plan=previous_plan)

            self._set_status(job, JobStatus.BUILDING)
            previous_scene_code = self._load_scene_module_code(job.base_game_id) if job.mode == GenerationMode.MODIFY else None
            scene_module_js = self.plan_generator.generate_game_code(
                job.prompt,
                plan=plan,
                previous_code=previous_scene_code,
            )
            artifact = build_game_artifact(
                job_id=job_id,
                plan=plan,
                scene_module_js=scene_module_js,
                artifacts_root=self.artifacts_root,
            )

            self._set_status(job, JobStatus.TESTING)
            self._run_smoke_checks(artifact.game_dir)

            job.plan = plan
            job.game_url = artifact.game_url
            self._set_status(job, JobStatus.READY)
        except Exception as exc:  # noqa: BLE001
            job.error = str(exc)
            self._set_status(job, JobStatus.FAILED)

    @staticmethod
    def _is_shooter_preset_prompt(prompt: str) -> bool:
        return "shooter" in prompt.lower()

    @staticmethod
    def _build_shooter_preset_plan(prompt: str) -> GamePlan:
        return GamePlan(
            title="2D Shooter Preset",
            genre="Arena Shooter",
            core_loop="Move, aim, and shoot projectiles in a top-down arena.",
            controls=["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "W", "A", "S", "D"],
            mechanics=["shoot", "survive", "dodge"],
            player=PlayerConfig(speed=280, radius=14, color="#4cc9f0", health=10),
            enemy_archetypes=[
                EnemyArchetype(
                    id="ducky_opponent",
                    movement="chase",
                    speed=260,
                    radius=14,
                    color="#f94144",
                    count=1,
                )
            ],
            player_rules=[
                "Players move using arrow keys.",
                "Projectiles are fired using WASD.",
                "Health decreases on projectile hit.",
            ],
            enemy_rules=["The opponent mirrors networked player movement in multiplayer mode."],
            physics_rules=PhysicsRules(gravity=0, max_speed=320, friction=0.12),
            win_condition="Outlast the opposing player in the arena.",
            lose_condition="Health reaches zero.",
            ui_text={"title": "2D Arena Shooter"},
            difficulty=DifficultyParams(
                enemy_spawn_interval_ms=1000,
                enemy_speed=260,
                score_per_enemy=1,
                target_score=10,
            ),
            scene_graph_objects=[
                SceneObject(id="player_1", kind="player"),
                SceneObject(id="player_2", kind="enemy"),
                SceneObject(id="projectile", kind="projectile"),
                SceneObject(id="arena_obstacle", kind="decoration"),
            ],
        )

    def _load_shooter_preset_source_code(self) -> str:
        backend_root = self.artifacts_root.resolve().parent
        source_path = backend_root / "presets" / "2dShooter" / "source" / "GameScene.ts"
        if not source_path.exists():
            return "// Shooter preset source unavailable."
        return source_path.read_text(encoding="utf-8")

    def _set_status(self, job: JobRecord, status: JobStatus) -> None:
        job.status = status
        job.updated_at = datetime.now(timezone.utc)

    def _run_smoke_checks(self, game_dir: Path) -> None:
        if not (game_dir / "index.html").exists():
            raise RuntimeError("Missing artifact: index.html")
        if not (game_dir / "game.js").exists():
            raise RuntimeError("Missing artifact: game.js")
        if not (game_dir / "phaser.min.js").exists():
            raise RuntimeError("Missing artifact: phaser.min.js")
        if not (game_dir / "plan.json").exists():
            raise RuntimeError("Missing artifact: plan.json")

        node_bin = shutil.which("node")
        if node_bin:
            check = subprocess.run(
                [node_bin, "--check", str(game_dir / "game.js")],
                capture_output=True,
                text=True,
            )
            if check.returncode != 0:
                error_text = (check.stderr or check.stdout).strip()
                raise RuntimeError(f"Generated JS syntax check failed: {error_text}")

        # Simulate staged work while keeping the MVP deterministic.
        time.sleep(0.2)

    def _run_preset_smoke_checks(self, game_dir: Path) -> None:
        if not (game_dir / "index.html").exists():
            raise RuntimeError("Missing shooter preset artifact: index.html")
        if not (game_dir / "assets").exists():
            raise RuntimeError("Missing shooter preset artifact: assets")
        time.sleep(0.1)

    def _game_exists(self, game_id: str) -> bool:
        return (self.artifacts_root / "games" / game_id / "plan.json").exists()

    def _load_game_plan(self, game_id: str | None) -> GamePlan:
        if game_id is None:
            raise ValueError("Missing game_id for plan loading")
        plan_path = self.artifacts_root / "games" / game_id / "plan.json"
        if not plan_path.exists():
            raise ValueError(f"Base game '{game_id}' has no plan.json")
        raw = json.loads(plan_path.read_text(encoding="utf-8"))
        return GamePlan.model_validate(raw)

    def _load_game_code(self, game_id: str | None) -> str:
        if game_id is None:
            raise ValueError("Missing game_id for code loading")
        code_path = self.artifacts_root / "games" / game_id / "game.js"
        if not code_path.exists():
            raise ValueError(f"Base game '{game_id}' has no game.js")
        return code_path.read_text(encoding="utf-8")

    def _load_scene_module_code(self, game_id: str | None) -> str:
        full_code = self._load_game_code(game_id)
        extracted = extract_scene_module_from_game_js(full_code)
        return extracted or full_code
