# ChatPro — AI Chat Application

A production-style AI chat platform with real-time SSE streaming, persistent multi-chat conversations, and privacy-safe per-browser isolation.

## Highlights

- Real OpenRouter SSE streaming (not simulated typing)
- Stream session ownership guards (stop / regenerate / chat-switch safe)
- Plain-text streaming, markdown + syntax highlighting after finalize
- Backend conversation persistence (FastAPI + SQLAlchemy + SQLite)
- Per-visitor privacy via `X-Client-ID` + `owner_id` filtering
- Multi-model selection with grouped provider UI
- Workerized post-stream markdown analysis for large code blocks

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS, Framer Motion, React Markdown |
| Backend | FastAPI, SQLAlchemy, SQLite |
| AI | OpenRouter streaming API |

## Project Structure

```text
chatbot-ui/
  src/
    components/     Chat UI (ChatWindow, MessageBubble, Sidebar, ...)
    services/       aiService, conversationService, sseParser
    utils/          clientId, apiClient, streamSession, markdownProcessor
    workers/        markdownWorker (post-stream optimization)
    config/         models.js

chatbot-backend/
  main.py           FastAPI routes + SSE proxy + privacy middleware
  db.py             SQLAlchemy models
  schemas.py        Pydantic API schemas
  test_main.py      Owner isolation + persistence tests
```

## Local Setup

### Frontend

```bash
cd chatbot-ui
npm install
npm run dev
```

Runs at `http://localhost:5173`

### Backend

```bash
cd chatbot-backend
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

Runs at `http://127.0.0.1:8000`

Create a `.env` file at the project root (`Realtime-Chatbot/.env`) or in `chatbot-backend/.env` (root is checked second). Copy from [`chatbot-backend/.env.example`](chatbot-backend/.env.example) and set `OPENROUTER_API_KEY` and/or `GROQ_API_KEY` depending on which models you use.

## Environment Variables

See [`chatbot-backend/.env.example`](chatbot-backend/.env.example):

- `OPENROUTER_API_KEY` — required for OpenRouter models on `/chat`
- `GROQ_API_KEY` — required for Groq models (e.g. `llama-3.3-70b-versatile`)
- `GROQ_API_URL` — optional Groq endpoint override
- `DATABASE_URL` — defaults to `sqlite:///./chatpro.db`
- `FRONTEND_ORIGINS` — CORS allowlist
- `REQUEST_TIMEOUT` / `CONNECT_TIMEOUT` — upstream timeouts

Optional frontend override: `VITE_API_URL`

## Architecture Notes

### Streaming lifecycle

Assistant messages render as lightweight plain text during token streaming. After finalize, markdown and syntax highlighting are enabled. Stream writes/finalize paths are guarded by explicit session ownership in `ChatWindow.jsx`.

### Privacy model

There is no account auth. Each browser gets a stable UUID in localStorage, sent as `X-Client-ID`. Backend stores `owner_id` on conversations and filters all CRUD by owner.

### Persistence model

Hybrid local + backend:

1. UI updates immediately in React state / localStorage
2. On stream finalize, user + assistant messages append to backend
3. On startup, backend conversations are fetched with full message history and merged with local cache by conversation ID

## Tests

```bash
# Frontend
cd chatbot-ui
npm test

# Backend
cd chatbot-backend
pytest
```

## Deployment

- Frontend: Vercel (`chatbot-ui`)
- Backend: Render (`chatbot-backend`)

SQLite on Render is suitable for portfolio/demo usage. For multi-user production scale, migrate `DATABASE_URL` to PostgreSQL while keeping the same SQLAlchemy models and owner isolation model.

## License

Educational and portfolio use.
