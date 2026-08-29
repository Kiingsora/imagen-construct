from io import BytesIO
from pathlib import Path

import pytest
from PIL import Image

from imagen_construct.application.project_service import ProjectService
from imagen_construct.domain.errors import ProjectStorageError
from imagen_construct.infrastructure.assets.file_asset_store import FileAssetStore
from imagen_construct.infrastructure.persistence.file_project_repository import (
    FileProjectRepository,
)


def _png_payload(width: int = 32, height: int = 24) -> bytes:
    buffer = BytesIO()
    Image.new("RGBA", (width, height), (80, 120, 200, 128)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_rejects_image_over_pixel_limit(tmp_path: Path) -> None:
    ProjectService(FileProjectRepository(tmp_path)).create_project("Asset project")
    store = FileAssetStore(tmp_path)
    store.max_pixels = 100

    with pytest.raises(ProjectStorageError, match="dimensions"):
        store.save_image(next((tmp_path / "projects").iterdir()).name, _png_payload())


def test_stores_valid_image_atomically(tmp_path: Path) -> None:
    project = ProjectService(FileProjectRepository(tmp_path)).create_project("Asset project")
    store = FileAssetStore(tmp_path)

    asset = store.save_image(project.id, _png_payload())

    assert asset["path"].startswith("assets/")
    assert asset["width"] == 32
    assert asset["height"] == 24
    assert len(asset["checksumSha256"]) == 64
    assert not list((tmp_path / "projects" / project.id / "assets").glob("*.tmp"))
