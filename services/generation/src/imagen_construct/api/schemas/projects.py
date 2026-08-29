from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)


class CanvasSettings(StrictModel):
    width: int = Field(ge=64, le=16384)
    height: int = Field(ge=64, le=16384)
    background_color: str = Field(
        alias="backgroundColor",
        pattern=r"^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$",
    )


class LayerTransform(StrictModel):
    x: float
    y: float
    scale_x: float = Field(alias="scaleX", gt=0)
    scale_y: float = Field(alias="scaleY", gt=0)
    rotation: float


class AssetReference(StrictModel):
    path: str = Field(pattern=r"^assets/[A-Za-z0-9][A-Za-z0-9._-]{0,255}\.(png|webp)$")
    media_type: Literal["image/png", "image/webp"] = Field(alias="mediaType")
    width: int = Field(ge=1, le=16384)
    height: int = Field(ge=1, le=16384)
    checksum_sha256: str | None = Field(
        default=None,
        alias="checksumSha256",
        pattern=r"^[0-9A-Fa-f]{64}$",
    )
    has_alpha: bool = Field(default=True, alias="hasAlpha")


class GenerationPrompt(StrictModel):
    positive: str | None = None
    negative: str | None = None


class GenerationMetadata(StrictModel):
    adapter_id: str | None = Field(default=None, alias="adapterId")
    model_id: str | None = Field(default=None, alias="modelId")
    workflow_id: str | None = Field(default=None, alias="workflowId")
    seed: int | None = Field(default=None, ge=0)
    prompt: GenerationPrompt | None = None
    generated_at: datetime | None = Field(default=None, alias="generatedAt")
    source_job_id: str | None = Field(default=None, alias="sourceJobId")


class LayerDocument(StrictModel):
    id: str = Field(min_length=1, max_length=200)
    name: str = Field(min_length=1, max_length=200)
    kind: Literal["background", "generated", "imported"]
    visible: bool
    locked: bool
    opacity: float = Field(ge=0, le=1)
    blend_mode: Literal["normal"] = Field(default="normal", alias="blendMode")
    transform: LayerTransform
    asset: AssetReference
    generation: GenerationMetadata | None = None


class GenerationDefaults(StrictModel):
    adapter_id: str | None = Field(default=None, alias="adapterId")
    model_id: str | None = Field(default=None, alias="modelId")
    preview_width: int | None = Field(default=None, alias="previewWidth", ge=64, le=16384)
    preview_height: int | None = Field(default=None, alias="previewHeight", ge=64, le=16384)


class ProjectDocumentRequest(StrictModel):
    format_version: Literal["0.2.0"] = Field(alias="formatVersion")
    id: str = Field(
        min_length=1,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$",
    )
    name: str = Field(min_length=1, max_length=200)
    created_at: datetime = Field(alias="createdAt")
    updated_at: datetime = Field(alias="updatedAt")
    canvas: CanvasSettings
    layers: list[LayerDocument]
    generation_defaults: GenerationDefaults | None = Field(default=None, alias="generationDefaults")

    @model_validator(mode="after")
    def validate_unique_layer_ids(self) -> "ProjectDocumentRequest":
        layer_ids = [layer.id for layer in self.layers]
        if len(layer_ids) != len(set(layer_ids)):
            raise ValueError("Layer ids must be unique within a project.")
        return self

    def to_document(self) -> dict[str, object]:
        return self.model_dump(mode="json", by_alias=True, exclude_none=True)
