import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_ENV: str = "development"
    PROJECT_NAME: str = "FrameVault"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Security / JWT
    JWT_SECRET: str = "framevault-super-secret-dev-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    # Default to sqlite for effortless local zero-dependency runs, or postgres in docker/prod
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./framevault.db")

    # Storage Backend: "s3" or "local"
    STORAGE_BACKEND: str = os.getenv("STORAGE_BACKEND", "local")
    AWS_REGION: str = os.getenv("AWS_REGION", "us-east-1")
    S3_BUCKET_NAME: str = os.getenv("S3_BUCKET_NAME", "framevault-assets")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")

    PRESIGNED_UPLOAD_EXPIRES: int = 900       # 15 minutes
    PRESIGNED_DOWNLOAD_EXPIRES: int = 3600    # 1 hour

    # Local Storage Adapter
    LOCAL_STORAGE_PATH: str = os.getenv("LOCAL_STORAGE_PATH", "./local_storage")

    # CORS
    ALLOWED_ORIGINS: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000")

    @property
    def cors_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
