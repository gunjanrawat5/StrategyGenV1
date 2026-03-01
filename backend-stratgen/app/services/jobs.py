from __future__ import annotations

import json
import re
import shutil
import subprocess
import threading
import time
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

from app.models import DifficultyParams, EnemyArchetype, GamePlan, GenerationMode, JobStatus, PhysicsRules, PlayerConfig, SceneObject
from app.services.builder import build_shooter_modified_artifact, build_shooter_preset_artifact, extract_scene_module_from_game_js
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
    def __init__(self, artifacts_root: Path, plan_generator: PlanGenerator, max_concurrent_llm_requests: int = 4):
        self.artifacts_root = artifacts_root
        self.plan_generator = plan_generator
        self._jobs: dict[str, JobRecord] = {}
        self._llm_call_semaphore = threading.BoundedSemaphore(max(1, max_concurrent_llm_requests))

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

            # Modify-only mode: always edit an existing shooter-preset-derived game.
            base_game_id = self._resolve_base_game_for_modify(job)
            plan = self._load_game_plan(base_game_id)
            previous_scene_code = self._load_scene_module_code(base_game_id)
            self._set_status(job, JobStatus.BUILDING)
            scene_module_js = self._apply_shooter_prompt_edits(previous_scene_code, job.prompt)
            artifact = build_shooter_modified_artifact(
                job_id=job_id,
                plan=plan,
                artifacts_root=self.artifacts_root,
                source_game_code=scene_module_js,
            )

            self._set_status(job, JobStatus.TESTING)
            self._run_preset_smoke_checks(artifact.game_dir)
            self._write_modify_metadata(artifact.game_dir, job_id=job_id, title=plan.title, base_game_id=base_game_id)

            job.plan = plan
            job.game_url = artifact.game_url
            job.base_game_id = base_game_id
            self._set_status(job, JobStatus.READY)
        except Exception as exc:  # noqa: BLE001
            job.error = str(exc)
            self._set_status(job, JobStatus.FAILED)

    def _apply_shooter_prompt_edits(self, previous_code: str, prompt: str) -> str:
        edited = previous_code
        prompt_l = prompt.lower()

        def _replace_int(pattern: str, value: int) -> None:
            nonlocal edited
            edited = re.sub(pattern, str(value), edited, count=1)

        # Shooting speed edits: "shooting 3x faster", "2x slower shooting", etc.
        speed_factor = self._extract_speed_factor(prompt_l, subject="shoot")
        if speed_factor is not None:
            cooldown_match = re.search(r"shotCooldownMs\s*=\s*(\d+)", edited)
            projectile_match = re.search(r"setVelocity\([^*]*\*\s*(\d+)\s*,\s*[^*]*\*\s*(\d+)\)", edited)
            if cooldown_match:
                current = int(cooldown_match.group(1))
                updated = max(20, int(round(current / speed_factor)))
                edited = re.sub(r"shotCooldownMs\s*=\s*\d+", f"shotCooldownMs = {updated}", edited, count=1)
            if projectile_match:
                current = int(projectile_match.group(1))
                updated = max(60, int(round(current * speed_factor)))
                edited = re.sub(
                    r"setVelocity\(([^*]*\*)\s*\d+\s*,\s*([^*]*\*)\s*\d+\)",
                    rf"setVelocity(\1{updated}, \2{updated})",
                    edited,
                    count=1,
                )

        # Direct numeric overrides.
        cooldown_override = re.search(r"(?:shot|shoot(?:ing)?)\s*cooldown[^0-9]*(\d+)\s*ms", prompt_l)
        if cooldown_override:
            updated = max(20, int(cooldown_override.group(1)))
            edited = re.sub(r"shotCooldownMs\s*=\s*\d+", f"shotCooldownMs = {updated}", edited, count=1)

        projectile_override = re.search(r"(?:projectile|bullet)\s*speed[^0-9]*(\d+)", prompt_l)
        if projectile_override:
            updated = max(60, int(projectile_override.group(1)))
            edited = re.sub(
                r"setVelocity\(([^*]*\*)\s*\d+\s*,\s*([^*]*\*)\s*\d+\)",
                rf"setVelocity(\1{updated}, \2{updated})",
                edited,
                count=1,
            )

        player_speed_factor = self._extract_speed_factor(prompt_l, subject="player")
        if player_speed_factor is not None:
            max_speed_match = re.search(r"setMaxSpeed\(\s*(\d+)\s*\)", edited)
            accel_match = re.search(r"setAccelerationX\(\s*-(\d+)\s*\)", edited)
            if max_speed_match:
                current = int(max_speed_match.group(1))
                updated = max(80, int(round(current * player_speed_factor)))
                edited = re.sub(r"setMaxSpeed\(\s*\d+\s*\)", f"setMaxSpeed({updated})", edited, count=1)
            if accel_match:
                current = int(accel_match.group(1))
                updated = max(100, int(round(current * player_speed_factor)))
                edited = re.sub(r"setAccelerationX\(\s*-\d+\s*\)", f"setAccelerationX(-{updated})", edited)
                edited = re.sub(r"setAccelerationX\(\s*\d+\s*\)", f"setAccelerationX({updated})", edited)
                edited = re.sub(r"setAccelerationY\(\s*-\d+\s*\)", f"setAccelerationY(-{updated})", edited)
                edited = re.sub(r"setAccelerationY\(\s*\d+\s*\)", f"setAccelerationY({updated})", edited)

        player_speed_override = re.search(r"(?:player|movement)\s*speed[^0-9]*(\d+)", prompt_l)
        if player_speed_override:
            updated = max(80, int(player_speed_override.group(1)))
            edited = re.sub(r"setMaxSpeed\(\s*\d+\s*\)", f"setMaxSpeed({updated})", edited, count=1)

        return edited

    @staticmethod
    def _extract_speed_factor(prompt_l: str, subject: str) -> float | None:
        if subject == "shoot":
            patterns = [
                r"shoot(?:ing)?\s*(\d+(?:\.\d+)?)x\s*(faster|slower)",
                r"(\d+(?:\.\d+)?)x\s*(faster|slower)\s*shoot(?:ing)?",
            ]
        else:
            patterns = [
                r"player\s*(\d+(?:\.\d+)?)x\s*(faster|slower)",
                r"(\d+(?:\.\d+)?)x\s*(faster|slower)\s*player",
                r"movement\s*(\d+(?:\.\d+)?)x\s*(faster|slower)",
            ]

        for pattern in patterns:
            match = re.search(pattern, prompt_l)
            if not match:
                continue
            factor = float(match.group(1))
            direction = match.group(2)
            if factor <= 0:
                return None
            return factor if direction == "faster" else 1 / factor
        return None

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

    def _find_latest_shooter_preset_game_id(self) -> str | None:
        games_root = self.artifacts_root / "games"
        if not games_root.exists():
            return None

        latest: tuple[float, str] | None = None
        for game_dir in games_root.iterdir():
            if not game_dir.is_dir():
                continue
            metadata_path = game_dir / "metadata.json"
            if not metadata_path.exists():
                continue
            try:
                raw = json.loads(metadata_path.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                continue
            if raw.get("preset") != "2dShooter":
                continue
            mtime = metadata_path.stat().st_mtime
            if latest is None or mtime > latest[0]:
                latest = (mtime, game_dir.name)

        return latest[1] if latest else None

    def _resolve_base_game_for_modify(self, job: JobRecord) -> str:
        # If user provided a base game, require preset lineage.
        if job.base_game_id:
            if not self._is_preset_lineage_game(job.base_game_id):
                raise RuntimeError(
                    f"Base game '{job.base_game_id}' is not preset-derived. "
                    "Only shooter preset games can be modified."
                )
            return job.base_game_id

        # Otherwise default to latest preset-derived game for prompt-only editing flow.
        latest = self._find_latest_preset_lineage_game_id()
        if latest is None:
            raise RuntimeError("No preset-derived game found. Generate a 'shooter' game first.")
        return latest

    def _find_latest_preset_lineage_game_id(self) -> str | None:
        games_root = self.artifacts_root / "games"
        if not games_root.exists():
            return None

        latest: tuple[float, str] | None = None
        for game_dir in games_root.iterdir():
            if not game_dir.is_dir():
                continue
            metadata_path = game_dir / "metadata.json"
            if not metadata_path.exists():
                continue
            try:
                raw = json.loads(metadata_path.read_text(encoding="utf-8"))
            except Exception:  # noqa: BLE001
                continue
            if raw.get("preset") != "2dShooter" and not raw.get("preset_derived"):
                continue
            mtime = metadata_path.stat().st_mtime
            if latest is None or mtime > latest[0]:
                latest = (mtime, game_dir.name)
        return latest[1] if latest else None

    def _is_preset_lineage_game(self, game_id: str) -> bool:
        metadata_path = self.artifacts_root / "games" / game_id / "metadata.json"
        if not metadata_path.exists():
            return False
        try:
            raw = json.loads(metadata_path.read_text(encoding="utf-8"))
        except Exception:  # noqa: BLE001
            return False
        return bool(raw.get("preset") == "2dShooter" or raw.get("preset_derived"))

    def _write_modify_metadata(self, game_dir: Path, job_id: str, title: str, base_game_id: str) -> None:
        metadata_path = game_dir / "metadata.json"
        slug = game_dir.name
        if metadata_path.exists():
            try:
                previous = json.loads(metadata_path.read_text(encoding="utf-8"))
                slug = previous.get("slug", slug)
            except Exception:  # noqa: BLE001
                pass
        metadata_path.write_text(
            json.dumps(
                {
                    "job_id": job_id,
                    "slug": slug,
                    "title": title,
                    "preset": "2dShooter",
                    "preset_derived": True,
                    "base_game_id": base_game_id,
                    "mode": "modify-only",
                },
                indent=2,
            ),
            encoding="utf-8",
        )

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
