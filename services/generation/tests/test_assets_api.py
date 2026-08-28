from io import BytesIO
from pathlib import Path

from fastapi.testclient import TestClient
from PIL import Image

from imagen_construct.api.dependencies import get_asset_service, get_project_service
from imagen_construct.application.asset_service import AssetService
from imagen_construct.application.project_service import ProjectService
from imagen_construct.infrastructure.assets.file_asset_store import FileAssetStore
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository
from imagen_construct.main import app


def _png_payload() -> bytes:
    buffer = BytesIO()
    Image.new("RGBA", (32, 24), (80, 120, 200, 128)).save(buffer, format="PNG")
    return buffer.getvalue()


def test_upload_and_read_asset(tmp_path: Path) -> None:
    project_service = ProjectService(FileProjectRepository(tmp_path))
    asset_service = AssetService(FileAssetStore(tmp_path))
    app.dependency_overrides[get_project_service] = lambda: project_service
    app.dependency_overrides[get_asset_service] = lambda: asset_service
    client = TestClient(app)
    try:
        project = client.post("/v1/projects", json={"name": "Asset project"}).json()
        uploaded = client.post(
            f"/v1/projects/{project['id']}/assets",
            files={"file": ("fixture.png", _png_payload(), "image/png")},
        )
        assert uploaded.status_code == 201
        asset = uploaded.json()
        assert asset["width"] == 32
        assert asset["height"] == 24
        assert asset["mediaType"] == "image/png"
        assert asset["hasAlpha"] is True

        asset_name = asset["path"].split("/")[-1]
        downloaded = client.get(f"/v1/projects/{project['id']}/assets/{asset_name}")
        assert downloaded.status_code == 200
        assert downloaded.content == _png_payload()
    finally:
        app.dependency_overrides.clear()


def test_rejects_non_image_upload(tmp_path: Path) -> None:
    project_service = ProjectService(FileProjectRepository(tmp_path))
    asset_service = AssetService(FileAssetStore(tmp_path))
    app.dependency_overrides[get_project_service] = lambda: project_service
    app.dependency_overrides[get_asset_service] = lambda: asset_service
    client = TestClient(app)
    try:
        project = client.post("/v1/projects", json={"name": "Asset project"}).json()
        response = client.post(
            f"/v1/projects/{project['id']}/assets",
            files={"file": ("not-an-image.txt", b"not an image", "text/plain")},
        )
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()
