from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from db.database import Base

class User(Base):
    __tablename__ = "users"

    id            = Column(Integer, primary_key=True)
    email         = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at    = Column(DateTime, default=datetime.utcnow)

    # Relationships
    files   = relationship("UploadedFile", back_populates="user")
    queries = relationship("QueryHistory", back_populates="user")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id             = Column(Integer, primary_key=True)
    user_id        = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename       = Column(String, nullable=False)
    file_hash      = Column(String, nullable=False)   # for duplicate detection
    chunks_stored  = Column(Integer, nullable=False)
    uploaded_at    = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="files")


class QueryHistory(Base):
    __tablename__ = "query_history"

    id         = Column(Integer, primary_key=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    question   = Column(Text, nullable=False)
    answer     = Column(Text, nullable=False)
    asked_at   = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="queries")