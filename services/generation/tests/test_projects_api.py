from pathlib import Path

from fastapi.testclient import TestClient

from imagen_construct.api.dependencies import get_project_service
from imagen_construct.application.project_service import ProjectService
from imagen_construct.infrastructure.persistence.file_project_repository import (
    FileProjectRepository,
)
from imagen_construct.main import app


def _client(tmp_path: Path) -> TestClient:
    service = ProjectService(FileProjectRepository(tmp_path))
    app.dependency_overrides[get_project_service] = lambda: service
    return TestClient(app)


def test_project_round_trip(tmp_path: Path) -> None:
    client = _client(tmp_path)
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


def test_rejects_project_id_change(tmp_path: Path) -> None:
    client = _client(tmp_path)
    try:
        project = client.post("/v1/projects", json={"name": "First project"}).json()
        project["id"] = "another-project"
        response = client.put("/v1/projects/original-project", json=project)
        assert response.status_code == 400
    finally:
        app.dependency_overrides.clear()


def test_rejects_duplicate_layer_ids(tmp_path: Path) -> None:
    client = _client(tmp_path)
    try:
        project = client.post("/v1/projects", json={"name": "First project"}).json()
        layer = {
            "id": "layer-1",
            "name": "Layer",
            "kind": "imported",
            "visible": True,
            "locked": False,
            "opacity": 1,
            "transform": {"x": 0, "y": 0, "scaleX": 1, "scaleY": 1, "rotation": 0},
            "asset": {
                "path": "assets/example.png",
                "mediaType": "image/png",
                "width": 100,
                "height": 100,
            },
        }
        project["layers"] = [layer, layer]

        response = client.put(f"/v1/projects/{project['id']}", json=project)
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_rejects_asset_path_traversal(tmp_path: Path) -> None:
    client = _client(tmp_path)
    try:
        project = client.post("/v1/projects", json={"name": "First project"}).json()
        project["layers"] = [
            {
                "id": "layer-1",
                "name": "Layer",
                "kind": "imported",
                "visible": True,
                "locked": False,
                "opacity": 1,
                "transform": {"x": 0, "y": 0, "scaleX": 1, "scaleY": 1, "rotation": 0},
                "asset": {
                    "path": "assets/../outside.png",
                    "mediaType": "image/png",
                    "width": 100,
                    "height": 100,
                },
            }
        ]

        response = client.put(f"/v1/projects/{project['id']}", json=project)
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()


def test_rejects_unknown_project_fields(tmp_path: Path) -> None:
    client = _client(tmp_path)
    try:
        project = client.post("/v1/projects", json={"name": "First project"}).json()
        project["unexpected"] = True
        response = client.put(f"/v1/projects/{project['id']}", json=project)
        assert response.status_code == 422
    finally:
        app.dependency_overrides.clear()
