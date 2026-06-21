import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import LandingPage from "./pages/LandingPage";
import { getOrCreateClientId } from "./utils/clientId";
import { BackendUnavailableError, checkBackendHealth } from "./utils/apiClient";
import {
  createConversation,
  fetchConversationsWithMessages,
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

const createDefaultChat = () => ({
  id: crypto.randomUUID ? crypto.randomUUID() : "chat_" + Date.now(),
  title: "New Chat",
  messages: [],
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

  const chats = loadChats();
  const saved = window.localStorage.getItem(STORAGE_KEYS.hasStartedChat);

  if (saved === "true") {
    // Ignore stale flag left by earlier builds when there is nothing to restore
    return chats.length > 0;
  }

  if (chats.length > 0) {
    return chats.some(
      (c) =>
        (c.title && c.title !== "New Chat") ||
        (Array.isArray(c.messages) && c.messages.length > 0)
    );
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

const mapBackendMessage = (message) => ({
  id: message.id || `msg_${message.role}_${Date.now()}`,
  role: message.role,
  content: message.content,
});

const conversationToChatFormat = (conversation, localChats = []) => {
  const local = localChats.find((chat) => chat.id === conversation.id);
  const backendMessages = (conversation.messages || []).map(mapBackendMessage);
  const localMessages = local?.messages || [];
  const messages =
    backendMessages.length >= localMessages.length ? backendMessages : localMessages;

  return {
    id: conversation.id,
    title: conversation.title,
    messages,
  };
};

function App() {
  const [showChat, setShowChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [useBackend, setUseBackend] = useState(true);
  const [backendConnected, setBackendConnected] = useState(false);
  const autoCreateAttemptedRef = useRef(false);

  useEffect(() => {
    getOrCreateClientId();
  }, []);

  useEffect(() => {
    if (showChat) {
      window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, "true");
    }
  }, [showChat]);

  const initialChats = loadChats();
  const [chats, setChats] = useState(initialChats);
  const [activeChatId, setActiveChatId] = useState(() => loadActiveChatId(initialChats));

  useEffect(() => {
    const syncFromBackend = async () => {
      const shouldRestoreWorkspace = loadHasStartedChat();

      try {
        const backendOnline = await checkBackendHealth();
        if (!backendOnline) {
          setUseBackend(false);
          setBackendConnected(false);
          setChats(initialChats);
          setShowChat(shouldRestoreWorkspace);
          if (shouldRestoreWorkspace && initialChats.length > 0) {
            setActiveChatId(loadActiveChatId(initialChats));
          }
          return;
        }

        const conversations = await fetchConversationsWithMessages();

        if (!conversations || conversations.length === 0) {
          const backendSynced =
            window.localStorage?.getItem(STORAGE_KEYS.backendSynced) === "true";

          if (!backendSynced && initialChats.length > 0) {
            const hasRealChats = initialChats.some(
              (c) => c.messages?.length > 0 || c.title !== "New Chat"
            );
            if (hasRealChats) {
              const migrated = await migrateLocalChatsToBackend(initialChats);
              setChats(migrated);
              setActiveChatId(migrated[0]?.id || initialChats[0]?.id);
              setShowChat(true);
              setUseBackend(true);
              setBackendConnected(true);
              window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");
              return;
            }
          }

          setUseBackend(true);
          setBackendConnected(true);
          setShowChat(shouldRestoreWorkspace);
          if (shouldRestoreWorkspace && initialChats.length > 0) {
            setChats(initialChats);
            setActiveChatId(loadActiveChatId(initialChats));
          }
          return;
        }

        const formattedChats = conversations.map((conversation) =>
          conversationToChatFormat(conversation, initialChats)
        );
        setChats(formattedChats);

        const savedActiveChatId = window.localStorage?.getItem(STORAGE_KEYS.activeChatId);
        if (savedActiveChatId && formattedChats.some((c) => c.id === savedActiveChatId)) {
          setActiveChatId(savedActiveChatId);
        } else {
          setActiveChatId(formattedChats[0]?.id);
        }

        setUseBackend(true);
        setBackendConnected(true);
        setShowChat(true);
        window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          console.warn("Backend unavailable — running in local-only mode.");
        } else {
          console.error("Failed to load from backend, falling back to localStorage:", error);
        }
        setUseBackend(false);
        setBackendConnected(false);
        setChats(initialChats);
        setShowChat(shouldRestoreWorkspace);
        if (shouldRestoreWorkspace && initialChats.length > 0) {
          setActiveChatId(loadActiveChatId(initialChats));
        }
      } finally {
        setIsLoadingChats(false);
      }
    };

    syncFromBackend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeChat = useMemo(() => {
    if (!chats.length) return null;

    const found = chats.find((c) => c.id === activeChatId);
    return found || chats[0];
  }, [chats, activeChatId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (activeChat?.id !== undefined) {
      window.localStorage.setItem(STORAGE_KEYS.activeChatId, String(activeChat.id));
    }
  }, [activeChat]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, showChat ? "true" : "false");
  }, [showChat]);

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
              firstUser.content.slice(0, 40).trim() +
              (firstUser.content.length > 40 ? "..." : "");
          }
        }

        if (useBackend && updatedTitle !== chat.title) {
          updateConversationTitle(chat.id, updatedTitle).catch((error) => {
            if (error instanceof BackendUnavailableError) {
              setUseBackend(false);
              setBackendConnected(false);
              return;
            }
            console.error(error);
          });
        }

        return {
          ...chat,
          messages: resolved,
          title: updatedTitle,
        };
      })
    );
  };

  const createNewChat = useCallback(async () => {
    if (useBackend) {
      try {
        const conversation = await createConversation("New Chat");
        const newChat = conversationToChatFormat(conversation);
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          console.warn("Backend unavailable — new chat saved locally only.");
          setUseBackend(false);
          setBackendConnected(false);
        } else {
          console.error("Error creating conversation on backend:", error);
        }
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
  }, [useBackend]);

  useEffect(() => {
    if (isLoadingChats || !showChat || chats.length > 0 || autoCreateAttemptedRef.current) {
      return;
    }

    autoCreateAttemptedRef.current = true;
    createNewChat();
  }, [chats.length, createNewChat, isLoadingChats, showChat]);

  const deleteChat = async (id) => {
    if (useBackend) {
      try {
        await deleteConversation(id);
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          setUseBackend(false);
          setBackendConnected(false);
        } else {
          console.error("Error deleting conversation on backend:", error);
        }
      }
    }

    setChats((prev) => {
      const updated = prev.filter((chat) => chat.id !== id);

      if (!updated.length) {
        setActiveChatId(null);
        return [];
      }

      if (id === activeChatId) {
        setActiveChatId(updated[0].id);
      }

      return updated;
    });
  };

  const handleStartChat = async () => {
    setShowChat(true);
    window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, "true");

    if (!chats.length) {
      await createNewChat();
      return;
    }

    if (!activeChat?.id) {
      setActiveChatId(chats[0]?.id ?? null);
    }
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
        backendConnected={backendConnected}
      />

      <div className="flex min-w-0 flex-1 flex-col border-l border-slate-800/60">
        {activeChat ? (
          <ChatWindow
            key={activeChat.id}
            conversationId={useBackend ? activeChat.id : null}
            chatTitle={activeChat.title}
            backendConnected={backendConnected}
            messages={activeChat.messages}
            setMessages={updateMessages}
            onOpenSidebar={() => setIsSidebarOpen(true)}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-400">
            <div className="text-center">
              <h2 className="mb-2 text-lg">Starting your workspace...</h2>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
