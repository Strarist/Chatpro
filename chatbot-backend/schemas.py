"""
Pydantic models for API request/response schemas.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# =========================
# REQUEST MODELS
# =========================
class MessageInput(BaseModel):
    """User message input (for conversation API)."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


class ConversationCreateRequest(BaseModel):
    """Create a new conversation."""
    title: str = Field(default="New Chat", description="Conversation title")


class ConversationUpdateRequest(BaseModel):
    """Update conversation metadata."""
    title: Optional[str] = Field(None, description="New conversation title")


class MessageAppendRequest(BaseModel):
    """Append a message to a conversation."""
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message content")


# =========================
# RESPONSE MODELS
# =========================
class MessageResponse(BaseModel):
    """Message response."""
    id: str
    conversation_id: str
    role: str
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    """Conversation response (with messages)."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: List[MessageResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ConversationListResponse(BaseModel):
    """Conversation list item (without messages for efficiency)."""
    id: str
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# =========================
# LEGACY CHAT MODELS (SSE streaming)
# =========================
class LegacyMessage(BaseModel):
    """Legacy chat message format (used in SSE streaming)."""
    role: str
    content: str


class ChatRequest(BaseModel):
    """Chat request for SSE streaming endpoint."""
    messages: list[LegacyMessage] = Field(default_factory=list)
    model: Optional[str] = Field(None, description="Model ID (optional, uses default if not provided)")
    conversation_id: Optional[str] = Field(None, description="Optional conversation ID to associate with this request")
