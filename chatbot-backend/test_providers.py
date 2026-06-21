import os
from io import BytesIO
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("OPENROUTER_API_KEY", "test-openrouter-key")
os.environ.setdefault("GROQ_API_KEY", "test-groq-key")

from db import Base, engine, init_db
from main import app
from providers import get_provider_for_model


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


CHAT_PAYLOAD = {
    "messages": [{"role": "user", "content": "Hello"}],
}


def test_get_provider_for_model_groq():
    assert get_provider_for_model("llama-3.3-70b-versatile") == "groq"
    assert get_provider_for_model("llama-3.1-8b-instant") == "groq"


def test_get_provider_for_model_openrouter():
    assert get_provider_for_model("openai/gpt-4.1") == "openrouter"
    assert get_provider_for_model("openrouter/auto") == "openrouter"


def test_chat_missing_groq_api_key(client, monkeypatch):
    import main

    monkeypatch.setattr(main, "GROQ_API_KEY", None)

    response = client.post(
        "/chat",
        json={
            **CHAT_PAYLOAD,
            "model": "llama-3.3-70b-versatile",
        },
    )

    assert response.status_code == 500
    payload = response.json()
    assert payload["error"]["code"] == "missing_api_key"
    assert "Groq" in payload["error"]["message"]


def test_chat_missing_openrouter_api_key(client, monkeypatch):
    import main

    monkeypatch.setattr(main, "OPENROUTER_API_KEY", None)

    response = client.post(
        "/chat",
        json={
            **CHAT_PAYLOAD,
            "model": "openai/gpt-4.1",
        },
    )

    assert response.status_code == 500
    payload = response.json()
    assert payload["error"]["code"] == "missing_api_key"
    assert "OpenRouter" in payload["error"]["message"]


def _mock_streaming_response(lines):
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = ""
    mock_response.iter_lines.return_value = [
        line.encode("utf-8") for line in lines
    ]
    mock_response.close = MagicMock()
    return mock_response


@patch("providers.requests.post")
def test_openrouter_sse_passthrough(mock_post, client):
    mock_post.return_value = _mock_streaming_response(
        ['data: {"choices":[{"delta":{"content":"Hi"}}]}', "data: [DONE]"]
    )

    response = client.post(
        "/chat",
        json={
            **CHAT_PAYLOAD,
            "model": "openai/gpt-4.1",
        },
    )

    assert response.status_code == 200
    assert 'data: {"choices":[{"delta":{"content":"Hi"}}]}' in response.text


@patch("providers.requests.post")
def test_groq_sse_passthrough(mock_post, client):
    mock_post.return_value = _mock_streaming_response(
        ['data: {"choices":[{"delta":{"content":"Groq"}}]}', "data: [DONE]"]
    )

    response = client.post(
        "/chat",
        json={
            **CHAT_PAYLOAD,
            "model": "llama-3.3-70b-versatile",
        },
    )

    assert response.status_code == 200
    assert 'data: {"choices":[{"delta":{"content":"Groq"}}]}' in response.text
    mock_post.assert_called_once()
    call_kwargs = mock_post.call_args.kwargs
    assert call_kwargs["json"]["model"] == "llama-3.3-70b-versatile"
    assert call_kwargs["json"]["stream"] is True
