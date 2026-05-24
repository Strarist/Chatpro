import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

const Home = () => {
  // 🧠 Load chats
  const [chats, setChats] = useState(() => {
    try {
      const saved = localStorage.getItem("chats");
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 1,
              title: "New Chat",
              messages: [{ role: "assistant", content: "Hi! Ask me anything." }],
            },
          ];
    } catch {
      return [
        {
          id: 1,
          title: "New Chat",
          messages: [{ role: "assistant", content: "Hi! Ask me anything." }],
        },
      ];
    }
  });

  // 🧠 Load active chat
  const [currentChatId, setCurrentChatId] = useState(() => {
    try {
      const saved = localStorage.getItem("currentChatId");
      return saved ? JSON.parse(saved) : 1;
    } catch {
      return 1;
    }
  });

  const currentChat = chats.find((chat) => chat.id === currentChatId);

  // 💾 Persist chats
  useEffect(() => {
    localStorage.setItem("chats", JSON.stringify(chats));
  }, [chats]);

  // 💾 Persist active chat
  useEffect(() => {
    localStorage.setItem("currentChatId", JSON.stringify(currentChatId));
  }, [currentChatId]);

  // ➕ Create new chat
  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [{ role: "assistant", content: "Hi! Ask me anything." }],
    };

    setChats((prev) => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
  };

  // ❌ Delete chat
  const deleteChat = (id) => {
    setChats((prev) => {
      const updated = prev.filter((chat) => chat.id !== id);

      if (updated.length === 0) {
        setCurrentChatId(null);
        return [];
      }

      if (id === currentChatId) {
        setCurrentChatId(updated[0].id);
      }

      return updated;
    });
  };

  // 🔄 Update messages + auto title
  const updateMessages = (updater) => {
    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id !== currentChatId) return chat;

        let newMessages;

        // ✅ handle BOTH cases
        if (typeof updater === "function") {
          newMessages = updater(chat.messages);
        } else {
          newMessages = updater;
        }

        // safety
        if (!Array.isArray(newMessages)) {
          console.error("❌ newMessages is not array:", newMessages);
          return chat;
        }

        // auto title logic
        let updatedTitle = chat.title;
        const firstUserMessage = newMessages.find((msg) => msg.role === "user");

        if (chat.title === "New Chat" && firstUserMessage) {
          updatedTitle = firstUserMessage.content.slice(0, 30);
        }

        return {
          ...chat,
          title: updatedTitle,
          messages: newMessages,
        };
      })
    );
  };

  return (
    <div className="h-screen flex bg-[#0f172a] text-white">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatId}
        createNewChat={createNewChat}
        deleteChat={deleteChat}
      />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full">
        {currentChat ? (
          <ChatWindow messages={currentChat.messages} setMessages={updateMessages} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h2 className="text-lg mb-2">No chat selected</h2>
              <p className="text-sm">Click “+ New Chat” to start a conversation</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
