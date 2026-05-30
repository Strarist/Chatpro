/**
 * Conversation persistence service.
 * 
 * Syncs conversations with the backend, restores state across refreshes,
 * and maintains consistent conversation data.
 * 
 * Architecture:
 * - Light in-memory sync for UI responsiveness
 * - Background persistence to backend
 * - Graceful fallback to localStorage if backend unavailable
 */

// Production-safe API URL (matches aiService.js pattern)
const API_URL = (() => {
  const defaultUrl = "https://chatpro-backend-lxvu.onrender.com";
  const localUrl = "http://localhost:8000";
  const hostname = typeof window !== "undefined" ? window.location.hostname : "";

  if (window.API_URL) return window.API_URL;
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (hostname === "localhost" || hostname === "127.0.0.1") return localUrl;
  return defaultUrl;
})();

// =========================
// CONVERSATION CRUD
// =========================

/**
 * Create a new conversation on the backend.
 */
export const createConversation = async (title = "New Chat") => {
  try {
    const res = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`Failed to create conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * Fetch all conversations from the backend.
 * Sorted by most recent first.
 */
export const fetchConversations = async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 s timeout
    const res = await fetch(`${API_URL}/conversations`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    if (!res.ok) {
      throw new Error(`Failed to fetch conversations: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.error("fetchConversations timeout after 10s");
    } else {
      console.error("Error fetching conversations:", error);
    }
    return [];
  }
};

/**
 * Fetch a single conversation with all its messages.
 */
export const fetchConversation = async (conversationId) => {
  try {
    const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error("Conversation not found");
      }
      throw new Error(`Failed to fetch conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error fetching conversation:", error);
    throw error;
  }
};

/**
 * Append a message to a conversation.
 * Non-blocking: returns immediately for UI responsiveness.
 */
export const appendMessageToConversation = async (conversationId, role, content) => {
  try {
    const res = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ role, content }),
    });

    if (!res.ok) {
      throw new Error(`Failed to append message: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error appending message:", error);
    // Non-blocking: log but don't throw
  }
};

/**
 * Update conversation metadata (title).
 */
export const updateConversationTitle = async (conversationId, title) => {
  try {
    const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      throw new Error(`Failed to update conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error updating conversation:", error);
    throw error;
  }
};

/**
 * Delete a conversation and all its messages.
 */
export const deleteConversation = async (conversationId) => {
  try {
    const res = await fetch(`${API_URL}/conversations/${conversationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to delete conversation: ${res.statusText}`);
    }

    return await res.json();
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

// =========================
// SYNC HELPERS
// =========================

/**
 * Migrate local chats to backend.
 * Used on first sync to preserve user's existing local chats.
 */
export const migrateLocalChatsToBackend = async (localChats) => {
  const migrated = [];
  
  for (const localChat of localChats) {
    try {
      // Create conversation
      const conversation = await createConversation(localChat.title);
      
      // Append all messages
      if (localChat.messages && Array.isArray(localChat.messages)) {
        for (const msg of localChat.messages) {
          if (msg.role && msg.content) {
            await appendMessageToConversation(
              conversation.id,
              msg.role,
              msg.content
            );
          }
        }
      }
      
      migrated.push({
        ...localChat,
        id: conversation.id,
      });
    } catch (error) {
      console.error("Error migrating chat:", error);
      // Continue with other chats
    }
  }
  
  return migrated;
};
