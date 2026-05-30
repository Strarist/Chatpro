import { useState, useEffect, useMemo } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import {
  createConversation,
  fetchConversations,
  updateConversationTitle,
  deleteConversation,
  migrateLocalChatsToBackend,
} from "./services/conversationService";

const STORAGE_KEYS = {
  chats: "chatpro.chats",
  activeChatId: "chatpro.activeChatId",
  hasStartedChat: "chatpro.hasStartedChat",
  backendSynced: "chatpro.backendSynced",
};

const isLocalhost =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_URL = isLocalhost
  ? "http://localhost:8000"
  : import.meta.env.VITE_API_URL || "https://chatpro-backend-lxvu.onrender.com";

if (typeof window !== "undefined") {
  window.API_URL = API_URL;
}

// =========================
// 🧠 DEFAULT CHAT FACTORY
// =========================
const createDefaultChat = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : "chat_" + Date.now(),
  title: "New Chat",
  messages: [{ role: "assistant", content: "Hi! Ask me anything." }],
});

const safeJsonParse = (value, fallback) => {
  if (typeof value !== "string") return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch {
    return fallback;
  }
};

const loadChats = () => {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }

  const saved = window.localStorage.getItem(STORAGE_KEYS.chats);
  const parsed = safeJsonParse(saved, null);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
  }

  return [];
};

const loadHasStartedChat = () => {
  if (typeof window === "undefined" || !window.localStorage) return false;

  const saved = window.localStorage.getItem(STORAGE_KEYS.hasStartedChat);
  if (saved === "true") return true;

  const persistedChats = window.localStorage.getItem(STORAGE_KEYS.chats);
  if (typeof persistedChats === "string" && persistedChats.trim().length > 0) {
    const parsed = safeJsonParse(persistedChats, null);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Only consider it a started chat if there is a real conversation
      const hasReal = parsed.some(c =>
        (c.title && c.title !== "New Chat") ||
        (Array.isArray(c.messages) && c.messages.length > 1)
      );
      if (hasReal) return true;
    }
  }

  return false;
};

const loadActiveChatId = (fallbackChats) => {
  if (typeof window === "undefined" || !window.localStorage) return fallbackChats[0]?.id ?? null;
  const saved = window.localStorage.getItem(STORAGE_KEYS.activeChatId);
  if (saved) {
    return saved;
  }
  return fallbackChats[0]?.id ?? null;
};

// Convert backend conversation to frontend chat format
const conversationToChatFormat = (conversation) => ({
  id: conversation.id,
  title: conversation.title,
  messages: conversation.messages || [],
});

function App() {
  // =========================
  // 🧠 STATE
  // =========================
  const [showChat, setShowChat] = useState(() => loadHasStartedChat());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [useBackend, setUseBackend] = useState(true);

  // Initial load from localStorage as fallback
  const initialChats = loadChats();
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState(() => loadActiveChatId(initialChats));

  // =========================
  // 🔄 LOAD BACKEND CONVERSATIONS (on mount)
  // =========================
  useEffect(() => {
    const syncFromBackend = async () => {
      try {
        const conversations = await fetchConversations();
        
        if (!conversations || conversations.length === 0) {
          // Backend empty: migrate local chats if available
          const backendSynced = window.localStorage?.getItem(STORAGE_KEYS.backendSynced) === "true";
          
          if (!backendSynced && initialChats.length > 0 && initialChats[0].title !== "New Chat") {
            // Don't migrate default empty chat
            const hasRealChats = initialChats.some(c => c.messages?.length > 1 || c.title !== "New Chat");
            if (hasRealChats) {
              const migrated = await migrateLocalChatsToBackend(initialChats);
              setChats(migrated);
              setActiveChatId(migrated[0]?.id || initialChats[0]?.id);
              window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");
              return;
            }
          }
          
          setShowChat(false);
          setUseBackend(false);
          setIsLoadingChats(false);
          return;
        }

        // Convert backend format to frontend format
        const formattedChats = conversations.map(conversationToChatFormat);
        setChats(formattedChats);
        
        // Restore active chat or use first
        const savedActiveChatId = window.localStorage?.getItem(STORAGE_KEYS.activeChatId);
        if (savedActiveChatId && formattedChats.some(c => c.id === savedActiveChatId)) {
          setActiveChatId(savedActiveChatId);
        } else {
          setActiveChatId(formattedChats[0]?.id);
        }
        
        setUseBackend(true);
        window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");
      } catch (error) {
        console.error("Failed to load from backend, falling back to localStorage:", error);
        setUseBackend(false);
        setChats(initialChats);
        setShowChat(false);
      } finally {
        setIsLoadingChats(false);
      }
    };

    syncFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================
  // 🧠 DERIVE ACTIVE CHAT
  // =========================
  const activeChat = useMemo(() => {
    if (!chats.length) return null;

    const found = chats.find((c) => c.id === activeChatId);
    return found || chats[0];
  }, [chats, activeChatId]);

  // =========================
  // 💾 SAVE CHATS (localStorage + backend)
  // =========================
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
  }, [chats]);

  // =========================
  // 💾 SAVE ACTIVE CHAT ID
  // =========================
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (activeChat?.id !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS.activeChatId, String(activeChat.id));
    }
  }, [activeChat]);

  // =========================
  // 💾 SAVE LANDING VISIT STATE
  // =========================
  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, showChat ? "true" : "false");
  }, [showChat]);

  // =========================
  // 📝 UPDATE MESSAGES
  // =========================
  const updateMessages = (newMessages) => {
    if (!activeChat) return;

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChat.id) return chat;

        const resolved =
          typeof newMessages === "function" ? newMessages(chat.messages) : newMessages;

        if (!Array.isArray(resolved)) return chat;

        let updatedTitle = chat.title;

        if (chat.title === "New Chat") {
          const firstUser = resolved.find((m) => m.role === "user");
          if (firstUser?.content) {
            updatedTitle =
              firstUser.content.slice(0, 40).trim() + (firstUser.content.length > 40 ? "..." : "");
          }
        }

        // Sync updated title to backend
        if (useBackend && updatedTitle !== chat.title) {
          updateConversationTitle(chat.id, updatedTitle).catch(console.error);
        }

        return {
          ...chat,
          messages: resolved,
          title: updatedTitle,
        };
      })
    );
  };

  // =========================
  // ➕ CREATE NEW CHAT
  // =========================
  const createNewChat = async () => {
    if (useBackend) {
      try {
        const conversation = await createConversation("New Chat");
        const newChat = conversationToChatFormat(conversation);
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
      } catch (error) {
        console.error("Error creating conversation on backend:", error);
        // Fallback to local
        const newChat = createDefaultChat();
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
      }
    } else {
      const newChat = createDefaultChat();
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChat.id);
    }
    
    setShowChat(true);
    setIsSidebarOpen(false);
  };

  // =========================
  // ❌ DELETE CHAT
  // =========================
  const deleteChat = async (id) => {
    if (useBackend) {
      try {
        await deleteConversation(id);
      } catch (error) {
        console.error("Error deleting conversation on backend:", error);
      }
    }

    setChats((prev) => {
      const updated = prev.filter((chat) => chat.id !== id);

      if (!updated.length) {
        // No chats left; clear active chat
        setActiveChatId(null);
        return [];
      }

      if (id === activeChatId) {
        setActiveChatId(updated[0].id);
      }

      return updated;
    });
  };

  const handleStartChat = () => {
    if (!activeChat?.id) {
      const baseChat = chats[0] ?? createDefaultChat();
      setActiveChatId(baseChat.id);
    }
    setShowChat(true);
  };

  if (isLoadingChats) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white">
        <div className="text-center">
          <h2 className="mb-2 text-lg">Loading conversations...</h2>
        </div>
      </div>
    );
  }

  if (!showChat) {
    return <LandingPage onStartChat={handleStartChat} />;
  }

  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-[#0f172a] text-white sm:h-[100dvh]">
      {isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        setActiveChatId={setActiveChatId}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        isOpen={isSidebarOpen}
        onCloseMobile={() => setIsSidebarOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {activeChat ? (
          <ChatWindow
            key={activeChat.id}
            conversationId={useBackend ? activeChat.id : null}
            messages={activeChat.messages}
            setMessages={updateMessages}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <h2 className="mb-2 text-lg">No chats yet</h2>
              <p className="text-sm">Click &quot;New Chat&quot; to start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
