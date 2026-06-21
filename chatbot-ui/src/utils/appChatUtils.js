export const findReusableEmptyChat = (chats) =>
  chats.find(
    (chat) => chat.title === "New Chat" && (!chat.messages || chat.messages.length === 0)
  );

export const normalizeLoadedChat = (chat) => ({
  ...chat,
  messagesLoaded:
    chat.messagesLoaded ??
    (Array.isArray(chat.messages) && chat.messages.length > 0),
});

export const mapBackendMessage = (message) => ({
  id: message.id || `msg_${message.role}_${Date.now()}`,
  role: message.role,
  content: message.content,
});

export const conversationToChatFormat = (
  conversation,
  localChats = [],
  messagesLoaded = false
) => {
  const local = localChats.find((chat) => chat.id === conversation.id);
  const backendMessages = (conversation.messages || []).map(mapBackendMessage);
  const localMessages = local?.messages || [];
  const hasBackendMessages = backendMessages.length > 0;
  const messages = hasBackendMessages
    ? backendMessages
    : messagesLoaded
      ? backendMessages
      : localMessages.length > 0
        ? localMessages
        : backendMessages;

  return {
    id: conversation.id,
    title: conversation.title,
    messages,
    updatedAt: conversation.updated_at || local?.updatedAt || null,
    messagesLoaded: messagesLoaded || hasBackendMessages || localMessages.length > 0,
  };
};

export const isOrphanEmptyChat = (conversation, localChats = []) => {
  if (conversation.title !== "New Chat") return false;

  const local = localChats.find((chat) => chat.id === conversation.id);
  const backendMessages = conversation.messages || [];
  const localMessages = local?.messages || [];

  return backendMessages.length === 0 && localMessages.length === 0;
};

export const mergeConversationList = (
  conversations,
  localChats = [],
  preserveChatId = null
) =>
  conversations
    .filter((conversation) => {
      if (preserveChatId && conversation.id === preserveChatId) {
        return true;
      }
      return !isOrphanEmptyChat(conversation, localChats);
    })
    .map((conversation) => conversationToChatFormat(conversation, localChats, false));

export const toSidebarChat = (chat) => ({
  id: chat.id,
  title: chat.title,
  messageCount: chat.messages?.length ?? 0,
  messagesLoaded: chat.messagesLoaded ?? false,
});

export const sidebarChatsEqual = (left, right) => {
  if (left.length !== right.length) return false;

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index];
    const b = right[index];
    if (
      a.id !== b.id ||
      a.title !== b.title ||
      a.messageCount !== b.messageCount ||
      a.messagesLoaded !== b.messagesLoaded
    ) {
      return false;
    }
  }

  return true;
};

export const shouldPersistChats = (chats) =>
  !chats.some((chat) => chat.messages?.some((message) => message.isStreaming));
