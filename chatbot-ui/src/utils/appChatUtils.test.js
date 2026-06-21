import { describe, expect, it } from "vitest";
import {
  findReusableEmptyChat,
  mergeConversationList,
  normalizeLoadedChat,
  shouldPersistChats,
  sidebarChatsEqual,
  toSidebarChat,
} from "./appChatUtils";

describe("appChatUtils", () => {
  it("finds reusable empty chats", () => {
    const chats = [
      { id: "1", title: "New Chat", messages: [] },
      { id: "2", title: "Saved", messages: [{ role: "user", content: "Hi" }] },
    ];

    expect(findReusableEmptyChat(chats)?.id).toBe("1");
    expect(findReusableEmptyChat([chats[1]])).toBeUndefined();
  });

  it("normalizes messagesLoaded only when messages exist", () => {
    expect(
      normalizeLoadedChat({ id: "1", title: "New Chat", messages: [] }).messagesLoaded
    ).toBe(false);
    expect(
      normalizeLoadedChat({
        id: "2",
        title: "Saved",
        messages: [{ role: "user", content: "Hi" }],
      }).messagesLoaded
    ).toBe(true);
    expect(
      normalizeLoadedChat({ id: "3", title: "Saved", messagesLoaded: true, messages: [] })
        .messagesLoaded
    ).toBe(true);
  });

  it("filters orphan empty backend chats during merge", () => {
    const merged = mergeConversationList(
      [
        { id: "a", title: "New Chat" },
        { id: "b", title: "Saved chat" },
      ],
      []
    );

    expect(merged.map((chat) => chat.id)).toEqual(["b"]);
  });

  it("keeps chats with local messages even when backend list is empty", () => {
    const merged = mergeConversationList(
      [{ id: "a", title: "New Chat" }],
      [{ id: "a", title: "New Chat", messages: [{ role: "user", content: "Hi" }] }]
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].messages).toHaveLength(1);
  });

  it("preserves active empty chat when filtering orphans", () => {
    const merged = mergeConversationList(
      [
        { id: "a", title: "New Chat" },
        { id: "b", title: "New Chat" },
      ],
      [],
      "a"
    );

    expect(merged.map((chat) => chat.id)).toEqual(["a"]);
  });

  it("blocks persistence while streaming", () => {
    expect(shouldPersistChats([{ id: "1", messages: [{ isStreaming: true }] }])).toBe(
      false
    );
    expect(shouldPersistChats([{ id: "1", messages: [{ isStreaming: false }] }])).toBe(
      true
    );
  });

  it("compares sidebar chat metadata without message content", () => {
    const left = [toSidebarChat({ id: "1", title: "A", messages: [{ content: "x" }] })];
    const right = [toSidebarChat({ id: "1", title: "A", messages: [{ content: "y" }] })];

    expect(sidebarChatsEqual(left, right)).toBe(true);
  });
});
