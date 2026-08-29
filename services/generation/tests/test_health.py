from fastapi.testclient import TestClient

from imagen_construct.main import app


def test_health() -> None:
    response = TestClient(app).get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "imagen-construct-generation",
    }
