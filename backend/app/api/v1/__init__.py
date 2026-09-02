from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.collections import router as collections_router
from app.api.v1.assets import router as assets_router
from app.api.v1.storage import router as storage_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(collections_router, prefix="/collections", tags=["collections"])
api_router.include_router(assets_router, prefix="/assets", tags=["assets"])
api_router.include_router(storage_router, prefix="/storage", tags=["storage"])
