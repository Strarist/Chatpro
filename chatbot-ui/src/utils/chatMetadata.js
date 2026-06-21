const STORAGE_KEY = "chatpro.chatMeta";

const getStorage = () => {
  if (typeof globalThis === "undefined") return null;
  return globalThis.localStorage ?? null;
};

const safeParse = (value) => {
  if (typeof value !== "string") return { pinnedIds: [] };
  try {
    const parsed = JSON.parse(value);
    if (parsed && Array.isArray(parsed.pinnedIds)) {
      return { pinnedIds: parsed.pinnedIds.filter(Boolean) };
    }
  } catch {
    // ignore invalid cache
  }
  return { pinnedIds: [] };
};

export const loadChatMetadata = () => {
  const storage = getStorage();
  if (!storage) {
    return { pinnedIds: [] };
  }
  return safeParse(storage.getItem(STORAGE_KEY));
};

export const saveChatMetadata = (metadata) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(
    STORAGE_KEY,
    JSON.stringify({ pinnedIds: metadata.pinnedIds || [] })
  );
};

export const isChatPinned = (chatId, metadata = loadChatMetadata()) =>
  metadata.pinnedIds.includes(chatId);

export const toggleChatPin = (chatId) => {
  const metadata = loadChatMetadata();
  const pinnedIds = metadata.pinnedIds.includes(chatId)
    ? metadata.pinnedIds.filter((id) => id !== chatId)
    : [chatId, ...metadata.pinnedIds.filter((id) => id !== chatId)];

  const next = { pinnedIds };
  saveChatMetadata(next);
  return next;
};

export const sortChatsByPin = (chats, metadata = loadChatMetadata()) => {
  const pinnedSet = new Set(metadata.pinnedIds);
  const pinned = metadata.pinnedIds
    .map((id) => chats.find((chat) => chat.id === id))
    .filter(Boolean);
  const unpinned = chats.filter((chat) => !pinnedSet.has(chat.id));
  return { pinned, unpinned, pinnedIds: metadata.pinnedIds };
};

export const formatChatForShare = (chat) => {
  if (!chat?.messages?.length) {
    return `${chat?.title || "Chat"}: No messages yet.`;
  }

  const lines = chat.messages.map((message) => {
    const label = message.role === "assistant" ? "Assistant" : "User";
    return `${label}: ${message.content}`;
  });

  return `${chat.title || "Chat"}\n\n${lines.join("\n\n")}`;
};
