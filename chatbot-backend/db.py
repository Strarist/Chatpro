"""
SQLAlchemy database setup and models.

Lightweight, production-ready conversation persistence using SQLite.
"""

import os

from sqlalchemy import create_engine, Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from sqlalchemy.sql import func

# =========================
# DATABASE CONFIGURATION
# =========================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./chatpro.db"
)

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    # SQLite-specific optimizations
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


# =========================
# 📦 MODELS
# =========================
class ConversationModel(Base):
    """Conversation/Chat record."""
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, index=True)
    title = Column(String(256), nullable=False, default="New Chat")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())
    
    # Relationship to messages
    messages = relationship("MessageModel", back_populates="conversation", cascade="all, delete-orphan")


class MessageModel(Base):
    """Message record within a conversation."""
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, index=True)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String(32), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    
    # Relationship back to conversation
    conversation = relationship("ConversationModel", back_populates="messages")


def init_db():
    """Initialize the database schema."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Get a database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
