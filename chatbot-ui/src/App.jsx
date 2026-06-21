import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import EmptyWorkspace from "./components/EmptyWorkspace";
import LandingPage from "./pages/LandingPage";
import { getOrCreateClientId } from "./utils/clientId";
import { BackendUnavailableError, checkBackendHealth } from "./utils/apiClient";
import {
  createConversation,
  fetchConversations,
  fetchConversation,
  updateConversationTitle,
  deleteConversation,
  migrateLocalChatsToBackend,
} from "./services/conversationService";
import {
  formatChatForShare,
  loadChatMetadata,
  saveChatMetadata,
  toggleChatPin,
} from "./utils/chatMetadata";
import {
  conversationToChatFormat,
  findReusableEmptyChat,
  mergeConversationList,
  normalizeLoadedChat,
  shouldPersistChats,
  sidebarChatsEqual,
  toSidebarChat,
} from "./utils/appChatUtils";

const STORAGE_KEYS = {
  chats: "chatpro.chats",
  activeChatId: "chatpro.activeChatId",
  hasStartedChat: "chatpro.hasStartedChat",
  backendSynced: "chatpro.backendSynced",
};

const PERSIST_DEBOUNCE_MS = 300;

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
  messagesLoaded: true,
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
    return parsed.map(normalizeLoadedChat);
  }

  return [];
};

const loadHasStartedChat = () => {
  if (typeof window === "undefined" || !window.localStorage) return false;

  const chats = loadChats();
  const saved = window.localStorage.getItem(STORAGE_KEYS.hasStartedChat);

  if (saved === "true") {
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

let initialChatsSnapshot;
const getInitialChats = () => {
  if (initialChatsSnapshot === undefined) {
    initialChatsSnapshot = loadChats();
  }
  return initialChatsSnapshot;
};

function App() {
  const [showChat, setShowChat] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [useBackend, setUseBackend] = useState(true);
  const [pinnedIds, setPinnedIds] = useState(() => loadChatMetadata().pinnedIds);
  const [chats, setChats] = useState(getInitialChats);
  const [activeChatId, setActiveChatId] = useState(() => loadActiveChatId(getInitialChats()));
  const [sidebarChats, setSidebarChats] = useState(() => getInitialChats().map(toSidebarChat));

  const persistTimerRef = useRef(null);
  const chatsRef = useRef(getInitialChats());
  const activeChatIdRef = useRef(activeChatId);
  const hydratingPromisesRef = useRef(new Map());

  useEffect(() => {
    getOrCreateClientId();
  }, []);

  useEffect(() => {
    chatsRef.current = chats;
  }, [chats]);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    if (showChat) {
      window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, "true");
    }
  }, [showChat]);

  const hydrateChatMessages = useCallback(async (chatId) => {
    if (!chatId) return null;

    const target = chatsRef.current.find((chat) => chat.id === chatId);
    if (target?.messagesLoaded) return target;

    const inFlight = hydratingPromisesRef.current.get(chatId);
    if (inFlight) return inFlight;

    const promise = (async () => {
      try {
        const conversation = await fetchConversation(chatId);
        const hydrated = conversationToChatFormat(conversation, chatsRef.current, true);

        setChats((prev) =>
          prev.map((chat) => (chat.id === chatId ? hydrated : chat))
        );

        return hydrated;
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          setUseBackend(false);
          return chatsRef.current.find((chat) => chat.id === chatId) || null;
        }
        console.error("Failed to load conversation messages:", error);
        return chatsRef.current.find((chat) => chat.id === chatId) || null;
      } finally {
        hydratingPromisesRef.current.delete(chatId);
      }
    })();

    hydratingPromisesRef.current.set(chatId, promise);
    return promise;
  }, []);

  useEffect(() => {
    const syncFromBackend = async () => {
      const initialChats = getInitialChats();
      const shouldRestoreWorkspace = loadHasStartedChat();

      try {
        const backendOnline = await checkBackendHealth();
        if (!backendOnline) {
          setUseBackend(false);
          setChats(initialChats);
          setShowChat(shouldRestoreWorkspace);
          if (shouldRestoreWorkspace && initialChats.length > 0) {
            setActiveChatId(loadActiveChatId(initialChats));
          }
          return;
        }

        const conversations = await fetchConversations();

        if (!conversations || conversations.length === 0) {
          const backendSynced =
            window.localStorage?.getItem(STORAGE_KEYS.backendSynced) === "true";

          if (!backendSynced && initialChats.length > 0) {
            const hasRealChats = initialChats.some(
              (c) => c.messages?.length > 0 || c.title !== "New Chat"
            );
            if (hasRealChats) {
              const migrated = await migrateLocalChatsToBackend(initialChats);
              const formatted = migrated.map((chat) => ({
                ...chat,
                messagesLoaded: true,
              }));
              setChats(formatted);
              setActiveChatId(formatted[0]?.id || initialChats[0]?.id);
              setShowChat(true);
              setUseBackend(true);
              window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");
              return;
            }
          }

          setUseBackend(true);
          setShowChat(shouldRestoreWorkspace);
          if (shouldRestoreWorkspace && initialChats.length > 0) {
            setChats(initialChats);
            setActiveChatId(loadActiveChatId(initialChats));
          }
          return;
        }

        const savedActiveChatId = window.localStorage?.getItem(STORAGE_KEYS.activeChatId);
        const formattedChats = mergeConversationList(
          conversations,
          initialChats,
          savedActiveChatId
        );
        setChats(formattedChats);

        const nextActiveId =
          savedActiveChatId && formattedChats.some((c) => c.id === savedActiveChatId)
            ? savedActiveChatId
            : formattedChats[0]?.id ?? null;

        setActiveChatId(nextActiveId);
        setUseBackend(true);
        setShowChat(true);
        window.localStorage?.setItem(STORAGE_KEYS.backendSynced, "true");

        if (nextActiveId) {
          await hydrateChatMessages(nextActiveId);
        }
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          console.warn("Backend unavailable — running in local-only mode.");
        } else {
          console.error("Failed to load from backend, falling back to localStorage:", error);
        }
        setUseBackend(false);
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
    if (!activeChatId) return null;
    return chats.find((c) => c.id === activeChatId) || null;
  }, [chats, activeChatId]);

  useEffect(() => {
    const next = chats.map(toSidebarChat);
    setSidebarChats((prev) => (sidebarChatsEqual(prev, next) ? prev : next));
  }, [chats]);

  useEffect(() => {
    if (!activeChatId || chats.length === 0) return;

    const exists = chats.some((chat) => chat.id === activeChatId);
    if (!exists) {
      setActiveChatId(chats[0]?.id ?? null);
    }
  }, [activeChatId, chats]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (!shouldPersistChats(chats)) return;

    if (persistTimerRef.current) {
      window.clearTimeout(persistTimerRef.current);
    }

    persistTimerRef.current = window.setTimeout(() => {
      if (!shouldPersistChats(chatsRef.current)) return;
      window.localStorage.setItem(STORAGE_KEYS.chats, JSON.stringify(chatsRef.current));
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimerRef.current) {
        window.clearTimeout(persistTimerRef.current);
      }
    };
  }, [chats]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    if (activeChatId) {
      window.localStorage.setItem(STORAGE_KEYS.activeChatId, String(activeChatId));
    } else {
      window.localStorage.removeItem(STORAGE_KEYS.activeChatId);
    }
  }, [activeChatId]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, showChat ? "true" : "false");
  }, [showChat]);

  useEffect(() => {
    if (!useBackend || !activeChatId) return;
    const target = chats.find((chat) => chat.id === activeChatId);
    if (target && !target.messagesLoaded) {
      hydrateChatMessages(activeChatId);
    }
  }, [activeChatId, chats, hydrateChatMessages, useBackend]);

  const updateMessages = useCallback(
    (newMessages) => {
      if (!activeChatId) return;

      setChats((prev) =>
        prev.map((chat) => {
          if (chat.id !== activeChatId) return chat;

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
                return;
              }
              console.error(error);
            });
          }

          return {
            ...chat,
            messages: resolved,
            title: updatedTitle,
            messagesLoaded: true,
          };
        })
      );
    },
    [activeChatId, useBackend]
  );

  const createNewChat = useCallback(async () => {
    const reusable = findReusableEmptyChat(chatsRef.current);
    if (reusable) {
      setActiveChatId(reusable.id);
      setShowChat(true);
      setIsSidebarOpen(false);
      return;
    }

    if (useBackend) {
      try {
        const conversation = await createConversation("New Chat");
        const newChat = {
          ...conversationToChatFormat(conversation, [], true),
          messagesLoaded: true,
        };
        setChats((prev) => [newChat, ...prev]);
        setActiveChatId(newChat.id);
      } catch (error) {
        if (error instanceof BackendUnavailableError) {
          console.warn("Backend unavailable — new chat saved locally only.");
          setUseBackend(false);
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

  const deleteChat = useCallback(
    async (id) => {
      if (useBackend) {
        try {
          await deleteConversation(id);
        } catch (error) {
          if (error instanceof BackendUnavailableError) {
            setUseBackend(false);
          } else {
            console.error("Error deleting conversation on backend:", error);
          }
        }
      }

      setPinnedIds((prev) => {
        if (!prev.includes(id)) return prev;
        const next = prev.filter((pinnedId) => pinnedId !== id);
        saveChatMetadata({ pinnedIds: next });
        return next;
      });

      setChats((prev) => {
        const updated = prev.filter((chat) => chat.id !== id);

        if (!updated.length) {
          setActiveChatId(null);
          return [];
        }

        if (id === activeChatIdRef.current) {
          setActiveChatId(updated[0].id);
        }

        return updated;
      });
    },
    [useBackend]
  );

  const renameChat = useCallback(
    async (id, title) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      setChats((prev) =>
        prev.map((chat) => (chat.id === id ? { ...chat, title: trimmed } : chat))
      );

      if (useBackend) {
        try {
          await updateConversationTitle(id, trimmed);
        } catch (error) {
          if (error instanceof BackendUnavailableError) {
            setUseBackend(false);
            return;
          }
          console.error("Error renaming conversation:", error);
        }
      }
    },
    [useBackend]
  );

  const togglePinChat = useCallback((id) => {
    const metadata = toggleChatPin(id);
    setPinnedIds(metadata.pinnedIds);
  }, []);

  const shareChat = useCallback(
    async (chat) => {
      let target = chatsRef.current.find((item) => item.id === chat.id) || chat;

      if (useBackend && !target.messagesLoaded) {
        target = (await hydrateChatMessages(target.id)) || target;
      }

      const text = formatChatForShare(target);
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(text);
    },
    [hydrateChatMessages, useBackend]
  );

  const handleSelectChat = useCallback((id) => {
    setActiveChatId(id);
  }, []);

  const handleStartChat = useCallback(async () => {
    setShowChat(true);
    window.localStorage.setItem(STORAGE_KEYS.hasStartedChat, "true");

    const reusable = findReusableEmptyChat(chatsRef.current);
    if (reusable) {
      setActiveChatId(reusable.id);
      return;
    }

    if (!chatsRef.current.length) {
      await createNewChat();
      return;
    }

    if (!activeChatIdRef.current) {
      setActiveChatId(chatsRef.current[0]?.id ?? null);
    }
  }, [createNewChat]);

  const handleCloseSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  const handleOpenSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

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
          onClick={handleCloseSidebar}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          aria-label="Close sidebar"
        />
      )}

      <Sidebar
        chats={sidebarChats}
        activeChatId={activeChatId}
        pinnedIds={pinnedIds}
        setActiveChatId={handleSelectChat}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
        renameChat={renameChat}
        togglePinChat={togglePinChat}
        shareChat={shareChat}
        isOpen={isSidebarOpen}
        onCloseMobile={handleCloseSidebar}
      />

      <div className="flex min-w-0 flex-1 flex-col border-l border-slate-800/60">
        {activeChat ? (
          <ChatWindow
            key={activeChat.id}
            conversationId={useBackend ? activeChat.id : null}
            chatTitle={activeChat.title}
            messages={activeChat.messages}
            setMessages={updateMessages}
            onOpenSidebar={handleOpenSidebar}
          />
        ) : (
          <EmptyWorkspace onNewChat={createNewChat} onOpenSidebar={handleOpenSidebar} />
        )}
      </div>
    </div>
  );
}

export default App;
