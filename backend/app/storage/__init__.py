from app.core.config import settings
from app.storage.base import StorageService
from app.storage.local_storage import LocalStorageService

def get_storage_service() -> StorageService:
    if settings.STORAGE_BACKEND.lower() == "s3" and settings.S3_BUCKET_NAME:
        try:
            from app.storage.s3_storage import S3StorageService
            return S3StorageService()
        except Exception:
            # Fall back to local storage if S3 cannot connect
            return LocalStorageService()
    return LocalStorageService()
