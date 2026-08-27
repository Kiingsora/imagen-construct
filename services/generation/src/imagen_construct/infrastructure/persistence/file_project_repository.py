import json
import os
import re
import tempfile
from pathlib import Path

from imagen_construct.domain.errors import ProjectNotFoundError, ProjectStorageError
from imagen_construct.domain.project import ProjectDocument

_PROJECT_ID = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$")


class FileProjectRepository:
    def __init__(self, workspace_dir: Path) -> None:
        self._projects_dir = workspace_dir.resolve() / "projects"
        self._projects_dir.mkdir(parents=True, exist_ok=True)

    def _project_dir(self, project_id: str) -> Path:
        if not _PROJECT_ID.fullmatch(project_id):
            raise ProjectStorageError("Project id contains unsupported characters.")
        return self._projects_dir / project_id

    def _manifest_path(self, project_id: str) -> Path:
        return self._project_dir(project_id) / "project.json"

    def create(self, project: ProjectDocument) -> ProjectDocument:
        project_id = str(project.get("id", ""))
        manifest = self._manifest_path(project_id)
        if manifest.exists():
            raise ProjectStorageError(f"Project '{project_id}' already exists.")
        manifest.parent.mkdir(parents=True, exist_ok=False)
        (manifest.parent / "assets").mkdir()
        (manifest.parent / "previews").mkdir()
        (manifest.parent / "tmp").mkdir()
        return self._write_atomic(manifest, project)

    def get(self, project_id: str) -> ProjectDocument:
        manifest = self._manifest_path(project_id)
        if not manifest.is_file():
            raise ProjectNotFoundError(project_id)
        try:
            data = json.loads(manifest.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as error:
            raise ProjectStorageError(f"Unable to read project '{project_id}'.") from error
        if not isinstance(data, dict):
            raise ProjectStorageError("Project manifest root must be an object.")
        return data

    def save(self, project_id: str, project: ProjectDocument) -> ProjectDocument:
        manifest = self._manifest_path(project_id)
        if not manifest.is_file():
            raise ProjectNotFoundError(project_id)
        if project.get("id") != project_id:
            raise ProjectStorageError("Project id cannot change during save.")
        return self._write_atomic(manifest, project)

    def _write_atomic(self, manifest: Path, project: ProjectDocument) -> ProjectDocument:
        payload = json.dumps(project, indent=2, ensure_ascii=False) + "\n"
        temporary_path: Path | None = None
        try:
            with tempfile.NamedTemporaryFile(
                mode="w",
                encoding="utf-8",
                dir=manifest.parent,
                prefix="project-",
                suffix=".tmp",
                delete=False,
            ) as temporary:
                temporary.write(payload)
                temporary.flush()
                os.fsync(temporary.fileno())
                temporary_path = Path(temporary.name)
            os.replace(temporary_path, manifest)
        except OSError as error:
            if temporary_path is not None:
                temporary_path.unlink(missing_ok=True)
            raise ProjectStorageError("Unable to persist project manifest.") from error
        return project
