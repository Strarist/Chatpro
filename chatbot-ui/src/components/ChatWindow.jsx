import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import { useEffect, useRef, useState } from "react";
import { streamAIResponse } from "../services/aiService";

const ChatWindow = ({ messages = [], setMessages }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [input, setInput] = useState("");

  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const activeRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      controllerRef.current?.abort();
    };
  }, []);


  // =========================
  // ✅ AUTO SCROLL
  // =========================
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, [messages]);

  const [activeVersionMap, setActiveVersionMap] = useState({});

  const generateId = () => {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  };

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const sendMessage = async (content) => {
    if (!content.trim() || isLoading) return;
    const requestId = activeRequestIdRef.current + 1;
    activeRequestIdRef.current = requestId;
  
    let updatedMessages;
    const editIdx = editingIndex;

    // ✅ EDIT & RESEND: drop edited message + everything after, then new user turn
    if (editIdx !== null) {
      const trimmed = messages.slice(0, editIdx);
      const userId = generateId();
      updatedMessages = [
        ...trimmed,
        { id: userId, role: "user", content: content.trim() },
      ];
      setEditingIndex(null);
      setEditingText("");
      setActiveVersionMap({});
    } else {
      const userId = generateId();
      updatedMessages = [
        ...messages,
        { id: userId, role: "user", content: content.trim() },
      ];
    }

    setMessages(updatedMessages);
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // ✅ Add assistant placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: generateId(),
          role: "assistant",
          content: "",
          isStreaming: true,
          parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
        },
      ]);
  
      await streamAIResponse(
        updatedMessages,
        (incomingText) => {
          if (
            !isMountedRef.current ||
            requestId !== activeRequestIdRef.current
          ) {
            return;
          }
          setMessages((prev) => {
            const updated = [...prev];
            if (!updated.length) return updated;
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: incomingText,
              isStreaming: true,
            };
            return updated;
          });
        },
        controllerRef.current
      );
  
      // finish streaming
      setMessages((prev) => {
        const updated = [...prev];
        if (!updated.length) return updated;
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
        return updated;
      });
  
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "⚠️ Error generating response" },
        ]);
      }
    } finally {
      if (isMountedRef.current && requestId === activeRequestIdRef.current) {
        setIsLoading(false);
      }
      if (controllerRef.current?.signal?.aborted || requestId === activeRequestIdRef.current) {
        controllerRef.current = null;
      }
    }
  };

  // =========================
  // 🛑 STOP GENERATION
  // =========================
  const stopGeneration = () => {
    activeRequestIdRef.current += 1;
    controllerRef.current?.abort();
    controllerRef.current = null;

    setMessages((prev) => {
      const updated = [...prev];
      if (updated.length) {
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          isStreaming: false,
        };
      }
      return updated;
    });

    setIsLoading(false);
  };

  // =========================
  // ✏️ START EDIT
  // =========================
  const handleEdit = (index, text) => {
    setEditingIndex(index);
    setEditingText(text ?? "");
  };

  // =========================
  // 🔄 REGENERATE
  // =========================
  const regenerateResponse = async () => {
    if (isLoading) return;
  
    controllerRef.current?.abort();
  
    // ✅ DO NOT remove old assistant messages
    const baseMessages = [...messages];
  
    // find last user message
    const lastUserIndex = [...baseMessages]
      .reverse()
      .findIndex((m) => m.role === "user");
  
    if (lastUserIndex === -1) return;
  
    const realIndex = baseMessages.length - 1 - lastUserIndex;
    const lastUser = baseMessages[realIndex];
  
    setIsLoading(true);
  
    try {
      controllerRef.current = new AbortController();
  
      // ✅ Create NEW assistant message (branch)
      const newAssistantId = generateId();
      const parentKey =
        lastUser.id != null ? lastUser.id : `__user_slot_${realIndex}`;

      setMessages((prev) => [
        ...prev,
        {
          id: newAssistantId,
          role: "assistant",
          content: "",
          isStreaming: true,
          parentId: parentKey,
        },
      ]);

      setActiveVersionMap((prev) => ({
        ...prev,
        [parentKey]: newAssistantId,
      }));
  
      await streamAIResponse(
        baseMessages,
        (incomingText) => {
          setMessages((prev) => {
            const updated = [...prev];
  
            updated[updated.length - 1] = {
              ...updated[updated.length - 1],
              content: incomingText,
              isStreaming: true,
            };
  
            return updated;
          });
        },
        controllerRef.current
      );
  
      // finish streaming
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].isStreaming = false;
        return updated;
      });
  
    } finally {
      setIsLoading(false);
    }
  };

  const getVersions = (messages) => {
    const map = {};
  
    messages.forEach((msg) => {
      if (msg.role === "assistant" && msg.parentId) {
        if (!map[msg.parentId]) {
          map[msg.parentId] = [];
        }
        map[msg.parentId].push(msg);
      }
    });
  
    return map;
  };
  
  const versionMap = getVersions(messages);

  return (
    <div className="flex flex-col h-full items-center">

      {/* Messages */}
      <div
        ref={containerRef}
        className="w-full max-w-3xl flex-1 overflow-y-auto px-4 py-6 space-y-6"
      >
        {messages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <MessageBubble
                key={msg.id ?? `user-${i}`}
                message={msg}
                onEdit={() => handleEdit(i, msg.content)}
              />
            );
          }

          // Assistant: no parentId → show as-is (legacy / welcome / error bubbles)
          if (!msg.parentId) {
            return (
              <MessageBubble
                key={msg.id ?? `assistant-${i}`}
                message={msg}
                onRegenerate={regenerateResponse}
              />
            );
          }

          const siblings = versionMap[msg.parentId] || [];
          if (!siblings.length) {
            return (
              <MessageBubble
                key={msg.id ?? `assistant-${i}`}
                message={msg}
                onRegenerate={regenerateResponse}
              />
            );
          }

          const latest = siblings[siblings.length - 1];
          const mappedId = activeVersionMap[msg.parentId];
          const activeId =
            mappedId && siblings.some((s) => s.id === mappedId)
              ? mappedId
              : latest?.id;
          if (!activeId || msg.id !== activeId) return null;

          const currentIndex = Math.max(
            0,
            siblings.findIndex((s) => s.id === activeId)
          );

          return (
            <MessageBubble
              key={msg.id ?? `assistant-${i}`}
              message={msg}
              onRegenerate={regenerateResponse}
              versionIndex={currentIndex}
              totalVersions={siblings.length}
              onPrev={() => {
                if (currentIndex > 0) {
                  setActiveVersionMap((prev) => ({
                    ...prev,
                    [msg.parentId]: siblings[currentIndex - 1].id,
                  }));
                }
              }}
              onNext={() => {
                if (currentIndex < siblings.length - 1) {
                  setActiveVersionMap((prev) => ({
                    ...prev,
                    [msg.parentId]: siblings[currentIndex + 1].id,
                  }));
                }
              }}
            />
          );
        })}
      </div>

      {/* Input */}
      <div className="w-full max-w-3xl px-4 pb-6">
      <InputBox
        value={editingIndex !== null ? editingText : input}
        setValue={(val) => {
          if (editingIndex !== null) setEditingText(val);
          else setInput(val);
        }}
        onSend={sendMessage}
        onStop={stopGeneration}
        isLoading={isLoading}
      />
      </div>
    </div>
  );
};

export default ChatWindow;