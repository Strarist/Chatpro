/**
 * Conversation persistence service.
 *
 * Syncs conversations with the backend, restores state across refreshes,
 * and maintains consistent conversation data.
 */

import { apiFetch, BackendUnavailableError, isNetworkError } from "../utils/apiClient";

const wrapNetworkError = (error) => {
  if (isNetworkError(error)) {
    throw new BackendUnavailableError("Could not reach backend", error);
  }
  throw error;
};

// =========================
// CONVERSATION CRUD
// =========================

export const createConversation = async (title = "New Chat") => {
  try {
    const res = await apiFetch("/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    wrapNetworkError(error);
  }
};

export const fetchConversations = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await apiFetch("/conversations", {
      method: "GET",
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      throw new Error(`Failed to fetch conversations: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    wrapNetworkError(error);
  }
};

export const fetchConversation = async (conversationId) => {
  try {
    const res = await apiFetch(`/conversations/${conversationId}`, {
      method: "GET",
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Conversation not found");
      }
      throw new Error(`Failed to fetch conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    wrapNetworkError(error);
  }
};

export const appendMessageToConversation = async (conversationId, role, content) => {
  try {
    const res = await apiFetch(`/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ role, content }),
    });

    if (!res.ok) {
      throw new Error(`Failed to append message: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (isNetworkError(error)) {
      return null;
    }
    console.error("Error appending message:", error);
  }
};

export const updateConversationTitle = async (conversationId, title) => {
  try {
    const res = await apiFetch(`/conversations/${conversationId}`, {
      method: "PUT",
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    wrapNetworkError(error);
  }
};

export const deleteConversation = async (conversationId) => {
  try {
    const res = await apiFetch(`/conversations/${conversationId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Failed to delete conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    wrapNetworkError(error);
  }
};

/**
 * Fetch all conversations with full message history.
 * Throws BackendUnavailableError when the API cannot be reached.
 */
export const fetchConversationsWithMessages = async () => {
  const conversations = await fetchConversations();
  if (!conversations?.length) {
    return [];
  }

  const results = await Promise.all(
    conversations.map(async (conversation) => {
      try {
        return await fetchConversation(conversation.id);
      } catch {
        return { ...conversation, messages: [] };
      }
    })
  );

  return results;
};

// =========================
// SYNC HELPERS
// =========================

export const migrateLocalChatsToBackend = async (localChats) => {
  const migrated = [];

  for (const localChat of localChats) {
    try {
      const conversation = await createConversation(localChat.title);

      if (localChat.messages && Array.isArray(localChat.messages)) {
        for (const msg of localChat.messages) {
          if (msg.role && msg.content) {
            await appendMessageToConversation(conversation.id, msg.role, msg.content);
          }
        }
      }

      const fullConversation = await fetchConversation(conversation.id);
      migrated.push({
        ...localChat,
        id: fullConversation.id,
        title: fullConversation.title,
        messages: fullConversation.messages || [],
      });
    } catch (error) {
      if (error instanceof BackendUnavailableError) {
        throw error;
      }
      console.error("Error migrating chat:", error);
    }
  }

  return migrated;
};
