from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel, ConfigDict, Field

from imagen_construct.application.generation_service import (
    GenerationJobNotFoundError,
    GenerationService,
)
from imagen_construct.domain.errors import ProjectNotFoundError


class GenerateLayerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    project_id: str = Field(alias="projectId", min_length=1, max_length=128)
    prompt: str = Field(min_length=1, max_length=4000)
    adapter_id: str = Field(default="mock-rgba", alias="adapterId")
    width: int = Field(default=512, ge=64, le=2048)
    height: int = Field(default=512, ge=64, le=2048)
    seed: int | None = Field(default=None, ge=0, le=2**32 - 1)
    replace_layer_id: str | None = Field(default=None, alias="replaceLayerId")


def create_generation_router(service: GenerationService) -> APIRouter:
    router = APIRouter(tags=["generation"])

    @router.get("/v1/adapters")
    def list_adapters() -> list[dict[str, object]]:
        return service.adapters()

    @router.get("/v1/adapters/{adapter_id}")
    def get_adapter(adapter_id: str) -> dict[str, object]:
        try:
            return service.adapter(adapter_id)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @router.post("/v1/jobs/generate-layer", status_code=status.HTTP_202_ACCEPTED)
    async def generate_layer(request: GenerateLayerRequest) -> dict[str, object]:
        try:
            return await service.submit(
                project_id=request.project_id,
                prompt=request.prompt,
                adapter_id=request.adapter_id,
                width=request.width,
                height=request.height,
                seed=request.seed,
                replace_layer_id=request.replace_layer_id,
            )
        except ProjectNotFoundError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        except KeyError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error
        except ValueError as error:
            raise HTTPException(status_code=422, detail=str(error)) from error

    @router.get("/v1/jobs/{job_id}")
    def get_job(job_id: str) -> dict[str, object]:
        try:
            return service.get(job_id)
        except GenerationJobNotFoundError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @router.post("/v1/jobs/{job_id}/cancel")
    def cancel_job(job_id: str) -> dict[str, object]:
        try:
            return service.cancel(job_id)
        except GenerationJobNotFoundError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error

    @router.websocket("/v1/events")
    async def generation_events(websocket: WebSocket) -> None:
        await websocket.accept()
        subscription = service.subscribe()
        try:
            while True:
                await websocket.send_json(await subscription.get())
        except WebSocketDisconnect:
            pass
        finally:
            service.unsubscribe(subscription)

    return router
