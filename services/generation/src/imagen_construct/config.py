import os
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    workspace_dir: Path
    host: str = "127.0.0.1"
    port: int = 8000


def get_settings() -> Settings:
    workspace = os.environ.get("IMAGEN_WORKSPACE_DIR", "workspace")
    return Settings(workspace_dir=Path(workspace).expanduser())
