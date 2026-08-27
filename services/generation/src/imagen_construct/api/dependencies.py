from functools import lru_cache

from imagen_construct.application.project_service import ProjectService
from imagen_construct.config import get_settings
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository


@lru_cache
def get_project_service() -> ProjectService:
    settings = get_settings()
    return ProjectService(FileProjectRepository(settings.workspace_dir))
