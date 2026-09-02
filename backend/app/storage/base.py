from abc import ABC, abstractmethod
from typing import Optional

class StorageService(ABC):
    @abstractmethod
    def generate_presigned_upload_url(self, key: str, content_type: str, expires_in: int = 900) -> str:
        """Generate a time-limited URL for direct upload."""
        pass

    @abstractmethod
    def generate_presigned_download_url(self, key: str, expires_in: int = 3600) -> str:
        """Generate a time-limited URL for secure download/preview."""
        pass

    @abstractmethod
    def delete_object(self, key: str) -> bool:
        """Delete an object from storage."""
        pass

    @abstractmethod
    def object_exists(self, key: str) -> bool:
        """Check if an object exists in storage."""
        pass
