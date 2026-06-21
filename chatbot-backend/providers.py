"""AI provider streaming helpers for the /chat SSE endpoint."""

import json
from typing import Generator

import requests

GROQ_MODELS = frozenset({
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
})


def get_provider_for_model(model: str) -> str:
    if model in GROQ_MODELS:
        return "groq"
    return "openrouter"


def sse_error(message: str, error_type: str = "upstream_error") -> str:
    payload = {
        "error": {
            "message": message,
            "type": error_type,
        }
    }
    return f"data: {json.dumps(payload)}\n\n"


def _forward_sse_lines(response: requests.Response) -> Generator[str, None, None]:
    for line in response.iter_lines():
        if not line:
            continue

        decoded = line.decode("utf-8")
        if decoded.startswith("data: "):
            yield decoded + "\n\n"


def stream_openrouter_response(
    *,
    messages: list[dict],
    model: str,
    api_key: str,
    api_url: str,
    app_referer: str,
    app_title: str,
    max_tokens: int,
    temperature: float,
    connect_timeout: float,
    request_timeout: float,
) -> Generator[str, None, None]:
    response = None

    try:
        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "Referer": app_referer,
                "X-Title": app_title,
            },
            json={
                "model": model,
                "messages": messages,
                "stream": True,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            stream=True,
            timeout=(connect_timeout, request_timeout),
        )

        if response.status_code != 200:
            body_text = (response.text or "").strip()
            print(
                f"OPENROUTER ERROR: status={response.status_code} model={model} body={body_text}"
            )
            yield sse_error(
                f"OpenRouter error: {body_text}",
                "upstream_http_error",
            )
            return

        yield from _forward_sse_lines(response)

    except requests.Timeout:
        print("OPENROUTER TIMEOUT")
        yield sse_error(
            "Upstream AI service timed out.",
            "timeout_error",
        )

    except requests.RequestException as exc:
        print("OPENROUTER REQUEST ERROR:", str(exc))
        yield sse_error(
            "Upstream AI service unavailable.",
            "request_error",
        )

    except Exception as exc:
        print("OPENROUTER FULL ERROR:", str(exc))
        yield sse_error(
            "Unexpected server error.",
            "internal_error",
        )

    finally:
        if response is not None:
            response.close()


def stream_groq_response(
    *,
    messages: list[dict],
    model: str,
    api_key: str,
    api_url: str,
    max_tokens: int,
    temperature: float,
    connect_timeout: float,
    request_timeout: float,
) -> Generator[str, None, None]:
    response = None

    try:
        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model,
                "messages": messages,
                "stream": True,
                "max_tokens": max_tokens,
                "temperature": temperature,
            },
            stream=True,
            timeout=(connect_timeout, request_timeout),
        )

        if response.status_code != 200:
            body_text = (response.text or "").strip()
            print(
                f"GROQ ERROR: status={response.status_code} model={model} body={body_text}"
            )
            yield sse_error(
                f"Groq error: {body_text}",
                "upstream_http_error",
            )
            return

        yield from _forward_sse_lines(response)

    except requests.Timeout:
        print("GROQ TIMEOUT")
        yield sse_error(
            "Upstream AI service timed out.",
            "timeout_error",
        )

    except requests.RequestException as exc:
        print("GROQ REQUEST ERROR:", str(exc))
        yield sse_error(
            "Upstream AI service unavailable.",
            "request_error",
        )

    except Exception as exc:
        print("GROQ FULL ERROR:", str(exc))
        yield sse_error(
            "Unexpected server error.",
            "internal_error",
        )

    finally:
        if response is not None:
            response.close()
