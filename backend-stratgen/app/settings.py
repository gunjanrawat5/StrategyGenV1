from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _load_dotenv() -> None:
    candidates = [
        Path(__file__).resolve().parent.parent / ".env",
        Path(__file__).resolve().parent.parent.parent / ".env",
    ]
    for dotenv_path in candidates:
        if not dotenv_path.exists():
            continue
        for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            if line.startswith("export "):
                line = line[len("export ") :].strip()
            if "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


@dataclass(slots=True)
class Settings:
    gemini_api_key: str | None
    gemini_model: str
    gemini_max_retries: int
    gemini_timeout_seconds: int
    gemini_http_retries: int

    @classmethod
    def from_env(cls) -> Settings:
        _load_dotenv()
        gemini_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        return cls(
            gemini_api_key=gemini_key,
            gemini_model=os.getenv("GEMINI_MODEL", "gemini-2.0-flash"),
            gemini_max_retries=int(os.getenv("GEMINI_MAX_RETRIES", "2")),
            gemini_timeout_seconds=int(os.getenv("GEMINI_TIMEOUT_SECONDS", "90")),
            gemini_http_retries=int(os.getenv("GEMINI_HTTP_RETRIES", "2")),
        )
