import os
import mimetypes
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException, status, Response
from fastapi.responses import FileResponse
from app.core.config import settings
from app.storage.local_storage import LocalStorageService

router = APIRouter()
storage = LocalStorageService()

@router.put("/upload")
async def local_upload(key: str, request: Request):
    """
    Simulates direct S3 presigned PUT upload in local development mode.
    Reads raw binary body sent by browser.
    """
    body = await request.body()
    if not body:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty request body")

    try:
        storage.save_file_data(key, body)
        return Response(status_code=status.HTTP_200_OK)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/files/{key:path}")
def local_file(key: str):
    """
    Serves stored files in local development mode.
    """
    try:
        path = storage._get_full_path(key)
        if not path.exists() or not path.is_file():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        content_type, _ = mimetypes.guess_type(str(path))
        if not content_type:
            content_type = "application/octet-stream"

        return FileResponse(
            path=str(path),
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            }
        )
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid key")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
