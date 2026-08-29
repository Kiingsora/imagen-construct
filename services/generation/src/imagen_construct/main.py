from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from imagen_construct.api.routes.assets import router as assets_router
from imagen_construct.api.routes.health import router as health_router
from imagen_construct.api.routes.projects import router as projects_router

app = FastAPI(title="Imagen Construct Generation Service", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)
app.include_router(health_router)
app.include_router(projects_router)
app.include_router(assets_router)
