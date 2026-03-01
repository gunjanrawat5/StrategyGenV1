from __future__ import annotations

import json
import os
import re
import shutil
import socket
import subprocess
import tempfile
import time
from typing import Protocol
from urllib import error, request

from openai import OpenAI
from pydantic import ValidationError

from app.models import DifficultyParams, EnemyArchetype, GamePlan, PhysicsRules, PlayerConfig, SceneObject


class PlanGenerator(Protocol):
    def generate_plan(self, prompt: str, previous_plan: GamePlan | None = None) -> GamePlan:
        ...

    def generate_game_code(self, prompt: str, plan: GamePlan, previous_code: str | None = None) -> str:
        ...

    def apply_prompt_to_shooter_source(self, prompt: str, source_code: str, physics_context: str) -> str:
        ...


class DeterministicPlanGenerator:
    def generate_plan(self, prompt: str, previous_plan: GamePlan | None = None) -> GamePlan:
        if previous_plan is not None:
            updated = previous_plan.model_copy(deep=True)
            updated.title = self._extract_title(prompt)
            updated.core_loop = f"{previous_plan.core_loop} | Update: {prompt[:120]}"
            return updated

        title = self._extract_title(prompt)
        return GamePlan(
            title=title,
            genre="Arcade Survival",
            core_loop="Move, dodge enemies, survive, and build score over time.",
            controls=["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "R", "Space"],
            mechanics=["dodge", "shoot", "survive"],
            player=PlayerConfig(speed=260, radius=12, color="#08f7ff", health=3),
            enemy_archetypes=[
                EnemyArchetype(
                    id="enemy_faller",
                    movement="fall",
                    speed=140,
                    radius=10,
                    color="#ff4d6d",
                    count=6,
                )
            ],
            player_rules=["Player movement is 4-directional.", "Player collision with enemy causes immediate loss."],
            enemy_rules=["Enemies descend from top to bottom.", "Enemies respawn above screen when they exit viewport."],
            physics_rules=PhysicsRules(gravity=0, max_speed=300, friction=0.0),
            win_condition="Reach score 30.",
            lose_condition="Collide with any enemy.",
            ui_text={
                "title": title,
                "hint": "Use arrow keys to survive, Space to shoot, and R to reset.",
            },
            difficulty=DifficultyParams(
                enemy_spawn_interval_ms=700,
                enemy_speed=140,
                score_per_enemy=1,
                target_score=30,
            ),
            scene_graph_objects=[
                SceneObject(id="player", kind="player"),
                SceneObject(id="enemy_1", kind="enemy"),
                SceneObject(id="projectile_1", kind="projectile"),
            ],
        )

    def generate_game_code(self, prompt: str, plan: GamePlan, previous_code: str | None = None) -> str:
        return """
function createGeneratedScene(Phaser, PLAN) {
  return class GeneratedScene extends Phaser.Scene {
    constructor() {
      super('generated');
      this.score = 0;
      this.isGameOver = false;
    }

    create() {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.resetKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);
      this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.player = this.add.circle(
        this.scale.width / 2,
        this.scale.height - 40,
        PLAN.player.radius,
        parseInt(PLAN.player.color.replace('#', ''), 16)
      );
      this.playerSpeed = PLAN.player.speed;
      this.enemies = [];
      this.bullets = [];
      for (let i = 0; i < 6; i += 1) {
        const enemy = this.add.circle(90 + i * 120, -30 - i * 60, 10, 0xff4d6d);
        enemy.speed = 120 + i * 8;
        this.enemies.push(enemy);
      }
      this.scoreText = this.add.text(12, 12, 'Score: 0', {
        fontFamily: 'monospace',
        fontSize: '16px',
        color: '#d9faff',
      });
    }

    update(_, dtMs) {
      const dt = Math.min(dtMs / 1000, 0.033);
      if (Phaser.Input.Keyboard.JustDown(this.resetKey)) this.scene.restart();
      if (this.cursors.left.isDown) this.player.x -= this.playerSpeed * dt;
      if (this.cursors.right.isDown) this.player.x += this.playerSpeed * dt;
      if (this.cursors.up.isDown) this.player.y -= this.playerSpeed * dt;
      if (this.cursors.down.isDown) this.player.y += this.playerSpeed * dt;
      this.player.x = Phaser.Math.Clamp(this.player.x, 12, this.scale.width - 12);
      this.player.y = Phaser.Math.Clamp(this.player.y, 12, this.scale.height - 12);

      if (Phaser.Input.Keyboard.JustDown(this.shootKey)) {
        const bullet = this.add.rectangle(this.player.x, this.player.y - 16, 4, 12, 0xa8f0ff);
        bullet.vy = -500;
        this.bullets.push(bullet);
      }
      this.bullets = this.bullets.filter((bullet) => {
        bullet.y += bullet.vy * dt;
        if (bullet.y < -20) {
          bullet.destroy();
          return false;
        }
        return true;
      });

      for (const enemy of this.enemies) {
        enemy.y += enemy.speed * dt;
        if (enemy.y > this.scale.height + 20) {
          enemy.y = -20;
          enemy.x = Phaser.Math.Between(20, this.scale.width - 20);
          this.score += 1;
        }
      }
      this.scoreText.setText(`Score: ${this.score}`);
    }
  };
}
"""

    def apply_prompt_to_shooter_source(self, prompt: str, source_code: str, physics_context: str) -> str:
        return source_code

    @staticmethod
    def _extract_title(prompt: str) -> str:
        stripped = " ".join(prompt.split())
        if len(stripped) <= 60:
            return stripped.title()
        return stripped[:57].rstrip() + "..."


class GeminiPlanGenerator:
    def __init__(
        self,
        api_key: str,
        model: str,
        max_retries: int = 2,
        timeout_seconds: int = 90,
        http_retries: int = 2,
    ):
        self.api_key = api_key
        self.model = model
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds
        self.http_retries = http_retries
        self.endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

    def generate_plan(self, prompt: str, previous_plan: GamePlan | None = None) -> GamePlan:
        raw_plan = self._generate_raw_plan(prompt, previous_plan)
        for attempt in range(self.max_retries + 1):
            try:
                return GamePlan.model_validate_json(raw_plan)
            except ValidationError as exc:
                if attempt >= self.max_retries:
                    raise RuntimeError(f"Gemini plan validation failed after retries: {exc}") from exc
                raw_plan = self._repair_raw_plan(prompt, raw_plan, exc, previous_plan)
        raise RuntimeError("Unexpected plan generation state.")

    def generate_game_code(self, prompt: str, plan: GamePlan, previous_code: str | None = None) -> str:
        raw_code = self._generate_raw_code(prompt, plan, previous_code)
        errors = self._validate_scene_module(raw_code)
        for attempt in range(self.max_retries + 1):
            if not errors:
                return raw_code
            if attempt >= self.max_retries:
                raise RuntimeError(f"Gemini game code validation failed: {', '.join(errors)}")
            raw_code = self._repair_raw_code(prompt, plan, previous_code, raw_code, errors)
            errors = self._validate_scene_module(raw_code)
        raise RuntimeError("Unexpected code generation state.")

    def apply_prompt_to_shooter_source(self, prompt: str, source_code: str, physics_context: str) -> str:
        source_context = self._truncate_context(source_code, max_chars=getattr(self, "context_chars", 200000))
        physics_context_block = self._truncate_context(
            physics_context,
            max_chars=max(4000, getattr(self, "context_chars", 200000) // 2),
        )
        edit_prompt = (
            "You are editing an existing Phaser 3 TypeScript shooter scene file.\n"
            "Return only the FULL updated source file content. No markdown.\n\n"
            "Hard constraints:\n"
            "- Keep the same overall architecture and multiplayer WebSocket flow intact.\n"
            "- Keep class/exports/function names compatible with existing code.\n"
            "- Do not remove or rename message types used by multiplayer sync.\n"
            "- Prioritize gameplay and physics mechanic edits requested by the user.\n"
            "- Preserve unrelated logic and rendering code.\n\n"
            f"User edit request:\n{prompt}\n\n"
            f"Physics-related context from current file:\n{physics_context_block}\n\n"
            f"Current full source file:\n{source_context}\n"
        )
        edited = self._extract_javascript(self._call_model(edit_prompt)).strip()
        if not edited:
            raise RuntimeError("Model returned empty shooter source edit.")
        if "class GameScene" not in edited:
            raise RuntimeError("Model output missing GameScene class; refusing unsafe overwrite.")
        return edited

    def _generate_raw_plan(self, prompt: str, previous_plan: GamePlan | None = None) -> str:
        schema = json.dumps(GamePlan.model_json_schema(), indent=2)
        key_contract = self._plan_key_contract()
        if previous_plan is None:
            template_plan = DeterministicPlanGenerator().generate_plan(prompt).model_dump_json(indent=2)
            instruction = (
                "You design 2D Phaser browser games. Output only one valid JSON object matching schema. "
                "No markdown/comments. Keep game offline-only and within 1-3 mechanics. "
                "Use EXACT keys from schema/template; do not add or rename keys."
            )
            user_prompt = (
                f"{instruction}\n\n"
                f"User prompt:\n{prompt}\n\n"
                f"Key contract:\n{key_contract}\n\n"
                f"Canonical template (match this key shape exactly):\n{template_plan}\n\n"
                f"Required JSON schema:\n{schema}\n"
            )
        else:
            base_plan_json = previous_plan.model_dump_json(indent=2)
            instruction = (
                "Update the existing 2D Phaser game plan. Preserve parts not requested to change. "
                "Output only one valid JSON object matching schema. "
                "Use EXACT keys from schema; do not add new object shapes."
            )
            user_prompt = (
                f"{instruction}\n\n"
                f"User modification prompt:\n{prompt}\n\n"
                f"Key contract:\n{key_contract}\n\n"
                f"Current plan JSON:\n{base_plan_json}\n\n"
                f"Required JSON schema:\n{schema}\n"
            )
        return self._extract_json(self._call_model(user_prompt))

    def _repair_raw_plan(
        self,
        prompt: str,
        previous_raw_plan: str,
        validation_error: ValidationError,
        previous_plan: GamePlan | None = None,
    ) -> str:
        validation_details = json.dumps(validation_error.errors(include_url=False), indent=2)
        base_plan = previous_plan.model_dump_json(indent=2) if previous_plan else "None"
        repair_prompt = (
            "Repair this JSON to satisfy schema and validation errors. Return only JSON.\n"
            "Important: keep EXACT key names required by schema, remove unknown fields, and fill missing required fields.\n\n"
            f"Key contract:\n{self._plan_key_contract()}\n\n"
            f"Original prompt:\n{prompt}\n\n"
            f"Previous plan:\n{base_plan}\n\n"
            f"Invalid JSON:\n{previous_raw_plan}\n\n"
            f"Validation errors:\n{validation_details}\n"
        )
        return self._extract_json(self._call_model(repair_prompt))

    @staticmethod
    def _plan_key_contract() -> str:
        return (
            "Top-level required keys:\n"
            "- title, genre, core_loop, controls, mechanics, player, enemy_archetypes,\n"
            "  player_rules, enemy_rules, physics_rules, win_condition, lose_condition,\n"
            "  ui_text, difficulty, scene_graph_objects\n\n"
            "Required object shapes:\n"
            "- physics_rules: { gravity, max_speed, friction }\n"
            "- difficulty: { enemy_spawn_interval_ms, enemy_speed, score_per_enemy, target_score }\n"
            "- player: { speed, radius, color, health }\n"
            "- enemy_archetypes[]: { id, movement, speed, radius, color, count }\n"
            "- scene_graph_objects[]: { id, kind }\n\n"
            "Forbidden examples (do NOT use):\n"
            "- physics_rules.collision_type, physics_rules.description\n"
            "- difficulty.scaling_factor, difficulty.description\n"
            "- scene_graph_objects[].name"
        )

    def _generate_raw_code(self, prompt: str, plan: GamePlan, previous_code: str | None = None) -> str:
        plan_json = plan.model_dump_json(indent=2)
        mode_line = "MODIFY EXISTING CODE" if previous_code else "CREATE NEW CODE"
        previous_code_block = (
            self._truncate_context(previous_code, max_chars=getattr(self, "context_chars", 12000))
            if previous_code
            else "None"
        )
        prompt_text = (
            "Generate JavaScript scene module for a Phaser 2D game.\n"
            "Requirements:\n"
            "- Output only JavaScript code (no markdown).\n"
            "- Must define: function createGeneratedScene(Phaser, PLAN) { ... return class ... }\n"
            "- Use Phaser 3 API only.\n"
            "- Returned scene class must extend Phaser.Scene.\n"
            "- Do not create new Phaser.Game (runtime scaffold handles that).\n"
            "- Scene must rely on provided PLAN and Phaser only.\n"
            "- Offline only. Do not use network APIs (fetch/XMLHttpRequest/WebSocket/EventSource/importScripts).\n"
            "- Include mechanics, enemies, player behavior, and visual style from plan.\n"
            "- Use generated in-code visuals (graphics/shapes/procedural textures), no external assets.\n"
            "- Implement create()/update() methods in returned scene class.\n\n"
            "Performance and size constraints:\n"
            "- Keep implementation lightweight and browser-friendly.\n"
            "- Target stable 60fps on a typical laptop.\n"
            "- Keep active object count modest (prefer under ~120 objects).\n"
            "- Avoid heavy particle systems, shader effects, and large procedural texture loops.\n"
            "- Prefer simple geometry and pooled/reused objects where possible.\n"
            "- Keep generated source concise (prefer under ~600 lines).\n\n"
            f"Mode: {mode_line}\n"
            f"User prompt:\n{prompt}\n\n"
            f"Game plan JSON:\n{plan_json}\n\n"
            f"Previous code:\n{previous_code_block}\n"
        )
        return self._extract_javascript(self._call_model(prompt_text))

    def _repair_raw_code(
        self,
        prompt: str,
        plan: GamePlan,
        previous_code: str | None,
        invalid_code: str,
        errors: list[str],
    ) -> str:
        plan_json = plan.model_dump_json(indent=2)
        previous_code_block = previous_code if previous_code else "None"
        repair_prompt = (
            "Patch this JavaScript so it satisfies all errors. Return only JavaScript.\n\n"
            f"User prompt:\n{prompt}\n\n"
            f"Game plan JSON:\n{plan_json}\n\n"
            f"Previous code:\n{previous_code_block}\n\n"
            f"Invalid code:\n{invalid_code}\n\n"
            f"Errors:\n{json.dumps(errors, indent=2)}\n"
        )
        return self._extract_javascript(self._call_model(repair_prompt))

    def _validate_scene_module(self, code: str) -> list[str]:
        errors: list[str] = []
        forbidden_patterns = [
            r"\bfetch\s*\(",
            r"\bXMLHttpRequest\b",
            r"\bWebSocket\b",
            r"\bEventSource\b",
            r"\bimportScripts\b",
            r"\beval\s*\(",
            r"\bnew\s+Function\b",
            r"\bPhaser\.State\b",
            r"\bbitmapData\b",
            r"\baddBitmapData\b",
            r"\bPhaser\.Timer\.SECOND\b",
        ]
        for pattern in forbidden_patterns:
            if re.search(pattern, code):
                errors.append(f"forbidden:{pattern}")
        if "function createGeneratedScene" not in code:
            errors.append("missing:createGeneratedScene")
        if "extends Phaser.Scene" not in code:
            errors.append("missing:extends Phaser.Scene")
        if "return class" not in code and "class " not in code:
            errors.append("missing:scene_class")
        if "create(" not in code:
            errors.append("missing:create_method")
        if "update(" not in code:
            errors.append("missing:update_method")
        node_bin = shutil.which("node")
        if node_bin:
            wrapped = (
                "(function () {\n"
                f"{code}\n"
                "if (typeof createGeneratedScene !== 'function') {\n"
                "  throw new Error('createGeneratedScene missing');\n"
                "}\n"
                "})();\n"
            )
            with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as tmp:
                tmp.write(wrapped)
                tmp_path = tmp.name
            try:
                check = subprocess.run(
                    [node_bin, "--check", tmp_path],
                    capture_output=True,
                    text=True,
                )
                if check.returncode != 0:
                    detail = (check.stderr or check.stdout).strip()
                    errors.append(f"syntax:{detail}")
            finally:
                try:
                    os.remove(tmp_path)
                except OSError:
                    pass
        return errors

    def _call_model(self, prompt_text: str) -> str:
        payload = {
            "contents": [{"parts": [{"text": prompt_text}]}],
            "generationConfig": {
                "temperature": 0.25,
                "maxOutputTokens": getattr(self, "max_tokens", 8192),
            },
        }
        req = request.Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        last_error: Exception | None = None
        for attempt in range(self.http_retries + 1):
            try:
                with request.urlopen(req, timeout=self.timeout_seconds) as response:
                    data = json.loads(response.read().decode("utf-8"))
                break
            except error.HTTPError as exc:
                body = exc.read().decode("utf-8", errors="replace")
                # Retry only on transient server/rate-limit errors.
                if exc.code in {429, 500, 502, 503, 504} and attempt < self.http_retries:
                    time.sleep(0.8 * (2**attempt))
                    last_error = RuntimeError(f"Gemini API transient HTTP {exc.code}: {body}")
                    continue
                raise RuntimeError(f"Gemini API HTTP {exc.code}: {body}") from exc
            except (TimeoutError, socket.timeout) as exc:
                if attempt < self.http_retries:
                    time.sleep(0.8 * (2**attempt))
                    last_error = RuntimeError(
                        f"Gemini API timed out after {self.timeout_seconds}s (attempt {attempt + 1}/{self.http_retries + 1})"
                    )
                    continue
                raise RuntimeError(
                    f"Gemini API timed out after {self.timeout_seconds}s. "
                    "Increase GEMINI_TIMEOUT_SECONDS or reduce prompt complexity."
                ) from exc
            except error.URLError as exc:
                # URLError can wrap timeout-like transient failures.
                reason_text = str(exc.reason)
                timeout_like = "timed out" in reason_text.lower()
                if (timeout_like or attempt < self.http_retries) and attempt < self.http_retries:
                    time.sleep(0.8 * (2**attempt))
                    last_error = RuntimeError(f"Gemini API request failed (retrying): {reason_text}")
                    continue
                raise RuntimeError(f"Gemini API request failed: {exc}") from exc
        else:
            if last_error is not None:
                raise last_error
            raise RuntimeError("Gemini API request failed without details.")

        candidates = data.get("candidates")
        if not candidates:
            raise RuntimeError(f"Gemini API returned no candidates: {data}")
        parts = candidates[0].get("content", {}).get("parts", [])
        text_segments = [part.get("text", "") for part in parts if isinstance(part, dict)]
        text = "\n".join(segment for segment in text_segments if segment)
        if not text:
            raise RuntimeError(f"Gemini API returned empty text: {data}")
        return text

    @staticmethod
    def _truncate_context(value: str | None, max_chars: int) -> str:
        if not value:
            return ""
        if len(value) <= max_chars:
            return value
        head = value[: max_chars // 2]
        tail = value[-(max_chars // 2) :]
        return f"{head}\n/* CONTEXT TRUNCATED */\n{tail}"

    @staticmethod
    def _extract_json(text: str) -> str:
        stripped = text.strip()
        if stripped.startswith("```"):
            stripped = stripped.strip("`")
            if stripped.lower().startswith("json"):
                stripped = stripped[4:].strip()
        start = stripped.find("{")
        end = stripped.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise RuntimeError(f"Gemini output did not contain a JSON object: {text[:300]}")
        return stripped[start : end + 1]

    @staticmethod
    def _extract_javascript(text: str) -> str:
        stripped = text.strip()
        if stripped.startswith("```"):
            lines = stripped.splitlines()
            if lines:
                lines = lines[1:]
            while lines and lines[-1].strip().startswith("```"):
                lines = lines[:-1]
            stripped = "\n".join(lines).strip()
        return stripped


class FeatherlessPlanGenerator(GeminiPlanGenerator):
    def __init__(
        self,
        api_key: str,
        model: str,
        base_url: str = "https://api.featherless.ai/v1",
        max_tokens: int = 32768,
        context_window: int = 32768,
        context_chars: int = 200000,
        max_retries: int = 2,
        timeout_seconds: int = 90,
        http_retries: int = 2,
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.max_tokens = max_tokens
        self.context_window = context_window
        self.context_chars = context_chars
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds
        self.http_retries = http_retries
        self.endpoint = f"{self.base_url}/chat/completions"

    def _call_model(self, prompt_text: str) -> str:
        system_prompt = "You are an expert Phaser game generation assistant."
        prompt_text, output_tokens = self._fit_prompt_and_output_budget(system_prompt, prompt_text)

        client = OpenAI(
            base_url=self.base_url,
            api_key=self.api_key,
            timeout=self.timeout_seconds,
        )

        last_error: Exception | None = None
        for attempt in range(self.http_retries + 1):
            try:
                completion = client.chat.completions.create(
                    model=self.model,
                    max_tokens=output_tokens,
                    temperature=0.25,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": prompt_text},
                    ],
                )
                break
            except Exception as exc:  # noqa: BLE001
                status_code = getattr(exc, "status_code", None)
                body = str(exc)
                if status_code == 403:
                    raise RuntimeError(
                        "Featherless returned 403 (unauthorized for this model). "
                        "This typically means the model is gated and must be unlocked, "
                        "or it is not available on your current plan. "
                        f"Model: {self.model}. Response: {body}"
                    ) from exc
                if status_code in {429, 500, 502, 503, 504} and attempt < self.http_retries:
                    time.sleep(0.8 * (2**attempt))
                    last_error = RuntimeError(f"Featherless API transient HTTP {status_code}: {body}")
                    continue
                reason_text = body
                timeout_like = "timed out" in reason_text.lower()
                if (timeout_like or attempt < self.http_retries) and attempt < self.http_retries:
                    time.sleep(0.8 * (2**attempt))
                    last_error = RuntimeError(f"Featherless API request failed (retrying): {reason_text}")
                    continue
                raise RuntimeError(f"Featherless API request failed: {exc}") from exc
        else:
            if last_error is not None:
                raise last_error
            raise RuntimeError("Featherless API request failed without details.")

        choices = completion.choices
        if not choices:
            raise RuntimeError("Featherless API returned no choices.")
        content = choices[0].message.content
        if not content:
            raise RuntimeError("Featherless API returned empty content.")
        return str(content)

    @staticmethod
    def _estimate_tokens(text: str) -> int:
        # Fast approximation for budgeting that works across providers.
        return max(1, (len(text) + 3) // 4)

    def _fit_prompt_and_output_budget(self, system_prompt: str, prompt_text: str) -> tuple[str, int]:
        min_output_tokens = 512
        reserved_tokens = 128
        max_input_tokens = self.context_window - min_output_tokens - reserved_tokens

        if max_input_tokens <= 0:
            raise RuntimeError(
                "Invalid context window configuration. Increase FEATHERLESS_CONTEXT_WINDOW "
                "or reduce FEATHERLESS_MAX_TOKENS."
            )

        combined = f"{system_prompt}\n{prompt_text}"
        combined_tokens = self._estimate_tokens(combined)
        if combined_tokens > max_input_tokens:
            prompt_budget_chars = max(800, max_input_tokens * 4 - len(system_prompt) - 1)
            prompt_text = self._truncate_context(prompt_text, max_chars=prompt_budget_chars)
            combined = f"{system_prompt}\n{prompt_text}"
            combined_tokens = self._estimate_tokens(combined)

        available_output = self.context_window - combined_tokens - reserved_tokens
        if available_output < min_output_tokens:
            raise RuntimeError(
                "Prompt is too large for model context window after truncation. "
                "Reduce prompt size or FEATHERLESS_CONTEXT_CHARS."
            )

        return prompt_text, min(self.max_tokens, available_output)
