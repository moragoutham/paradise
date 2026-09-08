import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import Base, engine
from app.models import User, Collection, Asset, Tag, asset_tags
from app.db.seed import seed_database
from app.api.v1 import api_router

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically ensure database tables exist and seed initial demo data on startup
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database auto-seed note: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# Set up CORS (allow dynamic EC2 public IP, localhost, and configured domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins or ["*"],
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/health", tags=["health"])
@app.get(f"{settings.API_V1_STR}/health", tags=["health"])
def health_check():
    return {
        "status": "healthy",
        "service": "framevault-api",
        "version": settings.VERSION,
        "storage_backend": settings.STORAGE_BACKEND,
    }

# Mount API v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Hide internal stack traces in production responses
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
