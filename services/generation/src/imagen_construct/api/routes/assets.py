from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from imagen_construct.api.dependencies import get_asset_service
from imagen_construct.application.asset_service import AssetService
from imagen_construct.domain.errors import ProjectNotFoundError, ProjectStorageError
from imagen_construct.ports.asset_store import StoredAsset

router = APIRouter(prefix="/v1/projects/{project_id}/assets", tags=["assets"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_asset(
    project_id: str,
    file: Annotated[UploadFile, File()],
    service: AssetService = Depends(get_asset_service),
) -> StoredAsset:
    try:
        payload = await file.read(service.max_upload_bytes + 1)
        if len(payload) > service.max_upload_bytes:
            raise ProjectStorageError("Uploaded image exceeds the 32 MB limit.")
        return service.upload_image(project_id, payload)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProjectStorageError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
    finally:
        await file.close()


@router.get("/{asset_name}")
def get_asset(
    project_id: str,
    asset_name: str,
    service: AssetService = Depends(get_asset_service),
) -> FileResponse:
    try:
        path = service.resolve_asset(project_id, asset_name)
        media_type = "image/webp" if path.suffix.lower() == ".webp" else "image/png"
        return FileResponse(path, media_type=media_type, filename=path.name)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProjectStorageError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
