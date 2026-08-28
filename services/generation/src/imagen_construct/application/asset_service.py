from pathlib import Path

from imagen_construct.ports.asset_store import AssetStore, StoredAsset


class AssetService:
    def __init__(self, store: AssetStore) -> None:
        self._store = store

    @property
    def max_upload_bytes(self) -> int:
        return self._store.max_upload_bytes

    def upload_image(self, project_id: str, payload: bytes) -> StoredAsset:
        return self._store.save_image(project_id, payload)

    def resolve_asset(self, project_id: str, asset_name: str) -> Path:
        return self._store.resolve_asset(project_id, asset_name)
