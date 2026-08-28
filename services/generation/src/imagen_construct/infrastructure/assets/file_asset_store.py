import hashlib
import os
import re
import tempfile
from io import BytesIO
from pathlib import Path
from uuid import uuid4

from PIL import Image, UnidentifiedImageError

from imagen_construct.domain.errors import ProjectNotFoundError, ProjectStorageError
from imagen_construct.ports.asset_store import StoredAsset

_PROJECT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")
_ASSET_NAME = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$")
_SUPPORTED_FORMATS = {
    "PNG": ("png", "image/png"),
    "WEBP": ("webp", "image/webp"),
}


class FileAssetStore:
    max_upload_bytes = 32 * 1024 * 1024
    max_pixels = 64 * 1024 * 1024

    def __init__(self, workspace_dir: Path) -> None:
        self._projects_dir = workspace_dir.resolve() / "projects"

    def _project_dir(self, project_id: str) -> Path:
        if not _PROJECT_ID.fullmatch(project_id):
            raise ProjectStorageError("Project id contains unsupported characters.")
        project_dir = self._projects_dir / project_id
        if not (project_dir / "project.json").is_file():
            raise ProjectNotFoundError(project_id)
        return project_dir

    def save_image(self, project_id: str, payload: bytes) -> StoredAsset:
        if not payload:
            raise ProjectStorageError("Uploaded image is empty.")
        if len(payload) > self.max_upload_bytes:
            raise ProjectStorageError("Uploaded image exceeds the 32 MB limit.")

        try:
            with Image.open(BytesIO(payload)) as image:
                image.load()
                image_format = image.format or ""
                if image_format not in _SUPPORTED_FORMATS:
                    raise ProjectStorageError("Only PNG and WebP images are supported.")
                width, height = image.size
                if width < 1 or height < 1 or width * height > self.max_pixels:
                    raise ProjectStorageError("Image dimensions exceed the supported limit.")
                has_alpha = image.mode in {"RGBA", "LA"} or "transparency" in image.info
        except (UnidentifiedImageError, OSError) as error:
            raise ProjectStorageError("Uploaded file is not a valid image.") from error

        extension, media_type = _SUPPORTED_FORMATS[image_format]
        asset_name = f"{uuid4().hex}.{extension}"
        assets_dir = self._project_dir(project_id) / "assets"
        assets_dir.mkdir(parents=True, exist_ok=True)
        destination = assets_dir / asset_name
        temporary_path: Path | None = None

        try:
            with tempfile.NamedTemporaryFile(
                mode="wb",
                dir=assets_dir,
                prefix="asset-",
                suffix=".tmp",
                delete=False,
            ) as temporary:
                temporary.write(payload)
                temporary.flush()
                os.fsync(temporary.fileno())
                temporary_path = Path(temporary.name)
            os.replace(temporary_path, destination)
        except OSError as error:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            raise ProjectStorageError("Unable to persist uploaded image.") from error

        return {
            "path": f"assets/{asset_name}",
            "mediaType": media_type,
            "width": width,
            "height": height,
            "checksumSha256": hashlib.sha256(payload).hexdigest(),
            "hasAlpha": has_alpha,
        }

    def resolve_asset(self, project_id: str, asset_name: str) -> Path:
        if not _ASSET_NAME.fullmatch(asset_name):
            raise ProjectStorageError("Asset name contains unsupported characters.")
        asset_path = (self._project_dir(project_id) / "assets" / asset_name).resolve()
        assets_dir = (self._project_dir(project_id) / "assets").resolve()
        if asset_path.parent != assets_dir or not asset_path.is_file():
            raise ProjectNotFoundError(asset_name)
        return asset_path
