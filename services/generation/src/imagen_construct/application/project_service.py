from datetime import UTC, datetime
from uuid import uuid4

from imagen_construct.domain.errors import ProjectStorageError
from imagen_construct.domain.project import CanvasSettings, ProjectDocument
from imagen_construct.ports.project_repository import ProjectRepository


def _now() -> datetime:
    return datetime.now(UTC)


class ProjectService:
    def __init__(self, repository: ProjectRepository) -> None:
        self._repository = repository

    def create_project(
        self,
        name: str,
        width: int = 1024,
        height: int = 1024,
    ) -> ProjectDocument:
        project = ProjectDocument(
            id=str(uuid4()),
            name=name,
            createdAt=_now(),
            updatedAt=_now(),
            canvas=CanvasSettings(
                width=width,
                height=height,
                backgroundColor="#00000000",
            ),
            layers=[],
        )
        return self._repository.create(project)

    def get_project(self, project_id: str) -> ProjectDocument:
        return self._repository.get(project_id)

    def save_project(self, project_id: str, project: ProjectDocument) -> ProjectDocument:
        if project.id != project_id:
            raise ProjectStorageError("Project id cannot change during save.")
        next_project = project.model_copy(update={"updatedAt": _now()})
        return self._repository.save(project_id, next_project)
