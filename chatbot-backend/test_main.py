import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")

import pytest
from fastapi.testclient import TestClient

from db import Base, engine, init_db
from main import app

CLIENT_A = "client-a-1111-2222-3333-444444444444"
CLIENT_B = "client-b-5555-6666-7777-888888888888"


@pytest.fixture
def client():
    init_db()
    with TestClient(app) as test_client:
        yield test_client
    Base.metadata.drop_all(bind=engine)


def create_conversation(test_client, client_id, title="Test Chat"):
    response = test_client.post(
        "/conversations",
        json={"title": title},
        headers={"X-Client-ID": client_id},
    )
    assert response.status_code == 200
    return response.json()


def test_conversations_are_isolated_by_client_id(client):
    conv_a = create_conversation(client, CLIENT_A, "Private A")

    list_b = client.get("/conversations", headers={"X-Client-ID": CLIENT_B})
    assert list_b.status_code == 200
    assert list_b.json() == []

    get_b = client.get(
        f"/conversations/{conv_a['id']}",
        headers={"X-Client-ID": CLIENT_B},
    )
    assert get_b.status_code == 404


def test_append_and_restore_messages_for_owner(client):
    conversation = create_conversation(client, CLIENT_A)

    append_user = client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"role": "user", "content": "Hello backend"},
        headers={"X-Client-ID": CLIENT_A},
    )
    assert append_user.status_code == 200

    append_assistant = client.post(
        f"/conversations/{conversation['id']}/messages",
        json={"role": "assistant", "content": "Hello from ChatPro"},
        headers={"X-Client-ID": CLIENT_A},
    )
    assert append_assistant.status_code == 200

    restored = client.get(
        f"/conversations/{conversation['id']}",
        headers={"X-Client-ID": CLIENT_A},
    )
    assert restored.status_code == 200
    payload = restored.json()
    assert len(payload["messages"]) == 2
    assert payload["messages"][0]["content"] == "Hello backend"
    assert payload["messages"][1]["content"] == "Hello from ChatPro"


def test_middleware_generates_client_id_when_missing(client):
    response = client.post("/conversations", json={"title": "Generated Owner"})
    assert response.status_code == 200
    assert "X-Client-ID" in response.headers
    generated_id = response.headers["X-Client-ID"]

    listed = client.get("/conversations", headers={"X-Client-ID": generated_id})
    assert listed.status_code == 200
    assert len(listed.json()) == 1
