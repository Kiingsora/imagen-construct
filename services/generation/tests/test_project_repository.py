from pathlib import Path

import pytest

from imagen_construct.domain.errors import ProjectStorageError
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository


def project(project_id: str = "project-1") -> dict:
    return {
        "formatVersion": "0.2.0",
        "id": project_id,
        "name": "Project",
        "createdAt": "2026-08-27T00:00:00Z",
        "updatedAt": "2026-08-27T00:00:00Z",
        "canvas": {"width": 1024, "height": 1024, "backgroundColor": "#00000000"},
        "layers": [],
    }


def test_create_and_read_project(tmp_path: Path) -> None:
    repository = FileProjectRepository(tmp_path)
    repository.create(project())
    assert repository.get("project-1")["name"] == "Project"
    assert (tmp_path / "projects" / "project-1" / "assets").is_dir()


def test_project_id_cannot_escape_workspace(tmp_path: Path) -> None:
    repository = FileProjectRepository(tmp_path)
    with pytest.raises(ProjectStorageError):
        repository.create(project("../escape"))
