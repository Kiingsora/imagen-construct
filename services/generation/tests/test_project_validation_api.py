from copy import deepcopy

from fastapi.testclient import TestClient

from imagen_construct.api.dependencies import get_project_service
from imagen_construct.application.project_service import ProjectService
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository
from imagen_construct.main import app


def client_for(tmp_path):
    service = ProjectService(FileProjectRepository(tmp_path))
    app.dependency_overrides[get_project_service] = lambda: service
    return TestClient(app)


def imported_layer(layer_id="layer-1"):
    return {
        "id": layer_id,
        "name": "Fixture",
        "kind": "imported",
        "visible": True,
        "locked": False,
        "opacity": 1,
        "blendMode": "normal",
        "transform": {"x": 0, "y": 0, "scaleX": 1, "scaleY": 1, "rotation": 0},
        "asset": {
            "path": "assets/fixture.png",
            "mediaType": "image/png",
            "width": 1,
            "height": 1,
            "hasAlpha": True,
        },
    }


def test_save_rejects_absolute_asset_paths(tmp_path):
    with client_for(tmp_path) as client:
        project = client.post("/v1/projects", json={"name": "Validation"}).json()
        layer = imported_layer()
        layer["asset"]["path"] = "C:/private/fixture.png"
        project["layers"] = [layer]

        response = client.put(f"/v1/projects/{project['id']}", json=project)

    app.dependency_overrides.clear()
    assert response.status_code == 422


def test_save_rejects_duplicate_layer_ids(tmp_path):
    with client_for(tmp_path) as client:
        project = client.post("/v1/projects", json={"name": "Validation"}).json()
        project["layers"] = [imported_layer(), deepcopy(imported_layer())]

        response = client.put(f"/v1/projects/{project['id']}", json=project)

    app.dependency_overrides.clear()
    assert response.status_code == 422


def test_save_accepts_valid_layer_document(tmp_path):
    with client_for(tmp_path) as client:
        project = client.post("/v1/projects", json={"name": "Validation"}).json()
        project["layers"] = [imported_layer()]

        response = client.put(f"/v1/projects/{project['id']}", json=project)

    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["layers"][0]["asset"]["path"] == "assets/fixture.png"
