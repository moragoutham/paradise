import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, BigInteger, Boolean, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

asset_tags = Table(
    "asset_tags",
    Base.metadata,
    Column("asset_id", String(36), ForeignKey("assets.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", String(36), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    name = Column(String(50), unique=True, index=True, nullable=False)

    assets = relationship("Asset", secondary=asset_tags, back_populates="tags")

class Asset(Base):
    __tablename__ = "assets"

    id = Column(String(36), primary_key=True, default=generate_uuid, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    collection_id = Column(String(36), ForeignKey("collections.id", ondelete="SET NULL"), nullable=True, index=True)
    
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text, nullable=True)
    s3_key = Column(String(500), nullable=False, index=True)
    content_type = Column(String(50), nullable=False)
    file_size = Column(BigInteger, nullable=False)
    is_favorite = Column(Boolean, default=False, nullable=False, index=True)
    is_deleted = Column(Boolean, default=False, nullable=False, index=True)
    deleted_at = Column(DateTime(timezone=True), nullable=True)
    upload_confirmed = Column(Boolean, default=False, nullable=False)
    
    created_at = Column(DateTime(timezone=True), default=utc_now, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now, nullable=False)

    user = relationship("User", back_populates="assets")
    collection = relationship("Collection", back_populates="assets")
    tags = relationship("Tag", secondary=asset_tags, back_populates="assets")
