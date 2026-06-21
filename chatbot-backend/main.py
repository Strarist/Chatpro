import os
from uuid import uuid4

from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session
from starlette.middleware.base import BaseHTTPMiddleware

from load_env import load_app_env

load_app_env()

from providers import (
    get_provider_for_model,
    sse_error,
    stream_groq_response,
    stream_openrouter_response,
)

# Local imports (after .env is loaded)
from db import init_db, get_db, ConversationModel, MessageModel
from schemas import (
    ChatRequest, MessageAppendRequest, ConversationCreateRequest,
    ConversationUpdateRequest, ConversationResponse, ConversationListResponse,
    MessageResponse
)


@asynccontextmanager
async def lifespan(application):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)


# =========================
# ⚙️ CONFIGURATION
# =========================
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

OPENROUTER_API_URL = os.getenv(
    "OPENROUTER_API_URL",
    "https://openrouter.ai/api/v1/chat/completions",
)

OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/auto")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_API_URL = os.getenv(
    "GROQ_API_URL",
    "https://api.groq.com/openai/v1/chat/completions",
)

APP_TITLE = os.getenv("APP_TITLE", "BotGPT")

MAX_TOKENS = int(os.getenv("MAX_TOKENS", "300"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))

REQUEST_TIMEOUT = float(os.getenv("REQUEST_TIMEOUT", "60"))
CONNECT_TIMEOUT = float(os.getenv("CONNECT_TIMEOUT", "10"))

FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

APP_REFERER = os.getenv(
    "APP_REFERER",
    FRONTEND_ORIGINS[0] if FRONTEND_ORIGINS else "http://localhost:5173",
)

CLIENT_ID_HEADER = "X-Client-ID"


class ClientIdMiddleware(BaseHTTPMiddleware):
    """Ensure every request has a stable client identity for conversation ownership."""

    async def dispatch(self, request: Request, call_next):
        client_id = request.headers.get(CLIENT_ID_HEADER, "").strip()
        if not client_id:
            client_id = str(uuid4())

        request.state.client_id = client_id
        response = await call_next(request)
        response.headers[CLIENT_ID_HEADER] = client_id
        return response


def get_owner_id(request: Request) -> str:
    return request.state.client_id


def get_owned_conversation(
    conversation_id: str,
    owner_id: str,
    db: Session,
) -> ConversationModel:
    conversation = (
        db.query(ConversationModel)
        .filter(
            ConversationModel.id == conversation_id,
            ConversationModel.owner_id == owner_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    return conversation


# =========================
# ✅ CORS CONFIG
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ClientIdMiddleware)


# =========================
# ❌ ERROR HELPERS
# =========================
def error_response(code: str, message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
            }
        },
    )


# =========================
# 🏠 ROOT ENDPOINT
# =========================
@app.get("/")
def root():
    return {
        "status": "ok",
        "app": APP_TITLE,
        "model": OPENROUTER_MODEL,
    }


# =========================
# 💬 CONVERSATION ENDPOINTS
# =========================

@app.post("/conversations", response_model=ConversationResponse)
def create_conversation(
    req: ConversationCreateRequest,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """Create a new conversation."""
    conversation_id = str(uuid4())
    conversation = ConversationModel(
        id=conversation_id,
        title=req.title,
        owner_id=owner_id,
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@app.get("/conversations", response_model=list[ConversationListResponse])
def list_conversations(
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """List conversations for the current client."""
    conversations = (
        db.query(ConversationModel)
        .filter(ConversationModel.owner_id == owner_id)
        .order_by(ConversationModel.updated_at.desc())
        .all()
    )
    return conversations


@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """Get a single conversation with all its messages."""
    return get_owned_conversation(conversation_id, owner_id, db)


@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def append_message(
    conversation_id: str,
    req: MessageAppendRequest,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """Append a message to a conversation."""
    conversation = get_owned_conversation(conversation_id, owner_id, db)

    message = MessageModel(
        id=str(uuid4()),
        conversation_id=conversation.id,
        role=req.role,
        content=req.content,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return message


@app.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    req: ConversationUpdateRequest,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """Update conversation metadata (title)."""
    conversation = get_owned_conversation(conversation_id, owner_id, db)

    if req.title is not None:
        conversation.title = req.title

    db.commit()
    db.refresh(conversation)

    return conversation


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db),
    owner_id: str = Depends(get_owner_id),
):
    """Delete a conversation and all its messages."""
    conversation = get_owned_conversation(conversation_id, owner_id, db)

    db.delete(conversation)
    db.commit()

    return {"status": "deleted", "conversation_id": conversation_id}



# =========================
# 🚀 CHAT ENDPOINT (STREAMING)
# =========================
@app.post("/chat")
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Stream AI response via OpenRouter or Groq (SSE passthrough).
    Message persistence is handled by the frontend after stream finalize.
    """
    raw_messages = req.messages
    selected_model = req.model or OPENROUTER_MODEL
    provider = get_provider_for_model(selected_model)

    # System prompt
    system_prompt = {
        "role": "system",
        "content": (
            "You are ChatPro, a highly capable AI assistant.\n"
            "Answer the user's question directly and naturally.\n"
            "Be concise by default, but provide more detail when helpful.\n"
            "Do not introduce yourself unless asked.\n"
            "Do not explain your limitations unless they are directly relevant.\n"
            "Do not repeat instructions or generic disclaimers.\n"
            "Respond like a professional, intelligent conversational assistant."
        ),
    }

    messages = [system_prompt]

    # Clean messages
    for msg in raw_messages:
        content = str(msg.content).strip()
        role = msg.role

        if not content:
            continue

        if role not in ["user", "assistant"]:
            continue

        messages.append(
            {
                "role": role,
                "content": content,
            }
        )

    # Validation
    if not any(m["role"] == "user" for m in messages):
        return error_response(
            "empty_user_message",
            "No user input found",
            status_code=400,
        )

    if provider == "groq" and not GROQ_API_KEY:
        return error_response(
            "missing_api_key",
            "Missing Groq API key configuration",
            status_code=500,
        )

    if provider == "openrouter" and not OPENROUTER_API_KEY:
        return error_response(
            "missing_api_key",
            "Missing OpenRouter API key configuration",
            status_code=500,
        )

    stream_kwargs = {
        "messages": messages,
        "model": selected_model,
        "max_tokens": MAX_TOKENS,
        "temperature": TEMPERATURE,
        "connect_timeout": CONNECT_TIMEOUT,
        "request_timeout": REQUEST_TIMEOUT,
    }

    def generate():
        if provider == "groq":
            yield from stream_groq_response(
                api_key=GROQ_API_KEY,
                api_url=GROQ_API_URL,
                **stream_kwargs,
            )
        else:
            yield from stream_openrouter_response(
                api_key=OPENROUTER_API_KEY,
                api_url=OPENROUTER_API_URL,
                app_referer=APP_REFERER,
                app_title=APP_TITLE,
                **stream_kwargs,
            )

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )