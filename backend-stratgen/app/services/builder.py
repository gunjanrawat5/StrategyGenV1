from __future__ import annotations

import json
from pathlib import Path
import re
import shutil

from app.models import GamePlan
from app.services.types import BuildArtifact

FORBIDDEN_PATTERNS = [
    r"\bfetch\s*\(",
    r"\bXMLHttpRequest\b",
    r"\bWebSocket\b",
    r"\bEventSource\b",
    r"\bimportScripts\b",
    r"\beval\s*\(",
    r"\bnew\s+Function\b",
]


def _slugify(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "-", value).strip("-").lower()
    return cleaned[:40] or "generated-game"


def _build_index_html(title: str) -> str:
    safe_title = title.replace("<", "").replace(">", "")
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{safe_title}</title>
  <style>
    html, body {{
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }}
    body {{
      background: #01030b;
      color: #d9faff;
      font-family: system-ui, sans-serif;
      overflow: hidden;
    }}
    #game-root {{
      width: 100%;
      height: 100%;
    }}
    #game-root canvas {{
      width: 100%;
      height: 100%;
      display: block;
    }}
  </style>
</head>
<body>
  <div id="game-root"></div>
  <script src="./phaser.min.js"></script>
  <script src="./game.js"></script>
</body>
</html>
"""


def _compose_game_js(plan: GamePlan, scene_module_js: str) -> str:
    plan_json = json.dumps(plan.model_dump())
    return (
        "(function () {\n"
        "  'use strict';\n"
        f"  const PLAN = {plan_json};\n"
        "  if (!window.Phaser) throw new Error('Phaser runtime was not loaded.');\n  const width = 960;\n  const height = 600;\n\n"
        "  function showRuntimeError(message) {\n"
        "    const root = document.getElementById('game-root');\n"
        "    if (!root) return;\n"
        "    const box = document.createElement('pre');\n"
        "    box.textContent = 'Runtime Error\\n' + String(message || 'Unknown error');\n"
        "    box.style.color = '#ffb3c1';\n"
        "    box.style.background = '#140812';\n"
        "    box.style.border = '1px solid #ff4d6d';\n"
        "    box.style.padding = '12px';\n"
        "    box.style.margin = '12px';\n"
        "    box.style.whiteSpace = 'pre-wrap';\n"
        "    root.innerHTML = '';\n"
        "    root.appendChild(box);\n"
        "  }\n"
        "  window.addEventListener('error', function (event) {\n"
        "    showRuntimeError(event && event.message ? event.message : event);\n"
        "  });\n\n"
        "  // BEGIN GENERATED_SCENE_MODULE\n"
        f"{scene_module_js}\n"
        "  // END GENERATED_SCENE_MODULE\n\n"
        "  if (typeof createGeneratedScene !== 'function') {\n"
        "    throw new Error('Generated module must define createGeneratedScene(Phaser, PLAN).');\n"
        "  }\n\n"
        "  const GeneratedScene = createGeneratedScene(Phaser, PLAN);\n"
        "  const config = {\n"
        "    type: Phaser.CANVAS,\n"
        "    width: 960,\n"
        "    height: 600,\n"
        "    parent: 'game-root',\n"
        "    backgroundColor: '#030915',\n"
        "    physics: {\n"
        "      default: 'arcade',\n"
        "      arcade: {\n"
        "        gravity: { y: Number(PLAN.physics_rules?.gravity || 0) },\n"
        "        debug: false,\n"
        "      },\n"
        "    },\n"
        "    scale: {\n"
        "      mode: Phaser.Scale.RESIZE,\n"
        "      autoCenter: Phaser.Scale.CENTER_BOTH,\n"
        "    },\n"
        "    fps: { target: 60, forceSetTimeOut: false },\n"
        "    scene: [GeneratedScene],\n"
        "  };\n\n"
        "  let phaser = null;\n"
        "  try {\n"
        "    phaser = new Phaser.Game(config);\n"
        "  } catch (error) {\n"
        "    showRuntimeError(error && error.message ? error.message : error);\n"
        "  }\n"
        "  window.__ggen_runtime__ = {\n"
        "    phaser,\n"
        "    dispose() {\n"
        "      if (this.phaser) {\n"
        "        this.phaser.destroy(true);\n"
        "        this.phaser = null;\n"
        "      }\n"
        "    },\n"
        "  };\n"
        "})();\n"
    )


def extract_scene_module_from_game_js(game_js: str) -> str | None:
    start_marker = "// BEGIN GENERATED_SCENE_MODULE"
    end_marker = "// END GENERATED_SCENE_MODULE"
    start = game_js.find(start_marker)
    end = game_js.find(end_marker)
    if start == -1 or end == -1 or end <= start:
        return None
    start += len(start_marker)
    return game_js[start:end].strip()


def validate_generated_js(js_source: str) -> list[str]:
    violations: list[str] = []
    for pattern in FORBIDDEN_PATTERNS:
        if re.search(pattern, js_source):
            violations.append(f"forbidden:{pattern}")
    if "new Phaser.Game" not in js_source:
        violations.append("missing:new Phaser.Game")
    if "game-root" not in js_source:
        violations.append("missing:game-root")
    if "window.__ggen_runtime__" not in js_source:
        violations.append("missing:window.__ggen_runtime__")
    if "dispose(" not in js_source:
        violations.append("missing:dispose")
    return violations


def _resolve_phaser_runtime(artifacts_root: Path) -> Path:
    resolved_root = artifacts_root.resolve()
    workspace_root = resolved_root.parent.parent
    candidates = [
        resolved_root.parent / "vendor" / "phaser.min.js",
        workspace_root / "ggen-frontend" / "node_modules" / "phaser" / "dist" / "phaser.min.js",
        workspace_root / "frontend-stratgen" / "node_modules" / "phaser" / "dist" / "phaser.min.js",
        workspace_root / "frontend-overlord" / "node_modules" / "phaser" / "dist" / "phaser.min.js",
        workspace_root / "frontend" / "node_modules" / "phaser" / "dist" / "phaser.min.js",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate

    raise FileNotFoundError(
        "Phaser runtime not found. Install it with `npm i phaser` in your frontend app "
        "(for example frontend-overlord, ggen-frontend, or frontend-stratgen), or place `phaser.min.js` "
        "at backend-stratgen/vendor/phaser.min.js."
    )


def build_game_artifact(job_id: str, plan: GamePlan, scene_module_js: str, artifacts_root: Path) -> BuildArtifact:
    game_dir = artifacts_root / "games" / job_id
    game_dir.mkdir(parents=True, exist_ok=True)

    game_js = _compose_game_js(plan, scene_module_js)
    violations = validate_generated_js(game_js)
    if violations:
        raise ValueError(f"Generated JS validation failed: {', '.join(violations)}")

    index_html = _build_index_html(plan.title)
    phaser_runtime_src = _resolve_phaser_runtime(artifacts_root)

    (game_dir / "index.html").write_text(index_html, encoding="utf-8")
    (game_dir / "game.js").write_text(game_js, encoding="utf-8")
    shutil.copyfile(phaser_runtime_src, game_dir / "phaser.min.js")
    (game_dir / "plan.json").write_text(plan.model_dump_json(indent=2), encoding="utf-8")

    slug = _slugify(plan.title)
    (game_dir / "metadata.json").write_text(
        json.dumps({"job_id": job_id, "slug": slug, "title": plan.title}, indent=2),
        encoding="utf-8",
    )

    return BuildArtifact(
        game_dir=game_dir,
        game_url=f"/games/{job_id}/index.html",
        plan=plan,
    )

