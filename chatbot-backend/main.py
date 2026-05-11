import os
import json
import requests
from pathlib import Path
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
load_dotenv(dotenv_path=Path(__file__).with_name(".env"))

app = FastAPI()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_API_URL = os.getenv(
    "OPENROUTER_API_URL",
    "https://openrouter.ai/api/v1/chat/completions",
)
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "openrouter/auto")
APP_TITLE = os.getenv("APP_TITLE", "BotGPT")
MAX_TOKENS = int(os.getenv("MAX_TOKENS", "300"))
TEMPERATURE = float(os.getenv("TEMPERATURE", "0.7"))
REQUEST_TIMEOUT = float(os.getenv("OPENROUTER_TIMEOUT_SECONDS", "60"))
CONNECT_TIMEOUT = float(os.getenv("OPENROUTER_CONNECT_TIMEOUT_SECONDS", "10"))
FRONTEND_ORIGINS = [
    origin.strip()
    for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
    # Add more logic here if needed (e.g., input validation)

    async def generate():
        async with httpx.AsyncClient() as client:
            headers = {
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000", # Optional
                "X-Title": "FastAPI Chatbot", # Optional
            }
            payload = {
                "model": "google/learnlm-1.5-pro-experimental:free",
                "messages": messages,
                "stream": True,
            }

            async with client.stream(
                "POST",
                OPENROUTER_URL,
                headers=headers,
                json=payload,
            ) as response:
                if response.status_code != 200:
                    yield f"data: {json.dumps({'error': 'Failed to fetch from OpenRouter'})}\n\n"
                    return

                async for line in response.aiter_lines():
                    if line:
                        yield f"{line}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

except Exception as e:
    return {"error": str(e)}
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


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message] = Field(default_factory=list)


def error_response(code: str, message: str, status_code: int = 400):
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


# =========================
# 🚀 CHAT ENDPOINT
# =========================
@app.post("/chat")
async def chat_endpoint(req: ChatRequest):

    raw_messages = req.messages

    # =========================
    # 🧠 SYSTEM PROMPT (CRITICAL)
    # =========================
    system_prompt = {
        "role": "system",
        "content": (
            "You are a helpful, professional AI assistant.\n"
            "- Be clear and concise\n"
            "- Do NOT repeat phrases\n"
            "- Do NOT generate random or broken text\n"
            "- Keep responses structured and readable\n"
            "- Stay relevant to the user's question\n"
        )
    }

    messages = [system_prompt]

    # =========================
    # 🧹 CLEAN MESSAGES
    # =========================
    for msg in raw_messages:
        content = str(msg.content).strip()
        role = msg.role

        if not content:
            continue

        if role not in ["user", "assistant"]:
            continue

        messages.append({
            "role": role,
            "content": content
        })

    # =========================
    # ❗ SAFETY CHECK
    # =========================
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

    # =========================
    # 🔄 STREAM GENERATOR
    # =========================
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

            # =========================
            # ❌ HANDLE API ERROR
            # =========================
            if response.status_code != 200:
                print("OPENROUTER ERROR:", response.status_code)
                yield "Error: upstream AI service returned an error"
                return

            # =========================
            # ✅ STREAM PARSING (CLEAN)
            # =========================
            for line in response.iter_lines():

                if not line:
                    continue

                decoded = line.decode("utf-8")

                # Ignore junk (like OPENROUTER PROCESSING)
                if not decoded.startswith("data: "):
                    continue

                data = decoded[6:].strip()

                if data == "[DONE]":
                    break

                try:
                    parsed = json.loads(data)

                    delta = parsed.get("choices", [{}])[0].get("delta", {})
                    content = delta.get("content")

                    if content:
                        yield content

                except Exception as e:
                    print("PARSE ERROR:", e)
                    continue

        except requests.Timeout:
            print("OPENROUTER TIMEOUT")
            yield "Error: upstream AI service timed out"
        except requests.RequestException as e:
            print("OPENROUTER REQUEST ERROR:", str(e))
            yield "Error: upstream AI service unavailable"
        except Exception as e:
            print("FULL ERROR:", str(e))
            yield "Error generating response"
        finally:
            if response is not None:
                response.close()

    return StreamingResponse(generate(), media_type="text/plain")

