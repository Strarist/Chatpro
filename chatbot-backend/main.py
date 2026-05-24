import os
import json
from pathlib import Path
from uuid import uuid4

import requests
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy.orm import Session

# Local imports
from db import init_db, get_db, ConversationModel, MessageModel
from schemas import (
    ChatRequest, MessageAppendRequest, ConversationCreateRequest,
    ConversationUpdateRequest, ConversationResponse, ConversationListResponse,
    MessageResponse
)


# Load .env from the same directory as this file
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))


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


def sse_error(message: str, error_type: str = "upstream_error"):
    payload = {
        "error": {
            "message": message,
            "type": error_type,
        }
    }
    return f"data: {json.dumps(payload)}\n\n"


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
    db: Session = Depends(get_db)
):
    """Create a new conversation."""
    conversation_id = str(uuid4())
    conversation = ConversationModel(
        id=conversation_id,
        title=req.title
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@app.get("/conversations", response_model=list[ConversationListResponse])
def list_conversations(db: Session = Depends(get_db)):
    """List all conversations (sorted by most recent first)."""
    conversations = db.query(ConversationModel).order_by(
        ConversationModel.updated_at.desc()
    ).all()
    return conversations


@app.get("/conversations/{conversation_id}", response_model=ConversationResponse)
def get_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Get a single conversation with all its messages."""
    conversation = db.query(ConversationModel).filter(
        ConversationModel.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    return conversation


@app.post("/conversations/{conversation_id}/messages", response_model=MessageResponse)
def append_message(
    conversation_id: str,
    req: MessageAppendRequest,
    db: Session = Depends(get_db)
):
    """Append a message to a conversation."""
    conversation = db.query(ConversationModel).filter(
        ConversationModel.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    message = MessageModel(
        id=str(uuid4()),
        conversation_id=conversation_id,
        role=req.role,
        content=req.content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    
    return message


@app.put("/conversations/{conversation_id}", response_model=ConversationResponse)
def update_conversation(
    conversation_id: str,
    req: ConversationUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update conversation metadata (title)."""
    conversation = db.query(ConversationModel).filter(
        ConversationModel.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    if req.title is not None:
        conversation.title = req.title
    
    db.commit()
    db.refresh(conversation)
    
    return conversation


@app.delete("/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: str,
    db: Session = Depends(get_db)
):
    """Delete a conversation and all its messages."""
    conversation = db.query(ConversationModel).filter(
        ConversationModel.id == conversation_id
    ).first()
    
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    db.delete(conversation)
    db.commit()
    
    return {"status": "deleted", "conversation_id": conversation_id}



# =========================
# 🚀 CHAT ENDPOINT (STREAMING)
# =========================
@app.post("/chat")
def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Stream AI response using SSE.
    
    Optionally persists the request to a conversation if conversation_id is provided.
    Preserves full streaming safety and lifecycle.
    """
    raw_messages = req.messages
    selected_model = req.model or OPENROUTER_MODEL
    conversation_id = req.conversation_id

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

    if not OPENROUTER_API_KEY:
        return error_response(
            "missing_api_key",
            "Missing API key configuration",
            status_code=500,
        )

    # Stream generator
    def generate():
        response = None

        try:
            response = requests.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json",
                    "Referer": APP_REFERER,
                    "X-Title": APP_TITLE,
                },
                json={
                    "model": selected_model,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": MAX_TOKENS,
                    "temperature": TEMPERATURE,
                },
                stream=True,
                timeout=(CONNECT_TIMEOUT, REQUEST_TIMEOUT),
            )

            if response.status_code != 200:
                body_text = response.text or ""
                body_text = body_text.strip()
                print(
                    f"OPENROUTER ERROR: status={response.status_code} model={selected_model} body={body_text}"
                )
                yield sse_error(
                    f"OpenRouter error: {body_text}",
                    "upstream_http_error",
                )
                return

            for line in response.iter_lines():
                if not line:
                    continue

                decoded = line.decode("utf-8")

                # Forward OpenRouter SSE lines unchanged
                if decoded.startswith("data: "):
                    yield decoded + "\n\n"

        except requests.Timeout:
            print("OPENROUTER TIMEOUT")
            yield sse_error(
                "Upstream AI service timed out.",
                "timeout_error",
            )

        except requests.RequestException as e:
            print("OPENROUTER REQUEST ERROR:", str(e))
            yield sse_error(
                "Upstream AI service unavailable.",
                "request_error",
            )

        except Exception as e:
            print("FULL ERROR:", str(e))
            yield sse_error(
                "Unexpected server error.",
                "internal_error",
            )

        finally:
            if response is not None:
                response.close()

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
    )