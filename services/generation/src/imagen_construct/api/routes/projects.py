from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from imagen_construct.api.dependencies import get_project_service
from imagen_construct.application.project_service import ProjectService
from imagen_construct.domain.errors import ProjectNotFoundError, ProjectStorageError
from imagen_construct.domain.project import ProjectDocument

router = APIRouter(prefix="/v1/projects", tags=["projects"])
ProjectServiceDependency = Annotated[ProjectService, Depends(get_project_service)]


class CreateProjectRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=1, max_length=200)
    width: int = Field(default=1024, ge=64, le=16384)
    height: int = Field(default=1024, ge=64, le=16384)


@router.post("", status_code=status.HTTP_201_CREATED)
def create_project(
    request: CreateProjectRequest,
    service: ProjectServiceDependency,
) -> ProjectDocument:
    try:
        return service.create_project(request.name, request.width, request.height)
    except (ValueError, ProjectStorageError) as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.get("/{project_id}")
def get_project(
    project_id: str,
    service: ProjectServiceDependency,
) -> ProjectDocument:
    try:
        return service.get_project(project_id)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProjectStorageError as error:
        raise HTTPException(status_code=500, detail=str(error)) from error


@router.put("/{project_id}")
def save_project(
    project_id: str,
    project: ProjectDocument,
    service: ProjectServiceDependency,
) -> ProjectDocument:
    try:
        return service.save_project(project_id, project)
    except ProjectNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except ProjectStorageError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
