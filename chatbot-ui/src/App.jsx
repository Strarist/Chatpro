import { useState, useEffect, useMemo } from "react";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";

// =========================
// 🧠 DEFAULT CHAT FACTORY
// =========================
const createDefaultChat = () => ({
  id: Date.now(),
  title: "New Chat",
  messages: [
    { role: "assistant", content: "Hi! Ask me anything." },
  ],
});

function App() {

  // =========================
  // 🧠 LOAD CHATS
  // =========================
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem("chats");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error("Failed to parse chats:", err);
    }

    return [];
  });

  // =========================
  // 🧠 ACTIVE CHAT ID
  // =========================
  const [activeChatId, setActiveChatId] = useState(() => {
    const saved = localStorage.getItem("activeChatId");
    return saved ? Number(saved) : null;
  });

  // =========================
  // 🧠 DERIVE ACTIVE CHAT
  // =========================
  const activeChat = useMemo(() => {
    if (!chats.length) return null;

    const found = chats.find((c) => c.id === activeChatId);
    return found || chats[0];
  }, [chats, activeChatId]);

  // =========================
  // 💾 SAVE CHATS
  // =========================
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // =========================
  // 💾 SAVE ACTIVE CHAT ID
  // =========================
  useEffect(() => {
    if (activeChat?.id !== undefined) {
      localStorage.setItem("activeChatId", activeChat.id.toString());
    }
  }, [activeChat]);

  // =========================
  // 📝 UPDATE MESSAGES
  // =========================
  const updateMessages = (newMessages) => {
    if (!activeChat) return;

    setChats((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChat.id) return chat;

        const resolved =
          typeof newMessages === "function"
            ? newMessages(chat.messages)
            : newMessages;

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
  const createNewChat = () => {
    const newChat = createDefaultChat();

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  // =========================
  // ❌ DELETE CHAT
  // =========================
  const deleteChat = (id) => {
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

  return (
    <div className="flex h-screen bg-[#0f172a] text-white">

      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={activeChat?.id}
        setActiveChatId={setActiveChatId}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
      />

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">

        {activeChat ? (
          <ChatWindow
            key={activeChat.id}
            messages={activeChat.messages}
            setMessages={updateMessages}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <h2 className="text-lg mb-2">No chats yet</h2>
              <p className="text-sm">
                Click “New Chat” to start a conversation
              </p>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}

export default App;