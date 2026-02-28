import os
from pathlib import Path


class Settings:
    api_host: str = os.getenv("API_HOST", "127.0.0.1")
    api_port: int = int(os.getenv("API_PORT", "8000"))
    artifacts_dir: Path = Path(os.getenv("ARTIFACTS_DIR", "artifacts"))


settings = Settings()
