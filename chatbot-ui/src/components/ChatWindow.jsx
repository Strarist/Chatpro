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

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    
    if (isNearBottom) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      });
    }
  }, [messages]);

  const [activeVersionMap, setActiveVersionMap] = useState({});

  const generateId = () => {
    return "msg_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  };

  // =========================
  // 🚀 SEND MESSAGE
  // =========================
  const sendMessage = async (content) => {
    const trimmedContent = String(content ?? "").trim();
    if (!trimmedContent || isLoading) return;

    if (
      messages.length &&
      messages[messages.length - 1]?.role === "user" &&
      messages[messages.length - 1]?.content === trimmedContent
    ) {
      return;
    }

    controllerRef.current?.abort();
    controllerRef.current = null;

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
      if (err.name === "AbortError") {
        return;
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];

        if (last?.role === "assistant" && last.isStreaming) {
          updated[updated.length - 1] = {
            ...last,
            content: "Something went wrong. Please try again.",
            isStreaming: false,
          };
          return updated;
        }

        return [
          ...updated,
          {
            id: generateId(),
            role: "assistant",
            content: "Something went wrong. Please try again.",
            isStreaming: false,
            parentId: updatedMessages[updatedMessages.length - 1]?.id || null,
          },
        ];
      });
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
    <div className="w-full min-h-screen flex flex-col bg-[#020617] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#020617]/80 backdrop-blur-md shadow-sm shadow-black/10 px-6 h-[60px] flex items-center justify-between text-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm shadow-blue-500/20">
            A
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold text-slate-100">ChatPro</div>
            <div className="text-xs text-gray-400">AI conversation</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
  <div className="w-8 h-8 rounded-md bg-blue-600 flex items-center justify-center text-white font-semibold">
    A
  </div>

  <div>
    <div className="text-sm font-semibold text-gray-200">ChatPro</div>
    <div className="text-xs text-gray-400">AI conversation</div>
  </div>
</div>
      </header>

      {/* Messages */}
      <div
        ref={containerRef}
        className="mx-auto flex flex-col flex-1 w-full max-w-3xl overflow-y-auto px-6 sm:px-8 md:px-10 py-6 gap-6"
      >
        {messages.length === 0 ? (
          <div className="flex flex-1 min-h-[300px] flex-col items-center justify-center text-center text-slate-400 space-y-4 py-12">
            <div className="text-5xl">💬</div>
            <div className="text-3xl font-semibold text-slate-100">ChatPro</div>
            <div className="max-w-lg text-sm text-slate-500">
              Ask anything and get instant AI-powered replies. Start the conversation by typing a question below.
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
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
          })
        )}

        {/* Typing Indicator */}
        {isLoading && !messages.some(msg => msg.role === "assistant" && msg.isStreaming) && (
          <div className="w-full flex justify-start group animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="max-w-[700px] w-full relative px-2">
              <div className="text-[11px] tracking-[0.18em] uppercase mb-2 px-1 text-left text-slate-400">
                AI
              </div>
              <div className="max-w-[70%] rounded-[28px] bg-[#0f172a] border border-[#1e293b] text-slate-100 px-6 py-5 shadow-sm shadow-black/20">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                  <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="inline-block w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-6">
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