from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AssetUploadRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    content_type: str
    file_size: int = Field(..., gt=0)
    file_name: str
    collection_id: Optional[str] = None
    tags: Optional[List[str]] = []

class UploadUrlResponse(BaseModel):
    asset_id: str
    upload_url: str
    s3_key: str

class ReplaceUrlRequest(BaseModel):
    content_type: str
    file_size: int = Field(..., gt=0)

class ReplaceUrlResponse(BaseModel):
    upload_url: str
    s3_key: str

class AssetUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    collection_id: Optional[str] = None
    is_favorite: Optional[bool] = None
    tags: Optional[List[str]] = None

class CollectionBrief(BaseModel):
    id: str
    name: str

    class Config:
        from_attributes = True

class AssetResponse(BaseModel):
    id: str
    user_id: str
    collection_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    s3_key: str
    content_type: str
    file_size: int
    is_favorite: bool
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    upload_confirmed: bool
    preview_url: Optional[str] = None
    tags: List[str] = []
    collection: Optional[CollectionBrief] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PaginatedAssetResponse(BaseModel):
    items: List[AssetResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
