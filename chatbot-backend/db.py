"""
SQLAlchemy database setup and models.

Lightweight, production-ready conversation persistence using SQLite.
"""

from load_env import load_app_env

load_app_env()

import os

from sqlalchemy import create_engine, Column, String, DateTime, Text, ForeignKey
from sqlalchemy.orm import DeclarativeBase, sessionmaker, relationship
from sqlalchemy.pool import StaticPool
from sqlalchemy.sql import func

# =========================
# DATABASE CONFIGURATION
# =========================
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./chatpro.db"
)

# Create SQLAlchemy engine
_engine_kwargs = {
    "echo": False,
}
if "sqlite" in DATABASE_URL:
    _engine_kwargs["connect_args"] = {"check_same_thread": False}
    if DATABASE_URL.endswith(":memory:"):
        _engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **_engine_kwargs)

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
    owner_id = Column(String(36), nullable=False, index=True, default="legacy")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

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


def _migrate_owner_id_column():
    """Add owner_id to existing SQLite databases created before privacy isolation."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    if "conversations" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("conversations")}
    if "owner_id" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE conversations ADD COLUMN owner_id VARCHAR(36) "
                "NOT NULL DEFAULT 'legacy'"
            )
        )


def init_db():
    """Initialize the database schema."""
    Base.metadata.create_all(bind=engine)
    _migrate_owner_id_column()


def get_db():
    """Get a database session for dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
