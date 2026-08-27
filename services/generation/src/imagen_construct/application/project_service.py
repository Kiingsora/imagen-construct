from datetime import datetime, timezone
from uuid import uuid4

from imagen_construct.domain.project import ProjectDocument
from imagen_construct.ports.project_repository import ProjectRepository


def _now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


class ProjectService:
    def __init__(self, repository: ProjectRepository) -> None:
        self._repository = repository

    def create_project(self, name: str, width: int = 1024, height: int = 1024) -> ProjectDocument:
        clean_name = name.strip()
        if not clean_name:
            raise ValueError("Project name cannot be empty.")
        if width < 64 or height < 64:
            raise ValueError("Canvas dimensions must be at least 64 pixels.")
        now = _now()
        project: ProjectDocument = {
            "formatVersion": "0.2.0",
            "id": str(uuid4()),
            "name": clean_name,
            "createdAt": now,
            "updatedAt": now,
            "canvas": {"width": width, "height": height, "backgroundColor": "#00000000"},
            "layers": [],
        }
        return self._repository.create(project)

    def get_project(self, project_id: str) -> ProjectDocument:
        return self._repository.get(project_id)

    def save_project(self, project_id: str, project: ProjectDocument) -> ProjectDocument:
        next_project = dict(project)
        next_project["updatedAt"] = _now()
        return self._repository.save(project_id, next_project)
