import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  loadChatMetadata,
  saveChatMetadata,
  toggleChatPin,
  sortChatsByPin,
  isChatPinned,
  formatChatForShare,
} from "./chatMetadata";

const createStorage = () => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
};

describe("chatMetadata", () => {
  beforeEach(() => {
    globalThis.localStorage = createStorage();
  });

  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("loads empty metadata by default", () => {
    expect(loadChatMetadata()).toEqual({ pinnedIds: [] });
  });

  it("toggles pin on and off", () => {
    const first = toggleChatPin("chat-a");
    expect(first.pinnedIds).toEqual(["chat-a"]);
    expect(isChatPinned("chat-a", first)).toBe(true);

    const second = toggleChatPin("chat-a");
    expect(second.pinnedIds).toEqual([]);
    expect(isChatPinned("chat-a", second)).toBe(false);
  });

  it("persists pin state in localStorage", () => {
    toggleChatPin("chat-b");
    expect(loadChatMetadata().pinnedIds).toEqual(["chat-b"]);
  });

  it("sorts pinned chats first in pin order", () => {
    saveChatMetadata({ pinnedIds: ["chat-2", "chat-1"] });
    const chats = [
      { id: "chat-1", title: "One" },
      { id: "chat-3", title: "Three" },
      { id: "chat-2", title: "Two" },
    ];

    const { pinned, unpinned } = sortChatsByPin(chats);
    expect(pinned.map((chat) => chat.id)).toEqual(["chat-2", "chat-1"]);
    expect(unpinned.map((chat) => chat.id)).toEqual(["chat-3"]);
  });

  it("formats chat messages for clipboard share", () => {
    const text = formatChatForShare({
      title: "Demo",
      messages: [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there" },
      ],
    });

    expect(text).toContain("Demo");
    expect(text).toContain("User: Hello");
    expect(text).toContain("Assistant: Hi there");
  });
});
