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
    featherless_api_key: str | None
    featherless_model: str
    featherless_base_url: str
    featherless_max_tokens: int
    featherless_context_chars: int
    featherless_max_retries: int
    featherless_timeout_seconds: int
    featherless_http_retries: int

    @classmethod
    def from_env(cls) -> Settings:
        _load_dotenv()
        featherless_key = os.getenv("FEATHERLESS_API_KEY")
        return cls(
            featherless_api_key=featherless_key,
            featherless_model=os.getenv("FEATHERLESS_MODEL", "Qwen/Qwen2.5-Coder-32B-Instruct"),
            featherless_base_url=os.getenv("FEATHERLESS_BASE_URL", "https://api.featherless.ai/v1"),
            featherless_max_tokens=int(os.getenv("FEATHERLESS_MAX_TOKENS", "32768")),
            featherless_context_chars=int(os.getenv("FEATHERLESS_CONTEXT_CHARS", "200000")),
            featherless_max_retries=int(os.getenv("FEATHERLESS_MAX_RETRIES", "2")),
            featherless_timeout_seconds=int(os.getenv("FEATHERLESS_TIMEOUT_SECONDS", "90")),
            featherless_http_retries=int(os.getenv("FEATHERLESS_HTTP_RETRIES", "2")),
        )
