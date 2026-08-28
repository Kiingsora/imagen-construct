from functools import lru_cache

from imagen_construct.application.asset_service import AssetService
from imagen_construct.application.project_service import ProjectService
from imagen_construct.config import get_settings
from imagen_construct.infrastructure.assets.file_asset_store import FileAssetStore
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository


@lru_cache
def get_project_service() -> ProjectService:
    settings = get_settings()
    return ProjectService(FileProjectRepository(settings.workspace_dir))


@lru_cache
def get_asset_service() -> AssetService:
    settings = get_settings()
    return AssetService(FileAssetStore(settings.workspace_dir))
