from pathlib import Path

from fastapi.testclient import TestClient

from imagen_construct.api.dependencies import get_project_service
from imagen_construct.application.project_service import ProjectService
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository
from imagen_construct.main import app


def test_project_round_trip(tmp_path: Path) -> None:
    service = ProjectService(FileProjectRepository(tmp_path))
    app.dependency_overrides[get_project_service] = lambda: service
    client = TestClient(app)
    try:
        created = client.post("/v1/projects", json={"name": "First project"})
        assert created.status_code == 201
        project = created.json()
        project["name"] = "Renamed"

        saved = client.put(f"/v1/projects/{project['id']}", json=project)
        assert saved.status_code == 200

        loaded = client.get(f"/v1/projects/{project['id']}")
        assert loaded.status_code == 200
        assert loaded.json()["name"] == "Renamed"
    finally:
        app.dependency_overrides.clear()
