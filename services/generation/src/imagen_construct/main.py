from fastapi import FastAPI

app = FastAPI(title="Imagen Construct Generation Service", version="0.0.0")


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "imagen-construct-generation"}
