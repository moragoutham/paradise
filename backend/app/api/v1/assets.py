import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from app.core.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.asset import Asset, Tag
from app.schemas.asset import (
    AssetUploadRequest, UploadUrlResponse, AssetResponse,
    AssetUpdateRequest, PaginatedAssetResponse, ReplaceUrlRequest,
    ReplaceUrlResponse, CollectionBrief
)
from app.api.deps import get_current_user, get_storage
from app.storage.base import StorageService

router = APIRouter()

ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]
MAX_FILE_SIZE = 25 * 1024 * 1024  # 25 MB

def mime_to_ext(mime: str) -> str:
    map_types = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "image/gif": "gif",
    }
    return map_types.get(mime, "bin")

def to_asset_response(asset: Asset, storage: StorageService) -> AssetResponse:
    preview_url = storage.generate_presigned_download_url(asset.s3_key) if asset.upload_confirmed else None
    tag_names = [t.name for t in asset.tags]
    col_brief = CollectionBrief(id=asset.collection.id, name=asset.collection.name) if asset.collection else None

    return AssetResponse(
        id=asset.id,
        user_id=asset.user_id,
        collection_id=asset.collection_id,
        title=asset.title,
        description=asset.description,
        s3_key=asset.s3_key,
        content_type=asset.content_type,
        file_size=asset.file_size,
        is_favorite=asset.is_favorite,
        is_deleted=asset.is_deleted,
        deleted_at=asset.deleted_at,
        upload_confirmed=asset.upload_confirmed,
        preview_url=preview_url,
        tags=tag_names,
        collection=col_brief,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
    )

@router.post("/upload-url", response_model=UploadUrlResponse, status_code=status.HTTP_201_CREATED)
def request_upload_url(
    req: AssetUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    if req.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported format {req.content_type}. Supported: JPEG, PNG, WebP, GIF."
        )

    if req.file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File exceeds maximum allowed size of 25 MB."
        )

    if req.collection_id:
        col = db.query(Collection).filter(
            Collection.id == req.collection_id,
            Collection.user_id == current_user.id
        ).first()
        if not col:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    asset_id = str(uuid.uuid4())
    ext = mime_to_ext(req.content_type)
    # S3 Key structure: users/{user_id}/assets/{asset_id}/original.{ext}
    s3_key = f"framevault/users/{current_user.id}/assets/{asset_id}/original.{ext}"

    upload_url = storage.generate_presigned_upload_url(
        key=s3_key,
        content_type=req.content_type,
        expires_in=900
    )

    asset = Asset(
        id=asset_id,
        user_id=current_user.id,
        collection_id=req.collection_id,
        title=req.title,
        description=req.description,
        s3_key=s3_key,
        content_type=req.content_type,
        file_size=req.file_size,
        upload_confirmed=False
    )

    if req.tags:
        for tag_name in req.tags:
            clean_name = tag_name.strip().lower()
            if clean_name:
                tag = db.query(Tag).filter(Tag.name == clean_name).first()
                if not tag:
                    tag = Tag(name=clean_name)
                    db.add(tag)
                asset.tags.append(tag)

    db.add(asset)
    db.commit()

    return UploadUrlResponse(asset_id=asset_id, upload_url=upload_url, s3_key=s3_key)

@router.patch("/{id}/confirm-upload", response_model=AssetResponse)
def confirm_upload(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    asset.upload_confirmed = True
    db.commit()
    db.refresh(asset)

    return to_asset_response(asset, storage)

@router.get("", response_model=PaginatedAssetResponse)
def list_assets(
    collection_id: Optional[str] = Query(None),
    content_type: Optional[str] = Query(None),
    favorites_only: bool = Query(False),
    deleted: bool = Query(False),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at"),
    sort_dir: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    query = db.query(Asset).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_deleted == deleted
    )

    if collection_id:
        query = query.filter(Asset.collection_id == collection_id)

    if content_type:
        query = query.filter(Asset.content_type == content_type)

    if favorites_only:
        query = query.filter(Asset.is_favorite == True)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Asset.title.ilike(s),
                Asset.description.ilike(s),
                Asset.tags.any(Tag.name.ilike(s))
            )
        )

    # Sort
    sort_col = getattr(Asset, sort_by, Asset.created_at)
    if sort_dir.lower() == "asc":
        query = query.order_by(sort_col.asc())
    else:
        query = query.order_by(sort_col.desc())

    total = query.count()
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedAssetResponse(
        items=[to_asset_response(a, storage) for a in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )

@router.get("/stats/summary")
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    total_assets = db.query(func.count(Asset.id)).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_deleted == False
    ).scalar() or 0

    total_collections = db.query(func.count(Collection.id)).filter(
        Collection.user_id == current_user.id
    ).scalar() or 0

    storage_bytes = db.query(func.sum(Asset.file_size)).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_deleted == False
    ).scalar() or 0

    favorite_count = db.query(func.count(Asset.id)).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_favorite == True,
        Asset.is_deleted == False
    ).scalar() or 0

    recent_assets = db.query(Asset).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_deleted == False
    ).order_by(Asset.created_at.desc()).limit(8).all()

    recent_collections = db.query(Collection).filter(
        Collection.user_id == current_user.id
    ).order_by(Collection.created_at.desc()).limit(4).all()

    favorite_assets = db.query(Asset).filter(
        Asset.user_id == current_user.id,
        Asset.upload_confirmed == True,
        Asset.is_favorite == True,
        Asset.is_deleted == False
    ).order_by(Asset.created_at.desc()).limit(4).all()

    return {
        "total_assets": total_assets,
        "total_collections": total_collections,
        "total_storage_bytes": storage_bytes,
        "favorite_count": favorite_count,
        "recent_assets": [to_asset_response(a, storage) for a in recent_assets],
        "favorite_assets": [to_asset_response(a, storage) for a in favorite_assets],
    }

@router.get("/{id}", response_model=AssetResponse)
def get_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    return to_asset_response(asset, storage)

@router.patch("/{id}", response_model=AssetResponse)
def update_asset(
    id: str,
    req: AssetUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    if req.title is not None:
        asset.title = req.title
    if req.description is not None:
        asset.description = req.description
    if req.collection_id is not None:
        if req.collection_id == "":
            asset.collection_id = None
        else:
            col = db.query(Collection).filter(Collection.id == req.collection_id, Collection.user_id == current_user.id).first()
            if not col:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target collection not found")
            asset.collection_id = col.id
    if req.is_favorite is not None:
        asset.is_favorite = req.is_favorite
    if req.tags is not None:
        asset.tags.clear()
        for t_name in req.tags:
            clean = t_name.strip().lower()
            if clean:
                t = db.query(Tag).filter(Tag.name == clean).first()
                if not t:
                    t = Tag(name=clean)
                    db.add(t)
                asset.tags.append(t)

    db.commit()
    db.refresh(asset)
    return to_asset_response(asset, storage)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Soft delete (move to trash)
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    asset.is_deleted = True
    asset.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return None

@router.patch("/{id}/restore", response_model=AssetResponse)
def restore_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id, Asset.is_deleted == True).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found in trash")

    asset.is_deleted = False
    asset.deleted_at = None
    db.commit()
    db.refresh(asset)
    return to_asset_response(asset, storage)

@router.delete("/{id}/permanent", status_code=status.HTTP_204_NO_CONTENT)
def permanent_delete_asset(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    # Delete from S3/storage
    storage.delete_object(asset.s3_key)

    # Delete from database
    db.delete(asset)
    db.commit()
    return None

@router.post("/{id}/replace-url", response_model=ReplaceUrlResponse)
def replace_asset_url(
    id: str,
    req: ReplaceUrlRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    asset = db.query(Asset).filter(Asset.id == id, Asset.user_id == current_user.id).first()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")

    if req.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported format")

    ext = mime_to_ext(req.content_type)
    # Generate new object key or overwrite existing
    s3_key = f"framevault/users/{current_user.id}/assets/{asset.id}/original.{ext}"

    upload_url = storage.generate_presigned_upload_url(
        key=s3_key,
        content_type=req.content_type,
        expires_in=900
    )

    asset.s3_key = s3_key
    asset.content_type = req.content_type
    asset.file_size = req.file_size
    db.commit()

    return ReplaceUrlResponse(upload_url=upload_url, s3_key=s3_key)
