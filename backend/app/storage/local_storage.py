import os
from pathlib import Path
from app.storage.base import StorageService
from app.core.config import settings

class LocalStorageService(StorageService):
    def __init__(self, base_path: str = None):
        self.base_path = Path(base_path or settings.LOCAL_STORAGE_PATH)
        self.base_path.mkdir(parents=True, exist_ok=True)

    def _get_full_path(self, key: str) -> Path:
        # Prevent directory traversal attacks
        clean_key = key.lstrip("/\\")
        full_path = (self.base_path / clean_key).resolve()
        if not str(full_path).startswith(str(self.base_path.resolve())):
            raise ValueError("Invalid storage key path")
        return full_path

    def generate_presigned_upload_url(self, key: str, content_type: str, expires_in: int = 900) -> str:
        # In local mode, route through the local storage mock endpoint
        return f"{settings.API_V1_STR}/storage/upload?key={key}"

    def generate_presigned_download_url(self, key: str, expires_in: int = 3600) -> str:
        return f"{settings.API_V1_STR}/storage/files/{key}"

    def delete_object(self, key: str) -> bool:
        try:
            path = self._get_full_path(key)
            if path.exists() and path.is_file():
                path.unlink()
                return True
            return False
        except Exception:
            return False

    def object_exists(self, key: str) -> bool:
        try:
            return self._get_full_path(key).exists()
        except Exception:
            return False

    def save_file_data(self, key: str, data: bytes) -> str:
        path = self._get_full_path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        with open(path, "wb") as f:
            f.write(data)
        return str(path)

    def read_file_data(self, key: str) -> bytes:
        path = self._get_full_path(key)
        if not path.exists():
            raise FileNotFoundError(f"Storage file not found: {key}")
        with open(path, "rb") as f:
            return f.read()
