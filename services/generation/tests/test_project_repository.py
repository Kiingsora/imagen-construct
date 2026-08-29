import json
from datetime import UTC, datetime
from pathlib import Path

import pytest

from imagen_construct.domain.errors import ProjectStorageError
from imagen_construct.domain.project import CanvasSettings, ProjectDocument
from imagen_construct.infrastructure.persistence.file_project_repository import (
    FileProjectRepository,
)


def project(project_id: str = "project-1") -> ProjectDocument:
    timestamp = datetime(2026, 8, 27, tzinfo=UTC)
    return ProjectDocument(
        id=project_id,
        name="Project",
        createdAt=timestamp,
        updatedAt=timestamp,
        canvas=CanvasSettings(
            width=1024,
            height=1024,
            backgroundColor="#00000000",
        ),
        layers=[],
    )


def test_create_and_read_project(tmp_path: Path) -> None:
    repository = FileProjectRepository(tmp_path)
    repository.create(project())
    assert repository.get("project-1").name == "Project"
    assert (tmp_path / "projects" / "project-1" / "assets").is_dir()


def test_project_id_cannot_escape_workspace(tmp_path: Path) -> None:
    with pytest.raises(ValueError):
        project("../escape")


def test_invalid_manifest_is_not_loaded(tmp_path: Path) -> None:
    repository = FileProjectRepository(tmp_path)
    repository.create(project())
    manifest = tmp_path / "projects" / "project-1" / "project.json"
    manifest.write_text(json.dumps({"formatVersion": "0.2.0"}), encoding="utf-8")

    with pytest.raises(ProjectStorageError):
        repository.get("project-1")
