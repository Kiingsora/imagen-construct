import re
from datetime import datetime
from pathlib import PurePosixPath
from typing import Literal, Self

from pydantic import BaseModel, ConfigDict, Field, FiniteFloat, field_validator, model_validator

PROJECT_FORMAT_VERSION = "0.2.0"
_PROJECT_ID_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$"
_CHECKSUM_PATTERN = r"^[0-9A-Fa-f]{64}$"
_COLOR_PATTERN = r"^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$"
_ASSET_NAME_PATTERN = r"^[A-Za-z0-9][A-Za-z0-9._-]{0,255}$"


class DomainModel(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True)


class CanvasSettings(DomainModel):
    width: int = Field(ge=64, le=16384)
    height: int = Field(ge=64, le=16384)
    backgroundColor: str = Field(pattern=_COLOR_PATTERN)


class LayerTransform(DomainModel):
    x: FiniteFloat
    y: FiniteFloat
    scaleX: FiniteFloat = Field(gt=0)
    scaleY: FiniteFloat = Field(gt=0)
    rotation: FiniteFloat


class AssetReference(DomainModel):
    path: str = Field(min_length=8, max_length=263)
    mediaType: Literal["image/png", "image/webp"]
    width: int = Field(ge=1, le=32768)
    height: int = Field(ge=1, le=32768)
    checksumSha256: str | None = Field(default=None, pattern=_CHECKSUM_PATTERN)
    hasAlpha: bool = True

    @field_validator("path")
    @classmethod
    def validate_project_relative_asset_path(cls, value: str) -> str:
        if "\\" in value:
            raise ValueError("Asset paths must use forward slashes.")
        path = PurePosixPath(value)
        if path.is_absolute() or path.parts[:1] != ("assets",) or len(path.parts) != 2:
            raise ValueError("Asset paths must use the form 'assets/<file-name>'.")
        asset_name = path.parts[1]
        if asset_name in {"", ".", ".."}:
            raise ValueError("Asset path contains an invalid file name.")
        if re.fullmatch(_ASSET_NAME_PATTERN, asset_name) is None:
            raise ValueError("Asset path contains unsupported characters.")
        return value


class GenerationPrompt(DomainModel):
    positive: str | None = Field(default=None, max_length=20000)
    negative: str | None = Field(default=None, max_length=20000)


class GenerationMetadata(DomainModel):
    adapterId: str | None = Field(default=None, min_length=1, max_length=200)
    modelId: str | None = Field(default=None, min_length=1, max_length=500)
    workflowId: str | None = Field(default=None, min_length=1, max_length=500)
    seed: int | None = Field(default=None, ge=0)
    prompt: GenerationPrompt | None = None
    generatedAt: datetime | None = None
    sourceJobId: str | None = Field(default=None, min_length=1, max_length=200)


class Layer(DomainModel):
    id: str = Field(min_length=1, max_length=200)
    name: str = Field(min_length=1, max_length=200)
    kind: Literal["background", "generated", "imported"]
    visible: bool
    locked: bool
    opacity: FiniteFloat = Field(ge=0, le=1)
    blendMode: Literal["normal"] = "normal"
    transform: LayerTransform
    asset: AssetReference
    generation: GenerationMetadata | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Layer name cannot be empty.")
        return normalized


class GenerationDefaults(DomainModel):
    adapterId: str | None = Field(default=None, min_length=1, max_length=200)
    modelId: str | None = Field(default=None, min_length=1, max_length=500)
    previewWidth: int | None = Field(default=None, ge=64, le=4096)
    previewHeight: int | None = Field(default=None, ge=64, le=4096)


class ProjectDocument(DomainModel):
    formatVersion: Literal["0.2.0"] = PROJECT_FORMAT_VERSION
    id: str = Field(pattern=_PROJECT_ID_PATTERN)
    name: str = Field(min_length=1, max_length=200)
    createdAt: datetime
    updatedAt: datetime
    canvas: CanvasSettings
    layers: list[Layer]
    generationDefaults: GenerationDefaults | None = None

    @field_validator("name")
    @classmethod
    def normalize_name(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("Project name cannot be empty.")
        return normalized

    @model_validator(mode="after")
    def validate_unique_layer_ids(self) -> Self:
        layer_ids = [layer.id for layer in self.layers]
        if len(layer_ids) != len(set(layer_ids)):
            raise ValueError("Layer ids must be unique within a project.")
        return self
