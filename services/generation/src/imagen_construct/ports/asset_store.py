from pathlib import Path
from typing import Protocol, TypedDict


class StoredAsset(TypedDict):
    path: str
    mediaType: str
    width: int
    height: int
    checksumSha256: str
    hasAlpha: bool


class AssetStore(Protocol):
    max_upload_bytes: int

    def save_image(self, project_id: str, payload: bytes) -> StoredAsset: ...

    def resolve_asset(self, project_id: str, asset_name: str) -> Path: ...
