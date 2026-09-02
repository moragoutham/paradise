from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.database import get_db
from app.models.user import User
from app.models.collection import Collection
from app.models.asset import Asset
from app.schemas.collection import CollectionCreate, CollectionUpdate, CollectionResponse
from app.api.deps import get_current_user, get_storage
from app.storage.base import StorageService

router = APIRouter()

@router.get("", response_model=List[CollectionResponse])
def list_collections(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    collections = db.query(Collection).filter(Collection.user_id == current_user.id).order_by(Collection.created_at.desc()).all()
    results = []
    for col in collections:
        asset_count = db.query(func.count(Asset.id)).filter(
            Asset.collection_id == col.id,
            Asset.is_deleted == False
        ).scalar() or 0

        # Grab cover image from latest asset if available
        latest_asset = db.query(Asset).filter(
            Asset.collection_id == col.id,
            Asset.is_deleted == False,
            Asset.upload_confirmed == True
        ).order_by(Asset.created_at.desc()).first()

        cover_url = None
        if latest_asset:
            cover_url = storage.generate_presigned_download_url(latest_asset.s3_key)

        res = CollectionResponse(
            id=col.id,
            user_id=col.user_id,
            name=col.name,
            description=col.description,
            asset_count=asset_count,
            cover_image_url=cover_url,
            created_at=col.created_at,
            updated_at=col.updated_at
        )
        results.append(res)
    return results

@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
def create_collection(
    col_in: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    col = Collection(
        user_id=current_user.id,
        name=col_in.name,
        description=col_in.description
    )
    db.add(col)
    db.commit()
    db.refresh(col)
    return CollectionResponse(
        id=col.id,
        user_id=col.user_id,
        name=col.name,
        description=col.description,
        asset_count=0,
        cover_image_url=None,
        created_at=col.created_at,
        updated_at=col.updated_at
    )

@router.get("/{id}", response_model=CollectionResponse)
def get_collection(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage)
):
    col = db.query(Collection).filter(Collection.id == id, Collection.user_id == current_user.id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    asset_count = db.query(func.count(Asset.id)).filter(
        Asset.collection_id == col.id,
        Asset.is_deleted == False
    ).scalar() or 0

    latest_asset = db.query(Asset).filter(
        Asset.collection_id == col.id,
        Asset.is_deleted == False,
        Asset.upload_confirmed == True
    ).order_by(Asset.created_at.desc()).first()

    cover_url = None
    if latest_asset:
        cover_url = storage.generate_presigned_download_url(latest_asset.s3_key)

    return CollectionResponse(
        id=col.id,
        user_id=col.user_id,
        name=col.name,
        description=col.description,
        asset_count=asset_count,
        cover_image_url=cover_url,
        created_at=col.created_at,
        updated_at=col.updated_at
    )

@router.patch("/{id}", response_model=CollectionResponse)
def update_collection(
    id: str,
    col_in: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    col = db.query(Collection).filter(Collection.id == id, Collection.user_id == current_user.id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    if col_in.name is not None:
        col.name = col_in.name
    if col_in.description is not None:
        col.description = col_in.description

    db.commit()
    db.refresh(col)

    asset_count = db.query(func.count(Asset.id)).filter(
        Asset.collection_id == col.id,
        Asset.is_deleted == False
    ).scalar() or 0

    return CollectionResponse(
        id=col.id,
        user_id=col.user_id,
        name=col.name,
        description=col.description,
        asset_count=asset_count,
        cover_image_url=None,
        created_at=col.created_at,
        updated_at=col.updated_at
    )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_collection(
    id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    col = db.query(Collection).filter(Collection.id == id, Collection.user_id == current_user.id).first()
    if not col:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    db.delete(col)
    db.commit()
    return None
