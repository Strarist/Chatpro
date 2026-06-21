"""Load .env from chatbot-backend/ or project root (Realtime-Chatbot/.env)."""

from pathlib import Path

from dotenv import load_dotenv

_loaded = False


def load_app_env():
    global _loaded
    if _loaded:
        return None

    backend_dir = Path(__file__).resolve().parent
    project_root = backend_dir.parent

    for env_path in (backend_dir / ".env", project_root / ".env"):
        if env_path.is_file():
            load_dotenv(dotenv_path=env_path)
            _loaded = True
            return str(env_path)

    _loaded = True
    return None
