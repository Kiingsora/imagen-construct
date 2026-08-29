from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from imagen_construct.api.routes.assets import router as assets_router
from imagen_construct.api.routes.generation import create_generation_router
from imagen_construct.api.routes.health import router as health_router
from imagen_construct.api.routes.projects import router as projects_router
from imagen_construct.application.generation_service import GenerationService
from imagen_construct.config import get_settings
from imagen_construct.infrastructure.adapters.mock_adapter import MockGenerationAdapter
from imagen_construct.infrastructure.assets.file_asset_store import FileAssetStore
from imagen_construct.infrastructure.persistence.file_project_repository import FileProjectRepository

settings = get_settings()
project_repository = FileProjectRepository(settings.workspace_dir)
asset_store = FileAssetStore(settings.workspace_dir)
generation_service = GenerationService(
    project_repository=project_repository,
    asset_store=asset_store,
    adapters=[MockGenerationAdapter()],
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await generation_service.start()
    try:
        yield
    finally:
        await generation_service.stop()


app = FastAPI(
    title="Imagen Construct Local Service",
    version="0.2.0",
    lifespan=lifespan,
)
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
app.include_router(create_generation_router(generation_service))
app.state.generation_service = generation_service
