import os
import json
from pathlib import Path

import requests
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field


# Load .env from the same directory as this file
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = FastAPI()


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
# 📦 MODELS
# =========================
class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message] = Field(default_factory=list)


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
# 🚀 CHAT ENDPOINT
# =========================
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    raw_messages = req.messages

    # System prompt
    system_prompt = {
        "role": "system",
        "content": (
            "You are a helpful, professional AI assistant.\n"
            "- Be clear and concise\n"
            "- Do NOT repeat phrases\n"
            "- Do NOT generate random or broken text\n"
            "- Keep responses structured and readable\n"
            "- Stay relevant to the user's question\n"
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
                    "HTTP-Referer": APP_REFERER,
                    "X-Title": APP_TITLE,
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": messages,
                    "stream": True,
                    "max_tokens": MAX_TOKENS,
                    "temperature": TEMPERATURE,
                },
                stream=True,
                timeout=(CONNECT_TIMEOUT, REQUEST_TIMEOUT),
            )

            if response.status_code != 200:
                print("OPENROUTER ERROR:", response.status_code, response.text)
                yield sse_error(
                    "Upstream AI service returned an error.",
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