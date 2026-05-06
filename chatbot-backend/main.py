import os
import json
import requests
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
load_dotenv()

app = FastAPI()

# =========================
# ✅ CORS CONFIG
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key = os.getenv("OPENROUTER_API_KEY")


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message] = []


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
        return StreamingResponse(
            iter(["⚠️ No user input found"]),
            media_type="text/plain"
        )

    if not api_key:
        return StreamingResponse(
            iter(["⚠️ Missing API key configuration"]),
            media_type="text/plain"
        )

    # =========================
    # 🔄 STREAM GENERATOR
    # =========================
    def generate():
        response = None
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:5173",
                    "X-Title": "BotGPT",
                },
                json={
                    "model": "openrouter/auto",  # 🔥 stable
                    "messages": messages,
                    "stream": True,
                    "max_tokens": 300,      # ✅ prevents overflow
                    "temperature": 0.7,     # ✅ stable responses
                },
                stream=True,
                timeout=60,
            )

            # =========================
            # ❌ HANDLE API ERROR
            # =========================
            if response.status_code != 200:
                error_text = response.text
                print("❌ OPENROUTER ERROR:", error_text)
                yield f"⚠️ API Error: {error_text}"
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
                    print("⚠️ PARSE ERROR:", e)
                    continue

        except Exception as e:
            print("🔥 FULL ERROR:", str(e))
            yield "⚠️ Error generating response"
        finally:
            if response is not None:
                response.close()

    return StreamingResponse(generate(), media_type="text/plain")