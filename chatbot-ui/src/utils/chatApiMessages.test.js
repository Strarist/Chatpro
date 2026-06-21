import { describe, expect, it } from "vitest";
import { buildChatApiMessages } from "./chatApiMessages";

describe("buildChatApiMessages", () => {
  it("returns a single user message for a new send turn", () => {
    const messages = [{ id: "u1", role: "user", content: "Hello" }];

    expect(buildChatApiMessages(messages)).toEqual([{ role: "user", content: "Hello" }]);
  });

  it("keeps only one assistant per user turn when regenerating context", () => {
    const messages = [
      { id: "u1", role: "user", content: "Question" },
      { id: "a1", role: "assistant", content: "Answer v1", parentId: "u1" },
      { id: "a2", role: "assistant", content: "Answer v2", parentId: "u1" },
    ];

    expect(buildChatApiMessages(messages, { u1: "a2" })).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Answer v2" },
    ]);
  });

  it("excludes the last assistant turn for regenerate requests", () => {
    const messages = [
      { id: "u1", role: "user", content: "First" },
      { id: "a1", role: "assistant", content: "First reply", parentId: "u1" },
      { id: "u2", role: "user", content: "Second" },
      { id: "a2", role: "assistant", content: "Second v1", parentId: "u2" },
      { id: "a3", role: "assistant", content: "Second v2", parentId: "u2" },
    ];

    expect(
      buildChatApiMessages(messages, { u2: "a3" }, { excludeLastAssistantTurn: true })
    ).toEqual([
      { role: "user", content: "First" },
      { role: "assistant", content: "First reply" },
      { role: "user", content: "Second" },
    ]);
  });

  it("builds valid alternation for a new send after multiple regenerations", () => {
    const messages = [
      { id: "u1", role: "user", content: "First" },
      { id: "a1", role: "assistant", content: "First v1", parentId: "u1" },
      { id: "a2", role: "assistant", content: "First v2", parentId: "u1" },
      { id: "u2", role: "user", content: "Follow up" },
    ];

    const payload = buildChatApiMessages(messages, { u1: "a2" });

    expect(payload).toEqual([
      { role: "user", content: "First" },
      { role: "assistant", content: "First v2" },
      { role: "user", content: "Follow up" },
    ]);

    for (let i = 1; i < payload.length; i++) {
      expect(payload[i].role).not.toBe(payload[i - 1].role);
    }
  });

  it("respects activeVersionMap when viewing an older assistant version", () => {
    const messages = [
      { id: "u1", role: "user", content: "Question" },
      { id: "a1", role: "assistant", content: "Answer v1", parentId: "u1" },
      { id: "a2", role: "assistant", content: "Answer v2", parentId: "u1" },
    ];

    expect(buildChatApiMessages(messages, { u1: "a1" })).toEqual([
      { role: "user", content: "Question" },
      { role: "assistant", content: "Answer v1" },
    ]);
  });
});
